import socket

from fmu_link import fmu_link

class SimLink():
    def __init__(self, port_in=5051):
        self.sock_in = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock_in.bind( ("", port_in))
        self.sock_in.setblocking(0)

    def update(self):
        new_data = True
        while new_data:
            try:
                data, addr = self.sock_in.recvfrom(1024)
                result = fmu_link.send_packet(data)
                print("relaying a sim message", result)
            except BlockingIOError:
                new_data = False
                print("nothing to receive")

sim_link = SimLink(port_in=5051)