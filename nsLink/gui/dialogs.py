from nicegui import ui

from commands import commands
from nodes import environment_node, refs_node, tecs_config_node

class Dialogs():
    def __init__(self):
        with ui.dialog() as self.preflight_dialog, ui.card():
            msg = \
"""### Preflight Calibration

*Place the airplane at the desired landing point.  This will survey a home position and altitude.  Wait for the task to return to idle.*

Always do this before your first launch!
"""
            ui.markdown(msg)
            with ui.row():
                ui.button('Submit', on_click=lambda: self.preflight_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.preflight_dialog.submit('Cancel'))

        with ui.dialog() as self.launch_dialog, ui.card():
            # ui.label("Launch Procedure:")
            msg = \
"""### Launch Procedure

#### Before clicking submit

* Ensure everyone __always__ remains __clear__ of and __behind__ the prop arc
* Ensure throttle stick is at full idle
* Ensure A/P is in Manual mode

#### After clicking submit

* Ensure motor enable switch is on
* Perform a manual power check
* Ensure launch area clear
* Point aircraft into the prevailing wind
* Activate A/P switch
* As power comes up release / throw aircraft firmly with wings level and at a slightly nose up attitude

#### Be smart with a live aircraft!

When you are ready, click Submit.
"""
            ui.markdown(msg)
            with ui.row():
                ui.button('Submit', on_click=lambda: self.launch_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.launch_dialog.submit('Cancel'))

        with ui.dialog() as self.set_airspeed_dialog, ui.card().classes("w-96"):
            ui.markdown("### Set Airspeed")
            with ui.row().classes("w-full") as self.airspeed_row:
                self.airspeed_slider = ui.slider(min=0, max=1)
            with ui.row():
                ui.button('Submit', on_click=lambda: self.set_airspeed_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.set_airspeed_dialog.submit('Cancel'))

        with ui.dialog() as self.set_altitude_dialog, ui.card().classes("w-96"):
            ui.markdown("### Set Altitude")
            with ui.row().classes("w-full") as self.altitude_row:
                self.altitude_slider = ui.slider(min=0, max=1)
            with ui.row():
                ui.button('Submit', on_click=lambda: self.set_altitude_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.set_altitude_dialog.submit('Cancel'))

        with ui.dialog() as self.calib_airspeed_dialog, ui.card():
            msg = \
"""
### Calibrate Zero Airspeed

*The differential pressure sensor bias can change as it warms up.  Make sure the plane is perpendicular to the wind and shield the pitot tube.*

Never do this in flight!
"""
            ui.markdown(msg)
            with ui.row():
                ui.button('Submit', on_click=lambda: self.calib_airspeed_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.calib_airspeed_dialog.submit('Cancel'))

        with ui.dialog() as self.gyros_dialog, ui.card():
            msg = \
"""
### Calibrate Zero Gyros

*The gyro bias can change as the IMU (flight controller board) warms up.  The EKF can compensate for gyro bias, but too much bias can make EKF
convergence slower.*

Never do this in flight!
"""
            ui.markdown(msg)
            with ui.row():
                ui.button('Submit', on_click=lambda: self.gyros_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.gyros_dialog.submit('Cancel'))

        with ui.dialog() as self.ekf_dialog, ui.card():
            msg = \
"""
### Reset EKF

*Normally you can walk or jog around with the aircraft and help the EKF converge (change of direction aka acceleration helps),
but if somehow the solution is really bad, you can reset the EKF and try again.  If your heading is rotating rapidly, or stuck
180 degrees off, consider this option.*

Never do this in flight!
"""
            ui.markdown(msg)
            with ui.row():
                ui.button('Submit', on_click=lambda: self.ekf_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.ekf_dialog.submit('Cancel'))

    async def do_preflight_calib(self):
        result = await self.preflight_dialog
        if result == "Submit":
            if environment_node.getBool("is_airborne"):
                ui.notification("I cannot let you preflight while airborne, Dave!")
            else:
                commands.add("task calib_home")

    async def do_launch(self):
        result = await self.launch_dialog
        if result == "Submit":
            commands.add("task launch")

    async def do_set_airspeed(self):
        self.airspeed_row.clear()
        with self.airspeed_row:
            # print(tecs_config_node.getDouble("min_kt"), tecs_config_node.getDouble("max_kt"), refs_node.getDouble("airspeed_kt"))
            self.airspeed_slider = ui.slider(min=tecs_config_node.getDouble("min_kt"), max=tecs_config_node.getDouble("max_kt"),
                                             value=refs_node.getDouble("airspeed_kt"), step=1).props('label-always').style("font-size: 160%")
        result = await self.set_airspeed_dialog
        if result == "Submit":
            commands.add("set /fcs/refs/airspeed_kt %.1f" % self.airspeed_slider.value)

    async def do_set_altitude(self):
        self.altitude_row.clear()
        with self.altitude_row:
            self.altitude_slider = ui.slider(min=25, max=400,
                                             value=refs_node.getDouble("altitude_agl_ft"), step=25).props('label-always')
        result = await self.set_altitude_dialog
        if result == "Submit":
            commands.add("set /fcs/refs/altitude_agl_ft %.0f" % self.altitude_slider.value)

    async def do_calib_airspeed(self):
        result = await self.calib_airspeed_dialog
        if result == "Submit":
            if environment_node.getBool("is_airborne"):
                ui.notification("I cannot let you zero the airspeed while airborne, Dave!")
            else:
                commands.add("set /sensors/airdata/zero 1")

    async def do_calib_gyros(self):
        result = await self.gyros_dialog
        if result == "Submit":
            if environment_node.getBool("is_airborne"):
                ui.notification("I cannot let you zero the gyros while airborne, Dave!")
            else:
                commands.add("zero_gyros")

    async def do_reset_ekf(self):
        result = await self.ekf_dialog
        if result == "Submit":
            if environment_node.getBool("is_airborne"):
                ui.notification("I cannot let you reset EKF while airborne, Dave!")
            else:
                commands.add("reset_ekf")
