#!/usr/bin/python3

import argparse
import sys

# dnf install python3-pyqt6; pip install pyqt6
from PyQt6.QtWidgets import QApplication, QVBoxLayout, QWidget
from PyQt6.QtWidgets import QLabel, QPushButton
from PyQt6.QtCore import QTimer

from alerts import alert_mgr
from commands import commands
from derived_states import derived_states
from fmu_link import fmu_link
import httpserver
import joystick
from nodes import ident_node, remote_link_node
import requests
from sim_link import sim_link
import telnet

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

def main_loop():
    sim_link.update()
    fmu_link.receive()
    derived_states.update()
    alert_mgr.update()
    joystick.update()
    requests.gen_requests()
    commands.update()
    telnet.update()
    httpserver.update()

class MainApp(QWidget):
    def __init__(self):
        super(MainApp, self).__init__()
        self.initUI()
        self.timer = QTimer()
        self.timer.timeout.connect(self.update)
        self.timer.setInterval(100)  # 10 hz
        self.timer.start()

    def initUI(self):
        self.setWindowTitle("nsLink")
        layout = QVBoxLayout()
        self.setLayout(layout)

        self.callsign = QLabel("Callsign: n/a")
        # self.callsign.setTextFormat(QtRichText)
        layout.addWidget(self.callsign)
        self.connected = QLabel("Connection: no")
        layout.addWidget(self.connected)

        url = QLabel("<a href=\"http://localhost:8888\">http://localhost:8888</a>")
        url.setOpenExternalLinks(True)
        layout.addWidget(url)

        quit = QPushButton("Quit")
        layout.addWidget(quit)
        quit.clicked.connect(self.quit)

        self.show()

    def update(self):
        callsign = ident_node.getString("call_sign")
        if len(callsign):
            self.setWindowTitle("nsLink: " + callsign)
            self.callsign.setText("Callsign: " + callsign)
        connected = remote_link_node.getString("link_state")
        if connected == "ok":
            text = "Connection: ok"
        else:
            text = "Connection: no"
        good = remote_link_node.getInt("good_packet_count")
        bad = remote_link_node.getInt("bad_packet_count")
        text += " <font color=\"green\">%d</font>" % good
        if bad > 0:
            text += " <font color=\"red\">%d</font>" % bad
        self.connected.setText(text)

    def quit(self):
        sys.exit(0)

app = QApplication(sys.argv)

main_timer = QTimer()
main_timer.timeout.connect(main_loop)
main_timer.setInterval(10)  # 100 hz
main_timer.start()

ex = MainApp()
sys.exit(app.exec())