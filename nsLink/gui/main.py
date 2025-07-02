from nicegui import ui
from uuid import uuid4

from PropertyTree import PropertyNode

from commands import commands
from event_mgr import event_mgr, command_mgr
from nodes import ident_node, imu_node

from gui.annunciators import Annunciators
from gui.nice_gauge import Airspeed, Attitude, Altitude, Heading, Power, INS_GNSS, Controls, Status

class Panel():
    def __init__(self):
        with ui.row(wrap=False).classes("w-full"):
            self.asi = Airspeed()
            self.ati = Attitude()
            self.alt = Altitude()
            self.power = Power()

        with ui.row(wrap=False).classes("w-full"):
            self.status = Status()
            self.hdg = Heading()
            self.ins_gnss = INS_GNSS()
            self.controls = Controls()

    @ui.refreshable
    async def update(self):
        self.asi.update()
        self.ati.update()
        self.alt.update()
        self.power.update()
        self.hdg.update()
        self.ins_gnss.update()
        self.controls.update()
        self.status.update()

class Map():
    def __init__(self):
        # ui.label("I'm the map!")

        # ui.context.client.content.classes('h-screen')
        # ui.context.client.content.classes('h-[100vh]')
        # ui.add_head_html('<style>.q-leaflet.flex-grow .q-field__control { height: 100% }</style>')

        # self.map = ui.leaflet(center=(51.505, -0.09)).style("width:100%; height:800px;")
        self.map = ui.leaflet(center=(51.505, -0.09)).classes("w-full h-[calc(100vh-10rem)]")
        # self.map = ui.leaflet(center=(51.505, -0.09)).classes("w-full h-full")
        # self.map = ui.leaflet(center=(51.505, -0.09)).classes("w-full flex-grow")

        # https://github.com/zauberzeug/nicegui/discussions/4049
        # self.map = ui.leaflet(center=(51.505, -0.09))
        # ui.context.client.page_container.default_slot.children[0].props(
        #     ''':style-fn="(offset, height) => ( { height: offset ? `calc(100vh - ${offset}px)` : '100vh' })"'''
        # )
        # ui.context.client.content.classes("h-full")

    @ui.refreshable
    async def update(self):
        pass

class DataBus():
    def __init__(self):
        self.data = ui.label("").classes("font-mono").style("white-space: pre-wrap")
        # user = str(uuid4())
        # avatar = f'https://robohash.org/{user}?bgset=bg2'
        # with ui.footer().classes('bg-white'):
        #     with ui.row().classes('w-full items-center'):
        #         with ui.avatar():
        #             ui.image(avatar)
        #         text = ui.input(placeholder='message') \
        #             .props('rounded outlined').classes('flex-grow') \
        #             .on('keydown.enter', send)

    @ui.refreshable
    async def update(self):
        json = PropertyNode("/").get_json_string()
        self.data.text = json

class Console():
    def __init__(self):
        user = str(uuid4())
        avatar = f'https://robohash.org/{user}?bgset=bg2'
        with ui.row().classes('w-full items-center'):
            with ui.avatar():
                ui.image(avatar)
            self.input = ui.input(label="Send command", placeholder='start typing') \
                .props('rounded outlined').classes('flex-grow') \
                .on('keydown.enter', self.send)
        self.data = ui.markdown("").classes("font-mono").style("white-space: pre-wrap")
        self.last_length = 0

    def send(self):
        commands.add(self.input.value)
        self.input.value = ""

    @ui.refreshable
    async def update(self):
        if len(command_mgr.results) > self.last_length:
            self.last_length = len(command_mgr.results)
            self.data.content = ""
            for result in reversed(command_mgr.results):
                msg = "__[%.1f]__\n" % (result[0]/1000)
                msg += "```%s```\n" % result[1]
                self.data.content += msg

class MainDisplay():
    def __init__(self):
        with ui.header(elevated=True).classes('items-center').style("font-size: 160%"):
            self.annunciator_bar = Annunciators()
            ui.space()
            with ui.dropdown_button("Panel", auto_close=True) as self.tab_menu:
                ui.item("Panel", on_click=lambda: self.my_select_tab("Panel"))
                ui.item("Map", on_click=lambda: self.my_select_tab("Map"))
                ui.item("Data Bus", on_click=lambda: self.my_select_tab("Data Bus"))
                ui.item("Console", on_click=lambda: self.my_select_tab("Console"))

            ui.button(on_click=lambda: self.right_drawer.toggle(), icon='menu').props('flat color=white')

        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as self.right_drawer:
            ui.label("Flight Notes").style("font-size: 140%")
            self.add_note = ui.input(label='Add Note', placeholder='start typing').on('keydown.enter', self.add_note)
            self.event_log = ui.markdown().style('white-space: pre-wrap')

        with ui.tabs().classes("w-full") as self.tabs:
            panel = ui.tab("Panel", icon="speed")
            map = ui.tab("Map", icon="public")
            bus = ui.tab("Data Bus", icon="feed")
            console = ui.tab("Console", icon="feed")

        self.tabs.set_visibility(False)

        with ui.tab_panels(self.tabs, value=panel).classes('w-full'):
            with ui.tab_panel(panel):
                self.panel = Panel()
                self.panel.update()
            with ui.tab_panel(map).classes("h-full"):
                self.map = Map()
                self.map.update()
            with ui.tab_panel(bus):
                self.bus = DataBus()
                self.bus.update()
            with ui.tab_panel(console):
                self.console = Console()
                self.console.update()

        ui.timer(0.1, self.panel.update.refresh)
        ui.timer(0.1, self.map.update.refresh)
        ui.timer(0.1, self.bus.update.refresh)
        ui.timer(0.1, self.console.update.refresh)

    def my_select_tab(self, name):
        self.tabs.set_value(name)
        self.tab_menu.set_text(name)
        ui.notify("Selected: " + name)

    def add_note(self):
        secs = imu_node.getUInt("millis") / 1000
        msg = "__[%.1f]__ %s" % (secs, "op: " + self.add_note.value)
        self.add_note.value = ""

        msg = "[%.1f] %s" % (secs, "op: " + self.add_note.value)
        ui.notify(msg, position="top")
        self.event_log.content = msg + "\n" + self.event_log.content

    def update(self):
        self.annunciator_bar.update()

        result = event_mgr.get_next_event()
        if result is not None:
            msg = "__[%.1f]__  ```%s```" % (result[0]/1000, result[1])
            self.event_log.content = msg + "\n" + self.event_log.content

            msg = "[%.1f] %s" % (result[0]/1000, result[1])
            ui.notify(msg, position="top")

            print(event_mgr.pending_log)

