#!/usr/bin/python3

import argparse
import pathlib
import sys

import asyncio
from nicegui import app, ui

from PropertyTree import PropertyNode

from alerts import alert_mgr
from commands import commands
from derived_states import derived_states
from fmu_link import fmu_link
import httpserver
import joystick
from gui.annunciators import Annunciators
from gui.nice_gauge import Airspeed, Attitude, Altitude, Heading, Power, INS_GNSS, Controls, Status
from nodes import ident_node, remote_link_node
import requests
from sim_link import sim_link
import telnet

print("before argparse")

argparser = argparse.ArgumentParser(description='aura link')
argparser.add_argument('--serial', required=True, help='input serial port')
argparser.add_argument('--hertz', default=10, type=int, help='specify main loop rate')
argparser.add_argument('--baud', default=57600, type=int, help='serial port baud rate')
argparser.add_argument('--telnet-port', default=5050, help='telnet port')
argparser.add_argument('--http-port', default=8888, help='http/ws port')
argparser.add_argument('--html-root', default='../html')

args = argparser.parse_args()

dt = 1.0 / float(args.hertz)

telnet.init(args.telnet_port)
httpserver.init(args.http_port, args.html_root)

# commands.set_serial(ser)
fmu_link.begin(args.serial, args.baud, timeout=dt)

# maps a resource url to physical path for the nicegui app
file_dir = pathlib.Path(__file__).parent.resolve()
app.add_static_files("/resources", file_dir / "../html")

with ui.row(wrap=False).classes("w-full"):
    asi = Airspeed()
    ati = Attitude()
    alt = Altitude()
    power = Power()

with ui.row(wrap=False).classes("w-full"):
    status = Status()
    hdg = Heading()
    ins_gnss = INS_GNSS()
    controls = Controls()

deg = 0.0

@ui.refreshable
async def gauge_test():
    asi.update()
    ati.update()
    alt.update()
    power.update()
    hdg.update()
    ins_gnss.update()
    controls.update()
    status.update()

gauge_test()

ann = Annunciators()
# with ui.header(elevated=True).classes('items-center justify-between').style("font-size: 150%"):
#     ui_callsign = ui.label("Callsign: n/a")
#     ui.button(on_click=lambda: right_drawer.toggle(), icon='menu').props('flat color=white')

def update():
    # callsign = ident_node.getString("call_sign")
    # if len(callsign):
    #     ui_callsign.set_text("Callsign: " + callsign)
    # else:
    #     ui_callsign.set_text("Callsign: " + "still waiting")
    sim_link.update()
    fmu_link.receive()
    derived_states.update()
    alert_mgr.update()
    joystick.update()
    requests.gen_requests()
    commands.update()
    ann.update()
    # Fixme: your mssion is to reproduce these two items in NiceGUI
    # telnet.update()
    # httpserver.update()

app.timer(0.01, update)

@ui.refreshable
async def bus_data():
    json = PropertyNode("/").get_json_string()
    # ui.run_javascript("var json = " + json)  # copy property tree to javascript session

    # print("json:", json)
    # ui.json_editor({"content": {"json": json}, "readOnly": True},
    #                on_select=lambda e: ui.notify(f'Select: {e}'),
    #                on_change=lambda e: ui.notify(f'Change: {e}'))
    ui.label(json).classes("font-mono").style("white-space: pre-wrap")

with ui.tabs().classes("w-full") as tabs:
    panel = ui.tab("Panel", icon="speed")
    map = ui.tab("Map", icon="public")
    bus = ui.tab("Data Bus", icon="feed")

with ui.tab_panels(tabs, value=panel).classes('w-full'):
    with ui.tab_panel(bus):
        bus_data()

ui.timer(0.1, bus_data.refresh)
ui.timer(0.1, gauge_test.refresh)

ui.run(reload=False, native=False)

# class MainApp(QWidget):
#     def __init__(self):
#         super(MainApp, self).__init__()
#         self.initUI()
#         self.timer = QTimer()
#         self.timer.timeout.connect(self.update)
#         self.timer.setInterval(100)  # 10 hz
#         self.timer.start()

#     def initUI(self):
#         self.setWindowTitle("nsLink")
#         layout = QVBoxLayout()
#         self.setLayout(layout)

#         self.callsign = QLabel("Callsign: n/a")
#         # self.callsign.setTextFormat(QtRichText)
#         layout.addWidget(self.callsign)
#         self.connected = QLabel("Connection: no")
#         layout.addWidget(self.connected)

#         url = QLabel("<a href=\"http://localhost:8888\">http://localhost:8888</a>")
#         url.setOpenExternalLinks(True)
#         layout.addWidget(url)

#         quit = QPushButton("Quit")
#         layout.addWidget(quit)
#         quit.clicked.connect(self.quit)

#         self.show()

#     def update(self):
#         callsign = ident_node.getString("call_sign")
#         if len(callsign):
#             self.setWindowTitle("nsLink: " + callsign)
#             self.callsign.setText("Callsign: " + callsign)
#         connected = remote_link_node.getString("link_state")
#         if connected == "ok":
#             text = "Connection: ok"
#         else:
#             text = "Connection: no"
#         good = remote_link_node.getInt("good_packet_count")
#         bad = remote_link_node.getInt("bad_packet_count")
#         text += " <font color=\"green\">%d</font>" % good
#         if bad > 0:
#             text += " <font color=\"red\">%d</font>" % bad
#         self.connected.setText(text)

#     def quit(self):
#         sys.exit(0)

# app = QApplication(sys.argv)

# main_timer = QTimer()
# main_timer.timeout.connect(main_loop)
# main_timer.setInterval(10)  # 100 hz
# main_timer.start()

# ex = MainApp()
# sys.exit(app.exec())