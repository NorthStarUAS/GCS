import datetime
from pathlib import Path

from nstSimulator.sim.lib.props import imu_node

from serial_link import wrap_packet

class Logger:
    def __init__(self):
        self.last_imu_time = imu_node.getUInt("millis")
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
        if imu_time < self.last_imu_time:
            # time went backwards (remote flight computer rebooted? new flight?)
            # so start a new log file.
            self.__init__()
        self.last_imu_time = imu_node.getUInt("millis")

        buf = wrap_packet(pkt_id, payload)
        self.f.write(buf)

class Notes:
    def __init__(self):
        self.last_imu_time = imu_node.getUInt("millis")
        log_dir = Path(__file__).resolve().parent / "logs"
        print("log_dir:", log_dir)
        if not log_dir.exists():
            print("Creating log directory:", log_dir)
            log_dir.mkdir(parents=True, exist_ok=True)
        d = datetime.datetime.now(datetime.timezone.utc)
        self.notefile = log_dir / Path('notes-' + d.strftime("%Y%m%d-%H%M%S") + '.txt')

    def add_note(self, message):
        imu_time = imu_node.getUInt("millis")
        if imu_time < self.last_imu_time:
            # time went backwards (remote flight computer rebooted? new flight?)
            # so start a new log file.
            self.__init__()
        self.last_imu_time = imu_node.getUInt("millis")

        try:
            f = open(self.notefile, 'a')
        except:
            print("Cannot open:", self.notefile)

        f.write(message + "\n")
        f.close()