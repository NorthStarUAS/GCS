import socket

from fmu_link import fmu_link
from nst_messages import effectors_v1
from props import effectors_node
from serial_link import wrap_packet

sim_host = "localhost"
link_recv_port = 5051
sim_recv_port = 5052

class SimLink():
    def __init__(self):
        self.sock_in = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock_in.bind( ("", link_recv_port))
        self.sock_in.setblocking(0)

        self.sock_out = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def update(self):
        new_data = True
        while new_data:
            try:
                data, addr = self.sock_in.recvfrom(1024)
                result = fmu_link.send_packet(data)
                # print("relaying a sim message", result, " bytes")
            except BlockingIOError:
                new_data = False
                # print("nothing to receive")

        msg = effectors_v1()
        msg.props2msg(effectors_node)
        buf = msg.pack()
        packet = wrap_packet(msg.id, buf)
        self.sock_out.sendto(packet, (sim_host, sim_recv_port))

sim_link = SimLink()