import datetime
from pathlib import Path

from nstSimulator.sim.lib.props import imu_node

from serial_link import wrap_packet

class PacketLogger:
    def __init__(self):
        self.last_millis = 0
        log_dir = Path(__file__).resolve().parent / "logs"
        print("log_dir:", log_dir)
        if not log_dir.exists():
            print("Creating log directory:", log_dir)
            log_dir.mkdir(parents=True, exist_ok=True)
        d = datetime.datetime.now(datetime.timezone.utc)
        logfile = log_dir / Path('flight-' + d.strftime("%Y%m%d-%H%M%S") + '.log')
        try:
            self.f = open(logfile, 'wb')
        except:
            print("Cannot open:", logfile)
            quit()

    def log_msg(self, pkt_id, payload):
        imu_time = imu_node.getUInt("millis")
        if imu_time < self.last_millis - 1000*10:
            # time went backwards more than 10 seconds (remote flight computer
            # rebooted? new flight?) so start a new log file.
            self.__init__()
        self.last_millis = imu_node.getUInt("millis")

        buf = wrap_packet(pkt_id, payload)
        self.f.write(buf)

class EventLogger:
    def __init__(self):
        self.last_millis = 0
        log_dir = Path(__file__).resolve().parent / "logs"
        print("log_dir:", log_dir)
        if not log_dir.exists():
            print("Creating log directory:", log_dir)
            log_dir.mkdir(parents=True, exist_ok=True)
        d = datetime.datetime.now(datetime.timezone.utc)
        self.notefile = log_dir / Path('notes-' + d.strftime("%Y%m%d-%H%M%S") + '.txt')
        self.event_list = []

    def add_event(self, millis, message):
        if millis < self.last_millis - 1000*10:
            # time went backwards more than 10 seconds (remote flight computer
            # rebooted? new flight?) so start a new log file.
            self.__init__()
        self.last_millis = millis

        self.event_list.append( [millis, message] )

        try:
            f = open(self.notefile, 'a')
        except:
            print("Cannot open:", self.notefile)
        line = "[%.1f] %s\n" % (millis/1000, message)
        f.write(line)
        f.close()

packet_logger = PacketLogger()
event_logger = EventLogger()