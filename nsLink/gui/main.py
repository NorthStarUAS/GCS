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
            with ui.dropdown_button("Tasks") as self.task_menu:
                with ui.card(), ui.grid(columns=2):
                    ui.button("Preflight Calibration", icon="img:/icons/recenter.png", on_click=self.dialogs.do_preflight_calib).props("outline no-caps").classes("shadow-lg")
                    ui.button("Launch", icon="img:/icons/launch.png", on_click=self.dialogs.do_launch).props("outline no-caps")# .classes("shadow-lg")

                    ui.button("Set Airspeed", icon="img:/icons/speed.png", on_click=self.dialogs.do_set_airspeed).props("outline no-caps").classes("shadow-lg")
                    ui.button("Set Altitude", icon="img:/icons/altitude.png", on_click=self.dialogs.do_set_altitude).props("outline no-caps").classes("shadow-lg")

                    ui.button("Approach and Land", icon="img:/icons/land.png", on_click=self.dialogs.do_land).props("outline no-caps").classes("shadow-lg")
                    ui.label()

                    ui.label()
                    ui.label()

                    ui.button("Calibrate Airspeed", icon="img:/icons/calibrate.png", on_click=self.dialogs.do_calib_airspeed).props("outline no-caps").classes("shadow-lg")
                    ui.button("Calibrate Gyros", icon="img:/icons/calibrate.png", on_click=self.dialogs.do_calib_gyros).props("outline no-caps").classes("shadow-lg")

                    ui.button("Force EKF Reset", icon="img:/icons/alert.png", on_click=self.dialogs.do_reset_ekf).props("outline no-caps").classes("shadow-lg")
                    ui.switch("Auto-pan Map", value=True)
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
