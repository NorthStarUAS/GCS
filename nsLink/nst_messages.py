import struct
from PropertyTree import PropertyNode

# Message id constants
gps_v4_id = 34
gps_v5_id = 49
imu_v5_id = 45
imu_v6_id = 50
airdata_v7_id = 43
airdata_v8_id = 54
filter_v5_id = 47
nav_v6_id = 52
nav_metrics_v6_id = 53
effectors_v1_id = 61
inceptors_v2_id = 63
power_v1_id = 55
fcs_refs_v1_id = 65
mission_v1_id = 60
system_health_v6_id = 46
status_v7_id = 56
event_v2_id = 44
event_v3_id = 64
command_v1_id = 28
ack_v1_id = 57

# Constants
sbus_channels = 16  # number of sbus channels
ap_channels = 6  # number of sbus channels

# Message: gps_v4
# Id: 34
class gps_v4():
    id = 34
    _pack_string = "<BfddfhhhdBHHHB"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.index = 0
        self.timestamp_sec = 0.0
        self.latitude_deg = 0.0
        self.longitude_deg = 0.0
        self.altitude_m = 0.0
        self.vn_ms = 0.0
        self.ve_ms = 0.0
        self.vd_ms = 0.0
        self.unixtime_sec = 0.0
        self.satellites = 0
        self.horiz_accuracy_m = 0.0
        self.vert_accuracy_m = 0.0
        self.pdop = 0.0
        self.fix_type = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.index,
                  self.timestamp_sec,
                  self.latitude_deg,
                  self.longitude_deg,
                  self.altitude_m,
                  int(round(self.vn_ms * 100.0)),
                  int(round(self.ve_ms * 100.0)),
                  int(round(self.vd_ms * 100.0)),
                  self.unixtime_sec,
                  self.satellites,
                  int(round(self.horiz_accuracy_m * 100.0)),
                  int(round(self.vert_accuracy_m * 100.0)),
                  int(round(self.pdop * 100.0)),
                  self.fix_type)
        return msg

    def unpack(self, msg):
        (self.index,
         self.timestamp_sec,
         self.latitude_deg,
         self.longitude_deg,
         self.altitude_m,
         self.vn_ms,
         self.ve_ms,
         self.vd_ms,
         self.unixtime_sec,
         self.satellites,
         self.horiz_accuracy_m,
         self.vert_accuracy_m,
         self.pdop,
         self.fix_type) = self._struct.unpack(msg)
        self.vn_ms /= 100.0
        self.ve_ms /= 100.0
        self.vd_ms /= 100.0
        self.horiz_accuracy_m /= 100.0
        self.vert_accuracy_m /= 100.0
        self.pdop /= 100.0

    def msg2props(self, node):
        node.setUInt("index", self.index)
        node.setDouble("timestamp_sec", self.timestamp_sec)
        node.setDouble("latitude_deg", self.latitude_deg)
        node.setDouble("longitude_deg", self.longitude_deg)
        node.setDouble("altitude_m", self.altitude_m)
        node.setDouble("vn_ms", self.vn_ms)
        node.setDouble("ve_ms", self.ve_ms)
        node.setDouble("vd_ms", self.vd_ms)
        node.setDouble("unixtime_sec", self.unixtime_sec)
        node.setUInt("satellites", self.satellites)
        node.setDouble("horiz_accuracy_m", self.horiz_accuracy_m)
        node.setDouble("vert_accuracy_m", self.vert_accuracy_m)
        node.setDouble("pdop", self.pdop)
        node.setUInt("fix_type", self.fix_type)

    def props2msg(self, node):
        self.index = node.getUInt("index")
        self.timestamp_sec = node.getDouble("timestamp_sec")
        self.latitude_deg = node.getDouble("latitude_deg")
        self.longitude_deg = node.getDouble("longitude_deg")
        self.altitude_m = node.getDouble("altitude_m")
        self.vn_ms = node.getDouble("vn_ms")
        self.ve_ms = node.getDouble("ve_ms")
        self.vd_ms = node.getDouble("vd_ms")
        self.unixtime_sec = node.getDouble("unixtime_sec")
        self.satellites = node.getUInt("satellites")
        self.horiz_accuracy_m = node.getDouble("horiz_accuracy_m")
        self.vert_accuracy_m = node.getDouble("vert_accuracy_m")
        self.pdop = node.getDouble("pdop")
        self.fix_type = node.getUInt("fix_type")

# Message: gps_v5
# Id: 49
class gps_v5():
    id = 49
    _pack_string = "<LQBBllfhhhhhhh"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.unix_usec = 0
        self.num_sats = 0
        self.status = 0
        self.longitude_raw = 0
        self.latitude_raw = 0
        self.altitude_m = 0.0
        self.vn_mps = 0.0
        self.ve_mps = 0.0
        self.vd_mps = 0.0
        self.hAcc_m = 0.0
        self.vAcc_m = 0.0
        self.hdop = 0.0
        self.vdop = 0.0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  self.unix_usec,
                  self.num_sats,
                  self.status,
                  self.longitude_raw,
                  self.latitude_raw,
                  self.altitude_m,
                  int(round(self.vn_mps * 100.0)),
                  int(round(self.ve_mps * 100.0)),
                  int(round(self.vd_mps * 100.0)),
                  int(round(self.hAcc_m * 100.0)),
                  int(round(self.vAcc_m * 100.0)),
                  int(round(self.hdop * 100.0)),
                  int(round(self.vdop * 100.0)))
        return msg

    def unpack(self, msg):
        (self.millis,
         self.unix_usec,
         self.num_sats,
         self.status,
         self.longitude_raw,
         self.latitude_raw,
         self.altitude_m,
         self.vn_mps,
         self.ve_mps,
         self.vd_mps,
         self.hAcc_m,
         self.vAcc_m,
         self.hdop,
         self.vdop) = self._struct.unpack(msg)
        self.vn_mps /= 100.0
        self.ve_mps /= 100.0
        self.vd_mps /= 100.0
        self.hAcc_m /= 100.0
        self.vAcc_m /= 100.0
        self.hdop /= 100.0
        self.vdop /= 100.0

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setUInt64("unix_usec", self.unix_usec)
        node.setUInt("num_sats", self.num_sats)
        node.setUInt("status", self.status)
        node.setInt("longitude_raw", self.longitude_raw)
        node.setInt("latitude_raw", self.latitude_raw)
        node.setDouble("altitude_m", self.altitude_m)
        node.setDouble("vn_mps", self.vn_mps)
        node.setDouble("ve_mps", self.ve_mps)
        node.setDouble("vd_mps", self.vd_mps)
        node.setDouble("hAcc_m", self.hAcc_m)
        node.setDouble("vAcc_m", self.vAcc_m)
        node.setDouble("hdop", self.hdop)
        node.setDouble("vdop", self.vdop)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.unix_usec = node.getUInt64("unix_usec")
        self.num_sats = node.getUInt("num_sats")
        self.status = node.getUInt("status")
        self.longitude_raw = node.getInt("longitude_raw")
        self.latitude_raw = node.getInt("latitude_raw")
        self.altitude_m = node.getDouble("altitude_m")
        self.vn_mps = node.getDouble("vn_mps")
        self.ve_mps = node.getDouble("ve_mps")
        self.vd_mps = node.getDouble("vd_mps")
        self.hAcc_m = node.getDouble("hAcc_m")
        self.vAcc_m = node.getDouble("vAcc_m")
        self.hdop = node.getDouble("hdop")
        self.vdop = node.getDouble("vdop")

