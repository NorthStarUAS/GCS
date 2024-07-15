import socket

class SimLink():
    def __init__(self, port_in=5051):
        self.sock_in = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock_in.bind( ("", port_in))
        self.sock_in.setblocking(0)

    def update(self):
        try:
            data, addr = self.sock_in.recvfrom(1024)
            print("received a sim message")
        except BlockingIOError:
            print("nothing to receive")

sim_link = SimLink(port_in=5051)