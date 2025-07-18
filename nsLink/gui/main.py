from nicegui import ui

from commands import commands

from gui.annunciators import Annunciators
# from gui.console import Console
from gui.data_bus import DataBus
from gui.dialogs import Dialogs
from gui.map import Map
from gui.notes import Notes
from gui.panel import Panel

class MainDisplay():
    def __init__(self):
        self.dialogs = Dialogs()

        with ui.header(elevated=True).classes('items-center').style("font-size: 160%"):
            self.annunciator_bar = Annunciators()
            self.annunciator_bar.update()
            ui.space()
            with ui.dropdown_button("Pages"):
                self.page_toggle = ui.toggle(["Panel", "Map", "Data Bus"], value="Panel", on_change=self.my_select_tab)
            with ui.button("Tasks") as self.action_menu:
                with ui.menu():
                    # ui.item("Preflight Calibration", on_click=self.dialogs.do_preflight_calib)
                    with ui.menu_item(on_click=self.dialogs.do_preflight_calib):
                        with ui.item_section():
                            ui.icon("img:/icons/home.png", size="1.5rem")
                        ui.item_section("Preflight Setup Home")
                    # with ui.item(on_click=self.dialogs.do_launch):
                    with ui.menu_item(on_click=self.dialogs.do_launch):
                        with ui.item_section():
                            ui.icon("img:/icons/launch.png", size="1.5rem")
                        ui.item_section("Launch")
                    # ui.item("Land", on_click=self.dialogs.do_land)
                    with ui.menu_item(on_click=self.dialogs.do_land):
                        with ui.item_section():
                            ui.icon("img:/icons/land.png", size="1.5rem")
                        ui.item_section("Approach and Land")
                    # ui.separator()
                    # ui.item("Set Airspeed", on_click=self.dialogs.do_set_airspeed)
                    with ui.menu_item(on_click=self.dialogs.do_set_airspeed):
                        with ui.item_section():
                            ui.icon("img:/icons/speed.png", size="1.5rem")
                        ui.item_section("Set Airspeed")
                    # ui.item("Set Altitude", on_click=self.dialogs.do_set_altitude)
                    with ui.menu_item(on_click=self.dialogs.do_set_altitude):
                        with ui.item_section():
                            ui.icon("img:/icons/altitude.png", size="1.5rem")
                        ui.item_section("Set Altitude")
                    ui.separator()
                    ui.menu_item("Calibrate Airspeed", on_click=self.dialogs.do_calib_airspeed).props("side")
                    ui.menu_item("Calibrate Gyros", on_click=self.dialogs.do_calib_gyros)
                    ui.menu_item("Force Reset EKF", on_click=self.dialogs.do_reset_ekf)
                    ui.switch("Auto-pan Map", value=True)
            # with ui.dropdown_button("Tasks", auto_close=True) as self.action_menu:
            #     ui.item("Preflight Calibration", on_click=self.dialogs.do_preflight_calib)
            #     ui.item("Launch", on_click=self.dialogs.do_launch)
            #     # with ui.item(on_click=self.dialogs.do_launch):
            #     #     with ui.item_section().props('avatar'):
            #     #         ui.icon("/icons/land.png")
            #     #     ui.item_section("Launch")
            #     ui.item("Land", on_click=self.dialogs.do_land)
            #     ui.separator()
            #     ui.item("Set Airspeed", on_click=self.dialogs.do_set_airspeed)
            #     ui.item("Set Altitude", on_click=self.dialogs.do_set_altitude)
            #     ui.separator()
            #     ui.item("Calibrate Airspeed", on_click=self.dialogs.do_calib_airspeed)
            #     ui.item("Calibrate Gyros", on_click=self.dialogs.do_calib_gyros)
            #     ui.item("Force Reset EKF", on_click=self.dialogs.do_reset_ekf)
            #     ui.switch("Auto-pan Map", value=True)
            ui.button(on_click=lambda: self.right_drawer.toggle(), icon='menu').props('flat color=white')

        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as self.right_drawer:
            self.notes = Notes()
            self.notes.update()
            pass

        with ui.tabs().classes("w-full") as self.tabs:
            panel = ui.tab("Panel", icon="speed")
            map = ui.tab("Map", icon="public")
            bus = ui.tab("Data Bus", icon="feed")
            # console = ui.tab("Console", icon="feed")
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

        ui.timer(0.1, self.panel.update.refresh)
        ui.timer(0.1, self.map.update.refresh)
        ui.timer(0.1, self.bus.update.refresh)
        ui.timer(0.1, self.annunciator_bar.update.refresh)
        ui.timer(0.1, self.notes.update.refresh)

    def my_select_tab(self, name):
        self.tabs.set_value(self.page_toggle.value)
        ui.notify("Selected: " + self.page_toggle.value)
