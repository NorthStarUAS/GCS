import datetime

from serial_link import START_OF_MSG0, START_OF_MSG1

class Logger:
    def __init__(self):
        d = datetime.datetime.now(datetime.UTC)
        logfile = 'flight-' + d.strftime("%Y%m%d-%H%M%S") + '.log'
        try:
            self.f = open(logfile, 'wb')
        except:
            print("Cannot open:", logfile)
            quit()

    def log_msg(self, pkt_id, pkt_len, payload, cksum_lo, cksum_hi):
        self.f.write(bytes([START_OF_MSG0]))
        self.f.write(bytes([START_OF_MSG1]))
        self.f.write(bytes([pkt_id]))
        self.f.write(bytes([pkt_len]))
        self.f.write(payload)
        self.f.write(bytes([cksum_lo]))
        self.f.write(bytes([cksum_hi]))
