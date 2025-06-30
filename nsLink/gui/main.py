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
        ui.label("I'm the map")

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
            with ui.dropdown_button("Panel", auto_close=True) as tab_menu:
                ui.item("Panel", on_click=lambda: ui.notify('You clicked item 1'))
                ui.item("Map", on_click=lambda: ui.notify('You clicked item 1'))
                ui.item("Data Bus", on_click=lambda: ui.notify('You clicked item 1'))

            ui.button(on_click=lambda: self.right_drawer.toggle(), icon='menu').props('flat color=white')

        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as self.right_drawer:
            self.event_log = ui.label('Event Log').style('white-space: pre-wrap')

        with ui.tabs().classes("w-full") as tabs:
            panel = ui.tab("Panel", icon="speed")
            map = ui.tab("Map", icon="public")
            bus = ui.tab("Data Bus", icon="feed")
        tabs.set_visibility(True)

        with ui.tab_panels(tabs, value=panel).classes('w-full'):
            with ui.tab_panel(panel):
                self.panel = Panel()
                self.panel.update()
            with ui.tab_panel(map):
                self.map = Map()
                self.map.update()
            with ui.tab_panel(bus):
                self.bus = DataBus()
                self.bus.update()

        ui.timer(0.1, self.panel.update.refresh)
        ui.timer(0.1, self.map.update.refresh)
        ui.timer(0.1, self.bus.update.refresh)

    def update(self):
        self.annunciator_bar.update()

        result = event_mgr.get_next_event()
        if result is not None:
            msg = "[%.1f] %s" % (result[0]/1000, result[1])
            ui.notify(msg, position="top")
            self.event_log.text += "\n" + msg
            print(event_mgr.pending_log)

