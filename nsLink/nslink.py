#!/usr/bin/python3

import argparse
import serial
import sys

# dnf install python3-pyqt6; pip install pyqt6
from PyQt6.QtWidgets import QApplication, QVBoxLayout, QWidget
from PyQt6.QtWidgets import QPushButton
from PyQt6.QtCore import QTimer

from commands import commands
import current
from fmu_link import fmu_link
import httpserver
import joystick
import requests
from sim_link import sim_link
import telnet

argparser = argparse.ArgumentParser(description='aura link')
argparser.add_argument('--hertz', default=10, type=int, help='specify main loop rate')
argparser.add_argument('--serial', required=True, help='input serial port')
argparser.add_argument('--baud', default=115200, type=int, help='serial port baud rate')
argparser.add_argument('--telnet-port', default=5050, help='telnet port')
argparser.add_argument('--http-port', default=8888, help='http/ws port')
argparser.add_argument('--html-root', default='.')

args = argparser.parse_args()

dt = 1.0 / float(args.hertz)

telnet.init(args.telnet_port)
httpserver.init(args.http_port, args.html_root)

try:
    ser = serial.Serial(args.serial, args.baud, timeout=dt)
except:
    print("Cannot open:", args.serial)
    import serial.tools.list_ports
    ports = list(serial.tools.list_ports.comports())
    print("Available ports:")
    for p in ports:
        print(p)
    quit()

commands.set_serial(ser)
fmu_link.set_serial(ser)

def main_loop():
    sim_link.update()
    fmu_link.update()
    current.compute_derived_data()
    joystick.update()
    requests.gen_requests()
    commands.update()
    telnet.update()
    httpserver.update()

class MainApp(QWidget):
    def __init__(self):
        super(MainApp, self).__init__()
        self.initUI()

    def initUI(self):
        self.setWindowTitle("nsLink")
        layout = QVBoxLayout()
        self.setLayout(layout)

        quit = QPushButton("Quit")
        layout.addWidget(quit)
        quit.clicked.connect(self.quit)

        self.show()

    def quit(self):
        sys.exit(0)

app = QApplication(sys.argv)

timer = QTimer()
timer.timeout.connect(main_loop)
timer.setInterval(10)  # 100 hz
timer.start()

ex = MainApp()
sys.exit(app.exec())