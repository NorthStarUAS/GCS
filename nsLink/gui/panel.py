from nicegui import ui

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