# Message: imu_v5
# Id: 45
class imu_v5():
    id = 45
    _pack_string = "<BffffffffffffffffhB"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.index = 0
        self.timestamp_sec = 0.0
        self.p_rad_sec = 0.0
        self.q_rad_sec = 0.0
        self.r_rad_sec = 0.0
        self.ax_mps_sec = 0.0
        self.ay_mps_sec = 0.0
        self.az_mps_sec = 0.0
        self.hx = 0.0
        self.hy = 0.0
        self.hz = 0.0
        self.ax_raw = 0.0
        self.ay_raw = 0.0
        self.az_raw = 0.0
        self.hx_raw = 0.0
        self.hy_raw = 0.0
        self.hz_raw = 0.0
        self.temp_C = 0.0
        self.status = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.index,
                  self.timestamp_sec,
                  self.p_rad_sec,
                  self.q_rad_sec,
                  self.r_rad_sec,
                  self.ax_mps_sec,
                  self.ay_mps_sec,
                  self.az_mps_sec,
                  self.hx,
                  self.hy,
                  self.hz,
                  self.ax_raw,
                  self.ay_raw,
                  self.az_raw,
                  self.hx_raw,
                  self.hy_raw,
                  self.hz_raw,
                  int(round(self.temp_C * 10.0)),
                  self.status)
        return msg

    def unpack(self, msg):
        (self.index,
         self.timestamp_sec,
         self.p_rad_sec,
         self.q_rad_sec,
         self.r_rad_sec,
         self.ax_mps_sec,
         self.ay_mps_sec,
         self.az_mps_sec,
         self.hx,
         self.hy,
         self.hz,
         self.ax_raw,
         self.ay_raw,
         self.az_raw,
         self.hx_raw,
         self.hy_raw,
         self.hz_raw,
         self.temp_C,
         self.status) = self._struct.unpack(msg)
        self.temp_C /= 10.0

    def msg2props(self, node):
        node.setUInt("index", self.index)
        node.setDouble("timestamp_sec", self.timestamp_sec)
        node.setDouble("p_rad_sec", self.p_rad_sec)
        node.setDouble("q_rad_sec", self.q_rad_sec)
        node.setDouble("r_rad_sec", self.r_rad_sec)
        node.setDouble("ax_mps_sec", self.ax_mps_sec)
        node.setDouble("ay_mps_sec", self.ay_mps_sec)
        node.setDouble("az_mps_sec", self.az_mps_sec)
        node.setDouble("hx", self.hx)
        node.setDouble("hy", self.hy)
        node.setDouble("hz", self.hz)
        node.setDouble("ax_raw", self.ax_raw)
        node.setDouble("ay_raw", self.ay_raw)
        node.setDouble("az_raw", self.az_raw)
        node.setDouble("hx_raw", self.hx_raw)
        node.setDouble("hy_raw", self.hy_raw)
        node.setDouble("hz_raw", self.hz_raw)
        node.setDouble("temp_C", self.temp_C)
        node.setUInt("status", self.status)

    def props2msg(self, node):
        self.index = node.getUInt("index")
        self.timestamp_sec = node.getDouble("timestamp_sec")
        self.p_rad_sec = node.getDouble("p_rad_sec")
        self.q_rad_sec = node.getDouble("q_rad_sec")
        self.r_rad_sec = node.getDouble("r_rad_sec")
        self.ax_mps_sec = node.getDouble("ax_mps_sec")
        self.ay_mps_sec = node.getDouble("ay_mps_sec")
        self.az_mps_sec = node.getDouble("az_mps_sec")
        self.hx = node.getDouble("hx")
        self.hy = node.getDouble("hy")
        self.hz = node.getDouble("hz")
        self.ax_raw = node.getDouble("ax_raw")
        self.ay_raw = node.getDouble("ay_raw")
        self.az_raw = node.getDouble("az_raw")
        self.hx_raw = node.getDouble("hx_raw")
        self.hy_raw = node.getDouble("hy_raw")
        self.hz_raw = node.getDouble("hz_raw")
        self.temp_C = node.getDouble("temp_C")
        self.status = node.getUInt("status")

