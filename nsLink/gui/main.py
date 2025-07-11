from nicegui import ui

from PropertyTree import PropertyNode

from nodes import ident_node, imu_node

from gui.annunciators import Annunciators
from gui.console import Console
from gui.data_bus import DataBus
from gui.map import Map
from gui.notes import Notes
from gui.panel import Panel

class MainDisplay():
    def __init__(self):
        with ui.header(elevated=True).classes('items-center').style("font-size: 160%"):
            self.annunciator_bar = Annunciators()
            self.annunciator_bar.update()
            ui.space()
            with ui.dropdown_button("Panel", auto_close=True) as self.tab_menu:
                ui.item("Panel", on_click=lambda: self.my_select_tab("Panel"))
                ui.item("Map", on_click=lambda: self.my_select_tab("Map"))
                ui.item("Data Bus", on_click=lambda: self.my_select_tab("Data Bus"))
                ui.item("Console", on_click=lambda: self.my_select_tab("Console"))
            ui.button(on_click=lambda: self.right_drawer.toggle(), icon='menu').props('flat color=white')

        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as self.right_drawer:
            self.notes = Notes()
            self.notes.update()
            pass

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
            with ui.tab_panel(map):
                self.map = Map()
                self.map.update()
            with ui.tab_panel(bus):
                self.bus = DataBus()
                self.bus.update()
            with ui.tab_panel(console):
                self.console = Console()
                self.console.update()
            pass

        ui.timer(0.1, self.panel.update.refresh)
        ui.timer(0.1, self.map.update.refresh)
        ui.timer(0.1, self.bus.update.refresh)
        ui.timer(0.1, self.console.update.refresh)
        ui.timer(0.1, self.annunciator_bar.update.refresh)
        ui.timer(0.1, self.notes.update.refresh)

        # self.my_select_tab("Map")

    def my_select_tab(self, name):
        self.tabs.set_value(name)
        self.tab_menu.set_text(name)
        ui.notify("Selected: " + name)


