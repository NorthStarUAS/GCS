#!/usr/bin/python3

import argparse
import pathlib
# import sys

# import asyncio
from nicegui import app, ui

from alerts import alert_mgr
from commands import commands
from derived_states import derived_states
from fmu_link import fmu_link
# import httpserver
import joystick
from gui.main import MainDisplay
import request_props
from sim_link import sim_link
# import telnet

print("before argparse")

argparser = argparse.ArgumentParser(description='aura link')
argparser.add_argument('--serial', required=True, help='input serial port')
argparser.add_argument('--hertz', default=10, type=int, help='specify main loop rate')
argparser.add_argument('--baud', default=57600, type=int, help='serial port baud rate')
# argparser.add_argument('--telnet-port', default=5050, help='telnet port')
# argparser.add_argument('--http-port', default=8888, help='http/ws port')
# argparser.add_argument('--html-root', default='../html')

args = argparser.parse_args()

dt = 1.0 / float(args.hertz)

# telnet.init(args.telnet_port)
# httpserver.init(args.http_port, args.html_root)

# commands.set_serial(ser)
fmu_link.begin(args.serial, args.baud, timeout=dt)

# maps a resource url to physical path for the nicegui app
file_dir = pathlib.Path(__file__).parent.resolve()
app.add_static_files("/textures", file_dir / "gui/textures")
app.add_static_files("/icons", file_dir / "gui/icons")
deg = 0.0

@ui.page("/")
async def main_page():
    main_display = MainDisplay()

def update():
    sim_link.update()
    fmu_link.receive()
    derived_states.update()
    alert_mgr.update()
    joystick.update()
    request_props.gen_requests()
    commands.update()

app.timer(0.01, update)

if __name__ == '__main__':
    ui.run(reload=False, native=True)