# Message: imu_v6
# Id: 50
class imu_v6():
    id = 50
    _pack_string = "<Lhhhhhhhhhhhhhhhh"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.ax_raw = 0.0
        self.ay_raw = 0.0
        self.az_raw = 0.0
        self.hx_raw = 0.0
        self.hy_raw = 0.0
        self.hz_raw = 0.0
        self.ax_mps2 = 0.0
        self.ay_mps2 = 0.0
        self.az_mps2 = 0.0
        self.p_rps = 0.0
        self.q_rps = 0.0
        self.r_rps = 0.0
        self.hx = 0.0
        self.hy = 0.0
        self.hz = 0.0
        self.temp_C = 0.0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  int(round(self.ax_raw * 835.296217)),
                  int(round(self.ay_raw * 835.296217)),
                  int(round(self.az_raw * 835.296217)),
                  int(round(self.hx_raw * 30000.0)),
                  int(round(self.hy_raw * 30000.0)),
                  int(round(self.hz_raw * 30000.0)),
                  int(round(self.ax_mps2 * 835.296217)),
                  int(round(self.ay_mps2 * 835.296217)),
                  int(round(self.az_mps2 * 835.296217)),
                  int(round(self.p_rps * 3754.82165)),
                  int(round(self.q_rps * 3754.82165)),
                  int(round(self.r_rps * 3754.82165)),
                  int(round(self.hx * 30000.0)),
                  int(round(self.hy * 30000.0)),
                  int(round(self.hz * 30000.0)),
                  int(round(self.temp_C * 250.0)))
        return msg

    def unpack(self, msg):
        (self.millis,
         self.ax_raw,
         self.ay_raw,
         self.az_raw,
         self.hx_raw,
         self.hy_raw,
         self.hz_raw,
         self.ax_mps2,
         self.ay_mps2,
         self.az_mps2,
         self.p_rps,
         self.q_rps,
         self.r_rps,
         self.hx,
         self.hy,
         self.hz,
         self.temp_C) = self._struct.unpack(msg)
        self.ax_raw /= 835.296217
        self.ay_raw /= 835.296217
        self.az_raw /= 835.296217
        self.hx_raw /= 30000.0
        self.hy_raw /= 30000.0
        self.hz_raw /= 30000.0
        self.ax_mps2 /= 835.296217
        self.ay_mps2 /= 835.296217
        self.az_mps2 /= 835.296217
        self.p_rps /= 3754.82165
        self.q_rps /= 3754.82165
        self.r_rps /= 3754.82165
        self.hx /= 30000.0
        self.hy /= 30000.0
        self.hz /= 30000.0
        self.temp_C /= 250.0

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setDouble("ax_raw", self.ax_raw)
        node.setDouble("ay_raw", self.ay_raw)
        node.setDouble("az_raw", self.az_raw)
        node.setDouble("hx_raw", self.hx_raw)
        node.setDouble("hy_raw", self.hy_raw)
        node.setDouble("hz_raw", self.hz_raw)
        node.setDouble("ax_mps2", self.ax_mps2)
        node.setDouble("ay_mps2", self.ay_mps2)
        node.setDouble("az_mps2", self.az_mps2)
        node.setDouble("p_rps", self.p_rps)
        node.setDouble("q_rps", self.q_rps)
        node.setDouble("r_rps", self.r_rps)
        node.setDouble("hx", self.hx)
        node.setDouble("hy", self.hy)
        node.setDouble("hz", self.hz)
        node.setDouble("temp_C", self.temp_C)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.ax_raw = node.getDouble("ax_raw")
        self.ay_raw = node.getDouble("ay_raw")
        self.az_raw = node.getDouble("az_raw")
        self.hx_raw = node.getDouble("hx_raw")
        self.hy_raw = node.getDouble("hy_raw")
        self.hz_raw = node.getDouble("hz_raw")
        self.ax_mps2 = node.getDouble("ax_mps2")
        self.ay_mps2 = node.getDouble("ay_mps2")
        self.az_mps2 = node.getDouble("az_mps2")
        self.p_rps = node.getDouble("p_rps")
        self.q_rps = node.getDouble("q_rps")
        self.r_rps = node.getDouble("r_rps")
        self.hx = node.getDouble("hx")
        self.hy = node.getDouble("hy")
        self.hz = node.getDouble("hz")
        self.temp_C = node.getDouble("temp_C")

# Message: airdata_v7
# Id: 43
class airdata_v7():
    id = 43
    _pack_string = "<BfHhhffhHBBHB"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.index = 0
        self.timestamp_sec = 0.0
        self.pressure_mbar = 0.0
        self.temp_C = 0.0
        self.airspeed_smoothed_kt = 0.0
        self.altitude_smoothed_m = 0.0
        self.altitude_true_m = 0.0
        self.pressure_vertical_speed_fps = 0.0
        self.wind_dir_deg = 0.0
        self.wind_speed_kt = 0.0
        self.pitot_scale_factor = 0.0
        self.error_count = 0
        self.status = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.index,
                  self.timestamp_sec,
                  int(round(self.pressure_mbar * 10.0)),
                  int(round(self.temp_C * 100.0)),
                  int(round(self.airspeed_smoothed_kt * 100.0)),
                  self.altitude_smoothed_m,
                  self.altitude_true_m,
                  int(round(self.pressure_vertical_speed_fps * 600.0)),
                  int(round(self.wind_dir_deg * 100.0)),
                  int(round(self.wind_speed_kt * 4.0)),
                  int(round(self.pitot_scale_factor * 100.0)),
                  self.error_count,
                  self.status)
        return msg

    def unpack(self, msg):
        (self.index,
         self.timestamp_sec,
         self.pressure_mbar,
         self.temp_C,
         self.airspeed_smoothed_kt,
         self.altitude_smoothed_m,
         self.altitude_true_m,
         self.pressure_vertical_speed_fps,
         self.wind_dir_deg,
         self.wind_speed_kt,
         self.pitot_scale_factor,
         self.error_count,
         self.status) = self._struct.unpack(msg)
        self.pressure_mbar /= 10.0
        self.temp_C /= 100.0
        self.airspeed_smoothed_kt /= 100.0
        self.pressure_vertical_speed_fps /= 600.0
        self.wind_dir_deg /= 100.0
        self.wind_speed_kt /= 4.0
        self.pitot_scale_factor /= 100.0

    def msg2props(self, node):
        node.setUInt("index", self.index)
        node.setDouble("timestamp_sec", self.timestamp_sec)
        node.setDouble("pressure_mbar", self.pressure_mbar)
        node.setDouble("temp_C", self.temp_C)
        node.setDouble("airspeed_smoothed_kt", self.airspeed_smoothed_kt)
        node.setDouble("altitude_smoothed_m", self.altitude_smoothed_m)
        node.setDouble("altitude_true_m", self.altitude_true_m)
        node.setDouble("pressure_vertical_speed_fps", self.pressure_vertical_speed_fps)
        node.setDouble("wind_dir_deg", self.wind_dir_deg)
        node.setDouble("wind_speed_kt", self.wind_speed_kt)
        node.setDouble("pitot_scale_factor", self.pitot_scale_factor)
        node.setUInt("error_count", self.error_count)
        node.setUInt("status", self.status)

    def props2msg(self, node):
        self.index = node.getUInt("index")
        self.timestamp_sec = node.getDouble("timestamp_sec")
        self.pressure_mbar = node.getDouble("pressure_mbar")
        self.temp_C = node.getDouble("temp_C")
        self.airspeed_smoothed_kt = node.getDouble("airspeed_smoothed_kt")
        self.altitude_smoothed_m = node.getDouble("altitude_smoothed_m")
        self.altitude_true_m = node.getDouble("altitude_true_m")
        self.pressure_vertical_speed_fps = node.getDouble("pressure_vertical_speed_fps")
        self.wind_dir_deg = node.getDouble("wind_dir_deg")
        self.wind_speed_kt = node.getDouble("wind_speed_kt")
        self.pitot_scale_factor = node.getDouble("pitot_scale_factor")
        self.error_count = node.getUInt("error_count")
        self.status = node.getUInt("status")

