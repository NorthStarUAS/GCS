from math import floor, pi, sqrt
from time import time

from props import PropertyNode
from props import airdata_node, ann_node, gps_node, imu_node, inceptors_node, nav_node, power_node, remote_link_node, specs_node, status_node, refs_node

# ann_gps_node = PropertyNode("/annunciators/gps")
# ann_ekf_node = PropertyNode("/annunciators/ekf")
# ann_batt_node = PropertyNode("/annunciators/battery")
# ann_timer_node = PropertyNode("/annunciators/timer")
# ann_link_node = PropertyNode("/annunciators/link")
# ann_auto_node = PropertyNode("/annunciators/auto")
# ann_wind_node = PropertyNode("/annunciators/wind")
# ann_temp_node = PropertyNode("/annunciators/temp")

r2d = 180 / pi
kt2mps = 0.5144444444444444444
mps2kt = 1.0 / kt2mps

class Entry():
    def __init__(self, msg="", ok=0, warn=0, alert=0, inverse=False, timeout_sec=0):
        self.message = msg
        self.ok = ok
        self.warn = warn
        self.alert = alert
        self.inverse = inverse
        if timeout_sec > 0:
            self.timeout_sec = time() + timeout_sec
        else:
            self.timeout_sec = 0
        self.val = 0
        self.report_val = None
        self.level = 0  # 0 = ok/not shown, 1 = ok/shown, 2 = warn, 3 = alert

    def update(self, val=None, report_val=None, force_level=None):
        self.val = val
        self.report_val = report_val

        if force_level is not None:
            self.level = force_level
            return

        if not self.inverse:
            if val >= self.alert:
                self.level = 3
            elif val >= self.warn:
                self.level = 2
            elif val >= self.ok:
                self.level = 1
            else:
                self.level = 0
        else:
            if val <= self.alert:
                self.level = 3
            elif val <= self.warn:
                self.level = 2
            elif val <= self.ok:
                self.level = 1
            else:
                self.level = 0

    def gen_message(self):
        if self.val is None:
            result = self.message
        elif self.report_val is not None:
            result = self.message % self.report_val
        else:
            result = self.message % self.val
        return result

