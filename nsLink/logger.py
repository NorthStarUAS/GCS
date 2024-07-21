import datetime

from serial_link import wrap_packet, START_OF_MSG0, START_OF_MSG1

class Logger:
    def __init__(self):
        d = datetime.datetime.now(datetime.timezone.utc)
        logfile = 'flight-' + d.strftime("%Y%m%d-%H%M%S") + '.log'
        try:
            self.f = open(logfile, 'wb')
        except:
            print("Cannot open:", logfile)
            quit()

    def log_msg(self, pkt_id, pkt_len, payload, cksum_lo, cksum_hi):
        buf = wrap_packet(pkt_id, payload)
        self.f.write(buf)