# Message: airdata_v8
# Id: 54
class airdata_v8():
    id = 54
    _pack_string = "<LHhhhfffBLHBBH"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.baro_press_pa = 0.0
        self.diff_press_pa = 0.0
        self.air_temp_C = 0.0
        self.airspeed_mps = 0.0
        self.altitude_agl_m = 0.0
        self.altitude_true_m = 0.0
        self.altitude_ground_m = 0.0
        self.is_airborne = 0
        self.flight_timer_millis = 0
        self.wind_dir_deg = 0.0
        self.wind_speed_mps = 0.0
        self.pitot_scale_factor = 0.0
        self.error_count = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  int(round(self.baro_press_pa * 0.5)),
                  int(round(self.diff_press_pa * 2.0)),
                  int(round(self.air_temp_C * 250.0)),
                  int(round(self.airspeed_mps * 100.0)),
                  self.altitude_agl_m,
                  self.altitude_true_m,
                  self.altitude_ground_m,
                  self.is_airborne,
                  self.flight_timer_millis,
                  int(round(self.wind_dir_deg * 100.0)),
                  int(round(self.wind_speed_mps * 10.0)),
                  int(round(self.pitot_scale_factor * 100.0)),
                  self.error_count)
        return msg

    def unpack(self, msg):
        (self.millis,
         self.baro_press_pa,
         self.diff_press_pa,
         self.air_temp_C,
         self.airspeed_mps,
         self.altitude_agl_m,
         self.altitude_true_m,
         self.altitude_ground_m,
         self.is_airborne,
         self.flight_timer_millis,
         self.wind_dir_deg,
         self.wind_speed_mps,
         self.pitot_scale_factor,
         self.error_count) = self._struct.unpack(msg)
        self.baro_press_pa /= 0.5
        self.diff_press_pa /= 2.0
        self.air_temp_C /= 250.0
        self.airspeed_mps /= 100.0
        self.wind_dir_deg /= 100.0
        self.wind_speed_mps /= 10.0
        self.pitot_scale_factor /= 100.0

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setDouble("baro_press_pa", self.baro_press_pa)
        node.setDouble("diff_press_pa", self.diff_press_pa)
        node.setDouble("air_temp_C", self.air_temp_C)
        node.setDouble("airspeed_mps", self.airspeed_mps)
        node.setDouble("altitude_agl_m", self.altitude_agl_m)
        node.setDouble("altitude_true_m", self.altitude_true_m)
        node.setDouble("altitude_ground_m", self.altitude_ground_m)
        node.setUInt("is_airborne", self.is_airborne)
        node.setUInt("flight_timer_millis", self.flight_timer_millis)
        node.setDouble("wind_dir_deg", self.wind_dir_deg)
        node.setDouble("wind_speed_mps", self.wind_speed_mps)
        node.setDouble("pitot_scale_factor", self.pitot_scale_factor)
        node.setUInt("error_count", self.error_count)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.baro_press_pa = node.getDouble("baro_press_pa")
        self.diff_press_pa = node.getDouble("diff_press_pa")
        self.air_temp_C = node.getDouble("air_temp_C")
        self.airspeed_mps = node.getDouble("airspeed_mps")
        self.altitude_agl_m = node.getDouble("altitude_agl_m")
        self.altitude_true_m = node.getDouble("altitude_true_m")
        self.altitude_ground_m = node.getDouble("altitude_ground_m")
        self.is_airborne = node.getUInt("is_airborne")
        self.flight_timer_millis = node.getUInt("flight_timer_millis")
        self.wind_dir_deg = node.getDouble("wind_dir_deg")
        self.wind_speed_mps = node.getDouble("wind_speed_mps")
        self.pitot_scale_factor = node.getDouble("pitot_scale_factor")
        self.error_count = node.getUInt("error_count")

# Message: filter_v5
# Id: 47
class filter_v5():
    id = 47
    _pack_string = "<BfddfhhhhhhhhhhhhHHHBB"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.index = 0
        self.timestamp_sec = 0.0
        self.latitude_deg = 0.0
        self.longitude_deg = 0.0
        self.altitude_m = 0.0
        self.vn_ms = 0.0
        self.ve_ms = 0.0
        self.vd_ms = 0.0
        self.roll_deg = 0.0
        self.pitch_deg = 0.0
        self.yaw_deg = 0.0
        self.p_bias = 0.0
        self.q_bias = 0.0
        self.r_bias = 0.0
        self.ax_bias = 0.0
        self.ay_bias = 0.0
        self.az_bias = 0.0
        self.max_pos_cov = 0.0
        self.max_vel_cov = 0.0
        self.max_att_cov = 0.0
        self.sequence_num = 0
        self.status = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.index,
                  self.timestamp_sec,
                  self.latitude_deg,
                  self.longitude_deg,
                  self.altitude_m,
                  int(round(self.vn_ms * 100.0)),
                  int(round(self.ve_ms * 100.0)),
                  int(round(self.vd_ms * 100.0)),
                  int(round(self.roll_deg * 10.0)),
                  int(round(self.pitch_deg * 10.0)),
                  int(round(self.yaw_deg * 10.0)),
                  int(round(self.p_bias * 10000.0)),
                  int(round(self.q_bias * 10000.0)),
                  int(round(self.r_bias * 10000.0)),
                  int(round(self.ax_bias * 1000.0)),
                  int(round(self.ay_bias * 1000.0)),
                  int(round(self.az_bias * 1000.0)),
                  int(round(self.max_pos_cov * 100.0)),
                  int(round(self.max_vel_cov * 1000.0)),
                  int(round(self.max_att_cov * 10000.0)),
                  self.sequence_num,
                  self.status)
        return msg

    def unpack(self, msg):
        (self.index,
         self.timestamp_sec,
         self.latitude_deg,
         self.longitude_deg,
         self.altitude_m,
         self.vn_ms,
         self.ve_ms,
         self.vd_ms,
         self.roll_deg,
         self.pitch_deg,
         self.yaw_deg,
         self.p_bias,
         self.q_bias,
         self.r_bias,
         self.ax_bias,
         self.ay_bias,
         self.az_bias,
         self.max_pos_cov,
         self.max_vel_cov,
         self.max_att_cov,
         self.sequence_num,
         self.status) = self._struct.unpack(msg)
        self.vn_ms /= 100.0
        self.ve_ms /= 100.0
        self.vd_ms /= 100.0
        self.roll_deg /= 10.0
        self.pitch_deg /= 10.0
        self.yaw_deg /= 10.0
        self.p_bias /= 10000.0
        self.q_bias /= 10000.0
        self.r_bias /= 10000.0
        self.ax_bias /= 1000.0
        self.ay_bias /= 1000.0
        self.az_bias /= 1000.0
        self.max_pos_cov /= 100.0
        self.max_vel_cov /= 1000.0
        self.max_att_cov /= 10000.0

    def msg2props(self, node):
        node.setUInt("index", self.index)
        node.setDouble("timestamp_sec", self.timestamp_sec)
        node.setDouble("latitude_deg", self.latitude_deg)
        node.setDouble("longitude_deg", self.longitude_deg)
        node.setDouble("altitude_m", self.altitude_m)
        node.setDouble("vn_ms", self.vn_ms)
        node.setDouble("ve_ms", self.ve_ms)
        node.setDouble("vd_ms", self.vd_ms)
        node.setDouble("roll_deg", self.roll_deg)
        node.setDouble("pitch_deg", self.pitch_deg)
        node.setDouble("yaw_deg", self.yaw_deg)
        node.setDouble("p_bias", self.p_bias)
        node.setDouble("q_bias", self.q_bias)
        node.setDouble("r_bias", self.r_bias)
        node.setDouble("ax_bias", self.ax_bias)
        node.setDouble("ay_bias", self.ay_bias)
        node.setDouble("az_bias", self.az_bias)
        node.setDouble("max_pos_cov", self.max_pos_cov)
        node.setDouble("max_vel_cov", self.max_vel_cov)
        node.setDouble("max_att_cov", self.max_att_cov)
        node.setUInt("sequence_num", self.sequence_num)
        node.setUInt("status", self.status)

    def props2msg(self, node):
        self.index = node.getUInt("index")
        self.timestamp_sec = node.getDouble("timestamp_sec")
        self.latitude_deg = node.getDouble("latitude_deg")
        self.longitude_deg = node.getDouble("longitude_deg")
        self.altitude_m = node.getDouble("altitude_m")
        self.vn_ms = node.getDouble("vn_ms")
        self.ve_ms = node.getDouble("ve_ms")
        self.vd_ms = node.getDouble("vd_ms")
        self.roll_deg = node.getDouble("roll_deg")
        self.pitch_deg = node.getDouble("pitch_deg")
        self.yaw_deg = node.getDouble("yaw_deg")
        self.p_bias = node.getDouble("p_bias")
        self.q_bias = node.getDouble("q_bias")
        self.r_bias = node.getDouble("r_bias")
        self.ax_bias = node.getDouble("ax_bias")
        self.ay_bias = node.getDouble("ay_bias")
        self.az_bias = node.getDouble("az_bias")
        self.max_pos_cov = node.getDouble("max_pos_cov")
        self.max_vel_cov = node.getDouble("max_vel_cov")
        self.max_att_cov = node.getDouble("max_att_cov")
        self.sequence_num = node.getUInt("sequence_num")
        self.status = node.getUInt("status")

