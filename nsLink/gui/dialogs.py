from nicegui import ui

from commands import commands
from nodes import environment_node

class Dialogs():
    def __init__(self):
        with ui.dialog() as self.preflight_dialog, ui.card():
            msg = \
"""### Preflight Calibration

*Place the airplane at the desired landing point.  This will survey a home position and altitude.  Wait for the task to return to idle.*

Are you sure?  Always do this before your first launch!
"""
            ui.markdown(msg)
            # ui.label("Preflight Calibration:")
            # ui.markdown("*Place the airplane at the desired landing point.  This will survey a home position and altitude.  Wait for the task to return to idle.*")
            # ui.label("Are you sure?  Always do this before your first launch!")
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
* As power comes up release / throw aircraft firmly in a wings level and slightly nose up attitude

#### Be smart with a live aircraft!

When you are ready, click Submit.
"""
            ui.markdown(msg)
            # ui.label("Be smart with a live aircraft!  When you are ready, click Submit.")
            with ui.row():
                ui.button('Submit', on_click=lambda: self.launch_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.launch_dialog.submit('Cancel'))

        with ui.dialog() as self.airspeed_dialog, ui.card():
            ui.label("Calibrate Airspeed:")
            ui.markdown("*The differential pressure sensor bias can change as it warms up.  Make sure the plane is perpendicular to the wind and shield the pitot tube.*")
            ui.label("Are you sure?  Never do this in flight!")
            with ui.row():
                ui.button('Submit', on_click=lambda: self.airspeed_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.airspeed_dialog.submit('Cancel'))

        with ui.dialog() as self.gyros_dialog, ui.card():
            ui.label("Calibrate Gyros:")
            ui.markdown("*The gyro bias can change as the IMU (flight controller board) warms up.  The EKF can compensate for gyro bias, but too much can make EKF convergence slower.*")
            ui.label("Are you sure?  Never do this in flight!")
            with ui.row():
                ui.button('Submit', on_click=lambda: self.gyros_dialog.submit('Submit'))
                ui.button('Cancel', on_click=lambda: self.gyros_dialog.submit('Cancel'))

        with ui.dialog() as self.ekf_dialog, ui.card():
            ui.label("Reset EKF:")
            ui.markdown("*Normally you can walk or jog around with the aircraft and help the EKF converge (change of direction aka acceleration helps), but if somehow the solution is really bad, you can reset the EKF and try again.  If your heading is rotating rapidly, or stuck 180 degrees off, consider this option.*")
            ui.label("Are you sure?  Never do this in flight!")
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

    async def do_calib_airspeed(self):
        result = await self.airspeed_dialog
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