class Alerts():
    def __init__(self):
        self.msg_list = []

        # EKF messages
        self.pos_msg = Entry(msg="Pos Acc: %.2f m", ok=2.0, warn=4.0, alert=6.0)
        self.vel_msg = Entry(msg="Vel Acc: %.2f m/s", ok=0.1, warn=0.2, alert=0.4)
        self.att_msg = Entry(msg="Att Acc: %.2f deg", ok=0.25, warn=0.5, alert=1.0)
        self.acc_bias_msg = Entry(msg="Accel Bias: %.2f mps2", ok=0.25, warn=0.5, alert=1.0)
        self.gyro_bias_msg = Entry(msg="Gyro Bias: %.2f dps", ok=0.25, warn=0.5, alert=1.0)
        self.imu_temp_msg = Entry(msg="IMU Temp: %.0fC", ok=30, warn=40, alert=50)
        self.msg_list += [self.pos_msg, self.vel_msg, self.att_msg, self.acc_bias_msg, self.gyro_bias_msg, self.imu_temp_msg]

        # System
        self.mem_msg = Entry(msg="Memory: %d b", ok=150000, warn=100000, alert=50000, inverse=True)
        self.msg_list += [self.mem_msg]

        # Airdata
        self.air_err_msg = Entry(msg="Airdata Err: %d", ok=1, warn=10, alert=25)
        self.msg_list += [self.air_err_msg]

        # GPS
        self.last_gps_status = -1
        self.gps_sats_msg = Entry(msg="GPS sats: %d", ok=10, warn=7, alert=5, inverse=True)
        self.gps_hdop_msg = Entry(msg="GPS hdop: %.2f", ok=2, warn=3.5, alert=5.0)
        self.msg_list += [self.gps_sats_msg, self.gps_hdop_msg]

        # Power
        self.av_vcc_msg = Entry(msg="Avionics: %.2f v", ok=0.05, warn=0.1, alert=0.2)
        self.cell_vcc_msg = Entry(msg="Batt Cell: %.2f v", ok=3.7, warn=3.5, alert=3.3, inverse=True)
        self.thr_msg = Entry(msg="Throttle: %.0f%", ok=0.6, warn=0.75, alert=0.9)
        self.msg_list += [self.av_vcc_msg, self.cell_vcc_msg, self.thr_msg]

        # Wind
        self.wind_kt_msg = Entry(msg="Wind: %.0f kt", ok=0.3, warn=0.5, alert=0.7)
        self.msg_list += [self.wind_kt_msg]

    def add_message(self, message, level=2, timeout_sec=1):
        e = Entry(msg=message, timeout_sec=timeout_sec)
        e.update(val=None, force_level=level)
        self.msg_list.append(e)

    def update(self):
        self.update_values()
        self.update_props()
        self.update_annunciators()

    def update_values(self):
        ekf_status = nav_node.getUInt("status")

        # INS/GNSS messages
        Pp0 = nav_node.getDouble("Pp0")
        Pp1 = nav_node.getDouble("Pp1")
        Pp2 = nav_node.getDouble("Pp2")
        pos_cov = sqrt(Pp0*Pp0 + Pp1*Pp1 + Pp2*Pp2)
        if ekf_status < 2:
            pos_cov = 0
        self.pos_msg.update(pos_cov)

        Pv0 = nav_node.getDouble("Pv0")
        Pv1 = nav_node.getDouble("Pv1")
        Pv2 = nav_node.getDouble("Pv2")
        vel_cov = sqrt(Pv0*Pv0 + Pv1*Pv1 + Pv2*Pv2)
        if ekf_status < 2:
            vel_cov = 0
        self.vel_msg.update(vel_cov)

        Pa0 = nav_node.getDouble("Pa0")
        Pa1 = nav_node.getDouble("Pa1")
        Pa2 = nav_node.getDouble("Pa2")
        att_cov = sqrt(Pa0*Pa0 + Pa1*Pa1 + Pa2*Pa2) * r2d
        if ekf_status < 2:
            att_cov = 0
        self.att_msg.update(att_cov)

        ax_bias = nav_node.getDouble("ax_bias")
        ay_bias = nav_node.getDouble("ay_bias")
        az_bias = nav_node.getDouble("az_bias")
        accel_bias = sqrt(ax_bias*ax_bias + ay_bias*ay_bias + az_bias*az_bias)
        if ekf_status < 2:
            accel_bias = 0
        self.acc_bias_msg.update(accel_bias)

        p_bias = nav_node.getDouble("p_bias") * r2d
        q_bias = nav_node.getDouble("q_bias") * r2d
        r_bias = nav_node.getDouble("r_bias") * r2d
        gyro_bias = sqrt(p_bias*p_bias + q_bias*q_bias + r_bias*r_bias)
        if ekf_status < 2:
            gyro_bias = 0
        self.gyro_bias_msg.update(gyro_bias)

        self.imu_temp_msg.update(imu_node.getDouble("temp_C"))

        # Other system stuff
        self.mem_msg.update(status_node.getUInt("available_memory"))

        # fmu_timer = parseInt(json.status.fmu_timer_misses)
        # msg = "FMU Timer Err: " + fmu_timer
        # add_status_message(msg, fmu_timer, 1, 10, 25)

        self.air_err_msg.update(airdata_node.getUInt("error_count"))

        # GPS messages
        gps_status = gps_node.getUInt("status")
        if gps_status != self.last_gps_status:
            if gps_status == 3:
                lev = 1
            elif gps_status == 2:
                lev = 2
            else:
                lev = 3
            self.add_message("GPS status: %d" % gps_status, level=lev, timeout_sec=10)
        self.last_gps_status = gps_status
        self.gps_sats_msg.update(gps_node.getUInt("num_sats"))
        self.gps_hdop_msg.update(gps_node.getDouble("hdop"))

        # Power messages
        av_vcc = power_node.getDouble("avionics_vcc")
        av_error = abs(5.0 - av_vcc)
        self.av_vcc_msg.update(av_error, report_val=av_vcc)

        self.cell_vcc_msg.update(power_node.getDouble("cell_vcc"))

        if False: #fixem
            if airdata_node.getBool("is_airborne"):
                self.thr_msg.update(eff_node.getDouble("throttle"))
            else:
                self.thr_msg.update(eff_node.getDouble("throttle"), force_level=0)

        # Wind
        if airdata_node.getBool("is_airborne"):
            if False: #fixme
                wind_kt = airdata_node.getDouble("wind_speed_mps") * mps2kt
                target_airspeed_kt = refs_node.getDouble("airspeed_kt")
                ratio = 0.0
                if target_airspeed_kt > 0.1:
                    ratio = wind_kt / target_airspeed_kt
                self.wind_kt_msg.update(ratio, report_val=wind_kt)

    def update_props(self):
        # prune expired messages
        for i in reversed(range(len(self.msg_list))):
            e = self.msg_list[i]
            # print(e.timeout_sec, time())
            if e.timeout_sec > 0 and time() > e.timeout_sec:
                del self.msg_list[i]
                # quit()

        # build lists of active alerts
        self.alerts = []
        self.warns = []
        self.oks = []
        for e in self.msg_list:
            if e.level == 3:
                self.alerts.append(e.gen_message())
            elif e.level == 2:
                self.warns.append(e.gen_message())
            elif e.level == 1:
                self.oks.append(e.gen_message())

        for i, message in enumerate(self.oks):
            status_node.setString("oks", message, i)
        for i in range(len(self.oks), status_node.getLen("oks")):
            status_node.setString("oks", "", i)

        for i, message in enumerate(self.warns):
            status_node.setString("warns", message, i)
        for i in range(len(self.warns), status_node.getLen("warns")):
            status_node.setString("warns", "", i)

        for i, message in enumerate(self.alerts):
            status_node.setString("alerts", message, i)
        for i in range(len(self.alerts), status_node.getLen("alerts")):
            status_node.setString("alerts", "", i)

    def update_annunciators(self):
        gps_level = max([3-self.last_gps_status, self.gps_sats_msg.level, self.gps_hdop_msg.level])
        ann_node.setString("gps", "%d;%d Sats" % (gps_level, self.gps_sats_msg.val))

        ekf_level = max([self.pos_msg.level, self.vel_msg.level, self.att_msg.level, self.acc_bias_msg.level, self.gyro_bias_msg.level, self.imu_temp_msg.level])
        ann_node.setString("ekf", "%d;EKF" % ekf_level)

        ann_node.setString("battery", "%d;Batt %.0f%% %.2fv" % (self.cell_vcc_msg.level, power_node.getDouble("battery_perc")*100, self.cell_vcc_msg.val))

        secs = airdata_node.getUInt("flight_timer_millis")/1000.0
        hours = floor(secs / 3600)
        rem = secs - (hours * 3600)
        mins = floor(rem / 60)
        rem = rem - (mins * 60)
        msg = "Flt "
        if secs < 3600:
            msg += "%d:%02d" % (mins, rem)
        else:
            msg += "%d:%02d:%02d" % (hours, mins, rem)
        ann_node.setString("timer", "1;%s" % msg)

        link_state = remote_link_node.getString("link_state") == "ok"
        if link_state:
            ann_node.setString("link", "1;Link")
        else:
            ann_node.setString("link", "3;Lost Link")

        auto = inceptors_node.getBool("master_switch")
        if auto:
            ann_node.setString("auto", "1;Auto")
        else:
            ann_node.setString("auto", "2;Manual")

        display_units = "??"
        speed_scale = 1.0
        if specs_node.getString("display_units") == "mps":
            speed_scale = kt2mps
            display_units = "ms"
        elif specs_node.getString("display_units") == "kts":
            speed_scale = 1.0
            display_units = "kt"
        else:
            # default to mps if not specified
            speed_scale = kt2mps
            display_units = "ms"
        wind_dir = int(round(airdata_node.getDouble("wind_dir_deg") * 0.1) * 10)
        wind_speed = airdata_node.getDouble("wind_speed_mps")*mps2kt*speed_scale
        target_airspeed = refs_node.getDouble("airspeed_kt")*speed_scale
        ratio = 0.0
        if target_airspeed > 0.1:
            ratio = wind_speed / target_airspeed
        if ratio < 0.5:
            wind_level = 1
        elif ratio < 0.7:
            wind_level = 2
        else:
            wind_level = 3
        ann_node.setString("wind", "%d;%03d@%.0f" % (wind_level, wind_dir, wind_speed) + display_units)

        temp = airdata_node.getDouble("air_temp_C")
        if temp < -30 or temp > 50:
            temp_level = 3
        elif temp < -10 or temp > 35:
            temp_level = 2
        else:
            temp_level = 1
        ann_node.setString("temp", "%d;%dC" % (temp_level, temp))

alert_mgr = Alerts()