# Message: nav_v6
# Id: 52
class nav_v6():
    id = 52
    _pack_string = "<LllfhhhhhhBB"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.latitude_raw = 0
        self.longitude_raw = 0
        self.altitude_m = 0.0
        self.vn_mps = 0.0
        self.ve_mps = 0.0
        self.vd_mps = 0.0
        self.roll_deg = 0.0
        self.pitch_deg = 0.0
        self.yaw_deg = 0.0
        self.sequence_num = 0
        self.status = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  self.latitude_raw,
                  self.longitude_raw,
                  self.altitude_m,
                  int(round(self.vn_mps * 100.0)),
                  int(round(self.ve_mps * 100.0)),
                  int(round(self.vd_mps * 100.0)),
                  int(round(self.roll_deg * 50.0)),
                  int(round(self.pitch_deg * 50.0)),
                  int(round(self.yaw_deg * 50.0)),
                  self.sequence_num,
                  self.status)
        return msg

    def unpack(self, msg):
        (self.millis,
         self.latitude_raw,
         self.longitude_raw,
         self.altitude_m,
         self.vn_mps,
         self.ve_mps,
         self.vd_mps,
         self.roll_deg,
         self.pitch_deg,
         self.yaw_deg,
         self.sequence_num,
         self.status) = self._struct.unpack(msg)
        self.vn_mps /= 100.0
        self.ve_mps /= 100.0
        self.vd_mps /= 100.0
        self.roll_deg /= 50.0
        self.pitch_deg /= 50.0
        self.yaw_deg /= 50.0

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setInt("latitude_raw", self.latitude_raw)
        node.setInt("longitude_raw", self.longitude_raw)
        node.setDouble("altitude_m", self.altitude_m)
        node.setDouble("vn_mps", self.vn_mps)
        node.setDouble("ve_mps", self.ve_mps)
        node.setDouble("vd_mps", self.vd_mps)
        node.setDouble("roll_deg", self.roll_deg)
        node.setDouble("pitch_deg", self.pitch_deg)
        node.setDouble("yaw_deg", self.yaw_deg)
        node.setUInt("sequence_num", self.sequence_num)
        node.setUInt("status", self.status)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.latitude_raw = node.getInt("latitude_raw")
        self.longitude_raw = node.getInt("longitude_raw")
        self.altitude_m = node.getDouble("altitude_m")
        self.vn_mps = node.getDouble("vn_mps")
        self.ve_mps = node.getDouble("ve_mps")
        self.vd_mps = node.getDouble("vd_mps")
        self.roll_deg = node.getDouble("roll_deg")
        self.pitch_deg = node.getDouble("pitch_deg")
        self.yaw_deg = node.getDouble("yaw_deg")
        self.sequence_num = node.getUInt("sequence_num")
        self.status = node.getUInt("status")

