from nicegui import ui

from PropertyTree import PropertyNode

from event_mgr import event_mgr
from nodes import ident_node

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

    @ui.refreshable
    async def update(self):
        json = PropertyNode("/").get_json_string()
        self.data.text = json

class MainDisplay():
    def __init__(self):
        with ui.header(elevated=True).classes('items-center').style("font-size: 150%"):
            self.annunciator_bar = Annunciators()
            ui.space()
            with ui.dropdown_button("Panel", auto_close=True) as self.tab_menu:
                ui.item("Panel", on_click=lambda: self.my_select_tab("Panel"))
                ui.item("Map", on_click=lambda: self.my_select_tab("Map"))
                ui.item("Data Bus", on_click=lambda: self.my_select_tab("Data Bus"))

            ui.button(on_click=lambda: self.right_drawer.toggle(), icon='menu').props('flat color=white')

        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as self.right_drawer:
            self.event_log = ui.markdown('__Flight Notes:__').style('white-space: pre-wrap')

        with ui.tabs().classes("w-full") as self.tabs:
            panel = ui.tab("Panel", icon="speed")
            map = ui.tab("Map", icon="public")
            bus = ui.tab("Data Bus", icon="feed")
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

        ui.timer(0.1, self.panel.update.refresh)
        ui.timer(0.1, self.map.update.refresh)
        ui.timer(0.1, self.bus.update.refresh)

    def my_select_tab(self, name):
        self.tabs.set_value(name)
        self.tab_menu.set_text(name)
        ui.notify("Selected: " + name)

    def update(self):
        self.annunciator_bar.update()

        result = event_mgr.get_next_event()
        if result is not None:
            msg = "__[%.1f]__ %s" % (result[0]/1000, result[1])
            ui.notify(msg, position="top")
            self.event_log.content += "\n" + msg
            print(event_mgr.pending_log)