# Message: nav_metrics_v6
# Id: 53
class nav_metrics_v6():
    id = 53
    _pack_string = "<LhhhhhhHHHHHHHHH"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.metrics_millis = 0
        self.p_bias = 0.0
        self.q_bias = 0.0
        self.r_bias = 0.0
        self.ax_bias = 0.0
        self.ay_bias = 0.0
        self.az_bias = 0.0
        self.Pp0 = 0.0
        self.Pp1 = 0.0
        self.Pp2 = 0.0
        self.Pv0 = 0.0
        self.Pv1 = 0.0
        self.Pv2 = 0.0
        self.Pa0 = 0.0
        self.Pa1 = 0.0
        self.Pa2 = 0.0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.metrics_millis,
                  int(round(self.p_bias * 10000.0)),
                  int(round(self.q_bias * 10000.0)),
                  int(round(self.r_bias * 10000.0)),
                  int(round(self.ax_bias * 1000.0)),
                  int(round(self.ay_bias * 1000.0)),
                  int(round(self.az_bias * 1000.0)),
                  int(round(self.Pp0 * 100.0)),
                  int(round(self.Pp1 * 100.0)),
                  int(round(self.Pp2 * 100.0)),
                  int(round(self.Pv0 * 1000.0)),
                  int(round(self.Pv1 * 1000.0)),
                  int(round(self.Pv2 * 1000.0)),
                  int(round(self.Pa0 * 10000.0)),
                  int(round(self.Pa1 * 10000.0)),
                  int(round(self.Pa2 * 10000.0)))
        return msg

    def unpack(self, msg):
        (self.metrics_millis,
         self.p_bias,
         self.q_bias,
         self.r_bias,
         self.ax_bias,
         self.ay_bias,
         self.az_bias,
         self.Pp0,
         self.Pp1,
         self.Pp2,
         self.Pv0,
         self.Pv1,
         self.Pv2,
         self.Pa0,
         self.Pa1,
         self.Pa2) = self._struct.unpack(msg)
        self.p_bias /= 10000.0
        self.q_bias /= 10000.0
        self.r_bias /= 10000.0
        self.ax_bias /= 1000.0
        self.ay_bias /= 1000.0
        self.az_bias /= 1000.0
        self.Pp0 /= 100.0
        self.Pp1 /= 100.0
        self.Pp2 /= 100.0
        self.Pv0 /= 1000.0
        self.Pv1 /= 1000.0
        self.Pv2 /= 1000.0
        self.Pa0 /= 10000.0
        self.Pa1 /= 10000.0
        self.Pa2 /= 10000.0

    def msg2props(self, node):
        node.setUInt("metrics_millis", self.metrics_millis)
        node.setDouble("p_bias", self.p_bias)
        node.setDouble("q_bias", self.q_bias)
        node.setDouble("r_bias", self.r_bias)
        node.setDouble("ax_bias", self.ax_bias)
        node.setDouble("ay_bias", self.ay_bias)
        node.setDouble("az_bias", self.az_bias)
        node.setDouble("Pp0", self.Pp0)
        node.setDouble("Pp1", self.Pp1)
        node.setDouble("Pp2", self.Pp2)
        node.setDouble("Pv0", self.Pv0)
        node.setDouble("Pv1", self.Pv1)
        node.setDouble("Pv2", self.Pv2)
        node.setDouble("Pa0", self.Pa0)
        node.setDouble("Pa1", self.Pa1)
        node.setDouble("Pa2", self.Pa2)

    def props2msg(self, node):
        self.metrics_millis = node.getUInt("metrics_millis")
        self.p_bias = node.getDouble("p_bias")
        self.q_bias = node.getDouble("q_bias")
        self.r_bias = node.getDouble("r_bias")
        self.ax_bias = node.getDouble("ax_bias")
        self.ay_bias = node.getDouble("ay_bias")
        self.az_bias = node.getDouble("az_bias")
        self.Pp0 = node.getDouble("Pp0")
        self.Pp1 = node.getDouble("Pp1")
        self.Pp2 = node.getDouble("Pp2")
        self.Pv0 = node.getDouble("Pv0")
        self.Pv1 = node.getDouble("Pv1")
        self.Pv2 = node.getDouble("Pv2")
        self.Pa0 = node.getDouble("Pa0")
        self.Pa1 = node.getDouble("Pa1")
        self.Pa2 = node.getDouble("Pa2")

# Message: effectors_v1
# Id: 61
class effectors_v1():
    id = 61
    _pack_string = "<Lhhhhhhhh"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.channel = [0.0] * 8
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  int(round(self.channel[0] * 20000.0)),
                  int(round(self.channel[1] * 20000.0)),
                  int(round(self.channel[2] * 20000.0)),
                  int(round(self.channel[3] * 20000.0)),
                  int(round(self.channel[4] * 20000.0)),
                  int(round(self.channel[5] * 20000.0)),
                  int(round(self.channel[6] * 20000.0)),
                  int(round(self.channel[7] * 20000.0)))
        return msg

    def unpack(self, msg):
        (self.millis,
         self.channel[0],
         self.channel[1],
         self.channel[2],
         self.channel[3],
         self.channel[4],
         self.channel[5],
         self.channel[6],
         self.channel[7]) = self._struct.unpack(msg)
        self.channel[0] /= 20000.0
        self.channel[1] /= 20000.0
        self.channel[2] /= 20000.0
        self.channel[3] /= 20000.0
        self.channel[4] /= 20000.0
        self.channel[5] /= 20000.0
        self.channel[6] /= 20000.0
        self.channel[7] /= 20000.0

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        for _i in range(8): node.setDouble("channel", self.channel[_i], _i)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        for _i in range(8): self.channel[_i] = node.getDouble("channel", _i)

# Message: inceptors_v2
# Id: 63
class inceptors_v2():
    id = 63
    _pack_string = "<LhhhHHBhhBB"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.roll = 0.0
        self.pitch = 0.0
        self.yaw = 0.0
        self.power = 0.0
        self.flaps = 0.0
        self.gear = 0
        self.aux1 = 0.0
        self.aux2 = 0.0
        self.master_switch = 0
        self.throttle_enable = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  int(round(self.roll * 30000.0)),
                  int(round(self.pitch * 30000.0)),
                  int(round(self.yaw * 30000.0)),
                  int(round(self.power * 60000.0)),
                  int(round(self.flaps * 60000.0)),
                  self.gear,
                  int(round(self.aux1 * 30000.0)),
                  int(round(self.aux2 * 30000.0)),
                  self.master_switch,
                  self.throttle_enable)
        return msg

    def unpack(self, msg):
        (self.millis,
         self.roll,
         self.pitch,
         self.yaw,
         self.power,
         self.flaps,
         self.gear,
         self.aux1,
         self.aux2,
         self.master_switch,
         self.throttle_enable) = self._struct.unpack(msg)
        self.roll /= 30000.0
        self.pitch /= 30000.0
        self.yaw /= 30000.0
        self.power /= 60000.0
        self.flaps /= 60000.0
        self.aux1 /= 30000.0
        self.aux2 /= 30000.0

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setDouble("roll", self.roll)
        node.setDouble("pitch", self.pitch)
        node.setDouble("yaw", self.yaw)
        node.setDouble("power", self.power)
        node.setDouble("flaps", self.flaps)
        node.setUInt("gear", self.gear)
        node.setDouble("aux1", self.aux1)
        node.setDouble("aux2", self.aux2)
        node.setUInt("master_switch", self.master_switch)
        node.setUInt("throttle_enable", self.throttle_enable)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.roll = node.getDouble("roll")
        self.pitch = node.getDouble("pitch")
        self.yaw = node.getDouble("yaw")
        self.power = node.getDouble("power")
        self.flaps = node.getDouble("flaps")
        self.gear = node.getUInt("gear")
        self.aux1 = node.getDouble("aux1")
        self.aux2 = node.getDouble("aux2")
        self.master_switch = node.getUInt("master_switch")
        self.throttle_enable = node.getUInt("throttle_enable")

# Message: power_v1
# Id: 55
class power_v1():
    id = 55
    _pack_string = "<LHHHHH"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.avionics_vcc = 0.0
        self.main_vcc = 0.0
        self.cell_vcc = 0.0
        self.main_amps = 0.0
        self.total_mah = 0.0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  int(round(self.avionics_vcc * 1000.0)),
                  int(round(self.main_vcc * 1000.0)),
                  int(round(self.cell_vcc * 1000.0)),
                  int(round(self.main_amps * 1000.0)),
                  int(round(self.total_mah * 0.5)))
        return msg

    def unpack(self, msg):
        (self.millis,
         self.avionics_vcc,
         self.main_vcc,
         self.cell_vcc,
         self.main_amps,
         self.total_mah) = self._struct.unpack(msg)
        self.avionics_vcc /= 1000.0
        self.main_vcc /= 1000.0
        self.cell_vcc /= 1000.0
        self.main_amps /= 1000.0
        self.total_mah /= 0.5

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setDouble("avionics_vcc", self.avionics_vcc)
        node.setDouble("main_vcc", self.main_vcc)
        node.setDouble("cell_vcc", self.cell_vcc)
        node.setDouble("main_amps", self.main_amps)
        node.setDouble("total_mah", self.total_mah)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.avionics_vcc = node.getDouble("avionics_vcc")
        self.main_vcc = node.getDouble("main_vcc")
        self.cell_vcc = node.getDouble("cell_vcc")
        self.main_amps = node.getDouble("main_amps")
        self.total_mah = node.getDouble("total_mah")

# Message: fcs_refs_v1
# Id: 65
class fcs_refs_v1():
    id = 65
    _pack_string = "<LhHhhh"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.groundtrack_deg = 0.0
        self.altitude_agl_ft = 0.0
        self.airspeed_kt = 0.0
        self.roll_deg = 0.0
        self.pitch_deg = 0.0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  int(round(self.groundtrack_deg * 10.0)),
                  int(round(self.altitude_agl_ft * 10.0)),
                  int(round(self.airspeed_kt * 10.0)),
                  int(round(self.roll_deg * 10.0)),
                  int(round(self.pitch_deg * 10.0)))
        return msg

    def unpack(self, msg):
        (self.millis,
         self.groundtrack_deg,
         self.altitude_agl_ft,
         self.airspeed_kt,
         self.roll_deg,
         self.pitch_deg) = self._struct.unpack(msg)
        self.groundtrack_deg /= 10.0
        self.altitude_agl_ft /= 10.0
        self.airspeed_kt /= 10.0
        self.roll_deg /= 10.0
        self.pitch_deg /= 10.0

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setDouble("groundtrack_deg", self.groundtrack_deg)
        node.setDouble("altitude_agl_ft", self.altitude_agl_ft)
        node.setDouble("airspeed_kt", self.airspeed_kt)
        node.setDouble("roll_deg", self.roll_deg)
        node.setDouble("pitch_deg", self.pitch_deg)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.groundtrack_deg = node.getDouble("groundtrack_deg")
        self.altitude_agl_ft = node.getDouble("altitude_agl_ft")
        self.airspeed_kt = node.getDouble("airspeed_kt")
        self.roll_deg = node.getDouble("roll_deg")
        self.pitch_deg = node.getDouble("pitch_deg")

# Message: mission_v1
# Id: 60
class mission_v1():
    id = 60
    _pack_string = "<LHHHHHll"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.task_name = ""
        self.task_attribute = 0
        self.route_size = 0
        self.target_waypoint_idx = 0
        self.wp_index = 0
        self.wp_longitude_raw = 0
        self.wp_latitude_raw = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  len(self.task_name),
                  self.task_attribute,
                  self.route_size,
                  self.target_waypoint_idx,
                  self.wp_index,
                  self.wp_longitude_raw,
                  self.wp_latitude_raw)
        msg += str.encode(self.task_name)
        return msg

    def unpack(self, msg):
        base_len = struct.calcsize(self._pack_string)
        extra = msg[base_len:]
        msg = msg[:base_len]
        (self.millis,
         self.task_name_len,
         self.task_attribute,
         self.route_size,
         self.target_waypoint_idx,
         self.wp_index,
         self.wp_longitude_raw,
         self.wp_latitude_raw) = self._struct.unpack(msg)
        self.task_name = extra[:self.task_name_len].decode()
        extra = extra[self.task_name_len:]

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setString("task_name", self.task_name)
        node.setUInt("task_attribute", self.task_attribute)
        node.setUInt("route_size", self.route_size)
        node.setUInt("target_waypoint_idx", self.target_waypoint_idx)
        node.setUInt("wp_index", self.wp_index)
        node.setInt("wp_longitude_raw", self.wp_longitude_raw)
        node.setInt("wp_latitude_raw", self.wp_latitude_raw)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.task_name = node.getString("task_name")
        self.task_attribute = node.getUInt("task_attribute")
        self.route_size = node.getUInt("route_size")
        self.target_waypoint_idx = node.getUInt("target_waypoint_idx")
        self.wp_index = node.getUInt("wp_index")
        self.wp_longitude_raw = node.getInt("wp_longitude_raw")
        self.wp_latitude_raw = node.getInt("wp_latitude_raw")

# Message: system_health_v6
# Id: 46
class system_health_v6():
    id = 46
    _pack_string = "<fHHHHHHH"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.timestamp_sec = 0.0
        self.system_load_avg = 0.0
        self.fmu_timer_misses = 0
        self.avionics_vcc = 0.0
        self.main_vcc = 0.0
        self.cell_vcc = 0.0
        self.main_amps = 0.0
        self.total_mah = 0.0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.timestamp_sec,
                  int(round(self.system_load_avg * 100.0)),
                  self.fmu_timer_misses,
                  int(round(self.avionics_vcc * 1000.0)),
                  int(round(self.main_vcc * 1000.0)),
                  int(round(self.cell_vcc * 1000.0)),
                  int(round(self.main_amps * 1000.0)),
                  int(round(self.total_mah * 0.1)))
        return msg

    def unpack(self, msg):
        (self.timestamp_sec,
         self.system_load_avg,
         self.fmu_timer_misses,
         self.avionics_vcc,
         self.main_vcc,
         self.cell_vcc,
         self.main_amps,
         self.total_mah) = self._struct.unpack(msg)
        self.system_load_avg /= 100.0
        self.avionics_vcc /= 1000.0
        self.main_vcc /= 1000.0
        self.cell_vcc /= 1000.0
        self.main_amps /= 1000.0
        self.total_mah /= 0.1

    def msg2props(self, node):
        node.setDouble("timestamp_sec", self.timestamp_sec)
        node.setDouble("system_load_avg", self.system_load_avg)
        node.setUInt("fmu_timer_misses", self.fmu_timer_misses)
        node.setDouble("avionics_vcc", self.avionics_vcc)
        node.setDouble("main_vcc", self.main_vcc)
        node.setDouble("cell_vcc", self.cell_vcc)
        node.setDouble("main_amps", self.main_amps)
        node.setDouble("total_mah", self.total_mah)

    def props2msg(self, node):
        self.timestamp_sec = node.getDouble("timestamp_sec")
        self.system_load_avg = node.getDouble("system_load_avg")
        self.fmu_timer_misses = node.getUInt("fmu_timer_misses")
        self.avionics_vcc = node.getDouble("avionics_vcc")
        self.main_vcc = node.getDouble("main_vcc")
        self.cell_vcc = node.getDouble("cell_vcc")
        self.main_amps = node.getDouble("main_amps")
        self.total_mah = node.getDouble("total_mah")

# Message: status_v7
# Id: 56
class status_v7():
    id = 56
    _pack_string = "<LHHBLLHHH"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.serial_number = 0
        self.firmware_rev = 0
        self.master_hz = 0
        self.baud = 0
        self.available_memory = 0
        self.link_state = 0
        self.byte_rate = 0
        self.main_loop_timer_misses = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  self.serial_number,
                  self.firmware_rev,
                  self.master_hz,
                  self.baud,
                  self.available_memory,
                  self.link_state,
                  self.byte_rate,
                  self.main_loop_timer_misses)
        return msg

    def unpack(self, msg):
        (self.millis,
         self.serial_number,
         self.firmware_rev,
         self.master_hz,
         self.baud,
         self.available_memory,
         self.link_state,
         self.byte_rate,
         self.main_loop_timer_misses) = self._struct.unpack(msg)

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setUInt("serial_number", self.serial_number)
        node.setUInt("firmware_rev", self.firmware_rev)
        node.setUInt("master_hz", self.master_hz)
        node.setUInt("baud", self.baud)
        node.setUInt("available_memory", self.available_memory)
        node.setUInt("link_state", self.link_state)
        node.setUInt("byte_rate", self.byte_rate)
        node.setUInt("main_loop_timer_misses", self.main_loop_timer_misses)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.serial_number = node.getUInt("serial_number")
        self.firmware_rev = node.getUInt("firmware_rev")
        self.master_hz = node.getUInt("master_hz")
        self.baud = node.getUInt("baud")
        self.available_memory = node.getUInt("available_memory")
        self.link_state = node.getUInt("link_state")
        self.byte_rate = node.getUInt("byte_rate")
        self.main_loop_timer_misses = node.getUInt("main_loop_timer_misses")

# Message: event_v2
# Id: 44
class event_v2():
    id = 44
    _pack_string = "<fBH"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.timestamp_sec = 0.0
        self.sequence_num = 0
        self.message = ""
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.timestamp_sec,
                  self.sequence_num,
                  len(self.message))
        msg += str.encode(self.message)
        return msg

    def unpack(self, msg):
        base_len = struct.calcsize(self._pack_string)
        extra = msg[base_len:]
        msg = msg[:base_len]
        (self.timestamp_sec,
         self.sequence_num,
         self.message_len) = self._struct.unpack(msg)
        self.message = extra[:self.message_len].decode()
        extra = extra[self.message_len:]

    def msg2props(self, node):
        node.setDouble("timestamp_sec", self.timestamp_sec)
        node.setUInt("sequence_num", self.sequence_num)
        node.setString("message", self.message)

    def props2msg(self, node):
        self.timestamp_sec = node.getDouble("timestamp_sec")
        self.sequence_num = node.getUInt("sequence_num")
        self.message = node.getString("message")

# Message: event_v3
# Id: 64
class event_v3():
    id = 64
    _pack_string = "<LH"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.millis = 0
        self.message = ""
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.millis,
                  len(self.message))
        msg += str.encode(self.message)
        return msg

    def unpack(self, msg):
        base_len = struct.calcsize(self._pack_string)
        extra = msg[base_len:]
        msg = msg[:base_len]
        (self.millis,
         self.message_len) = self._struct.unpack(msg)
        self.message = extra[:self.message_len].decode()
        extra = extra[self.message_len:]

    def msg2props(self, node):
        node.setUInt("millis", self.millis)
        node.setString("message", self.message)

    def props2msg(self, node):
        self.millis = node.getUInt("millis")
        self.message = node.getString("message")

# Message: command_v1
# Id: 28
class command_v1():
    id = 28
    _pack_string = "<HH"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.sequence_num = 0
        self.message = ""
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.sequence_num,
                  len(self.message))
        msg += str.encode(self.message)
        return msg

    def unpack(self, msg):
        base_len = struct.calcsize(self._pack_string)
        extra = msg[base_len:]
        msg = msg[:base_len]
        (self.sequence_num,
         self.message_len) = self._struct.unpack(msg)
        self.message = extra[:self.message_len].decode()
        extra = extra[self.message_len:]

    def msg2props(self, node):
        node.setUInt("sequence_num", self.sequence_num)
        node.setString("message", self.message)

    def props2msg(self, node):
        self.sequence_num = node.getUInt("sequence_num")
        self.message = node.getString("message")

# Message: ack_v1
# Id: 57
class ack_v1():
    id = 57
    _pack_string = "<HB"
    _struct = struct.Struct(_pack_string)

    def __init__(self, msg=None):
        # public fields
        self.sequence_num = 0
        self.result = 0
        # unpack if requested
        if msg: self.unpack(msg)

    def pack(self):
        msg = self._struct.pack(
                  self.sequence_num,
                  self.result)
        return msg

    def unpack(self, msg):
        (self.sequence_num,
         self.result) = self._struct.unpack(msg)

    def msg2props(self, node):
        node.setUInt("sequence_num", self.sequence_num)
        node.setUInt("result", self.result)

    def props2msg(self, node):
        self.sequence_num = node.getUInt("sequence_num")
        self.result = node.getUInt("result")
