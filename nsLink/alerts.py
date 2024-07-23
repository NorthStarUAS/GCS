from math import pi, sqrt

from props import airdata_node, gps_node, imu_node, nav_node, power_node, status_node

r2d = 180 / pi
kt2mps = 0.5144444444444444444
mps2kt = 1.0 / kt2mps

class Entry():
    def __init__(self):
        pass

class Alerts():
    def __init__(self):
        pass

    def add_status_message(self, msg, val, ok, warn, alert):
        if val >= alert:
            self.alerts.append(msg)
        elif val >= warn:
            self.warns.append(msg)
        elif val >= ok:
            self.oks.push(msg)

    def add_status_message_inv(self, msg, val, ok, warn, alert):
        if val < alert:
            self.alerts.append(msg)
        elif val < warn:
            self.warns.append(msg)
        elif val < ok:
            self.oks.append(msg)

    def update(self):
        self.alerts = []
        self.warns = []
        self.oks = []

        ekf_status = nav_node.getLong("status")

        # INS/GNSS messages
        Pp0 = nav_node.getDouble("Pp0")
        Pp1 = nav_node.getDouble("Pp1")
        Pp2 = nav_node.getDouble("Pp2")
        pos_cov = sqrt(Pp0*Pp0 + Pp1*Pp1 + Pp2*Pp2)
        if ekf_status < 2:
            pos_cov = 0
        msg = "Pos Acc: %.2f m" % pos_cov
        self.add_status_message(msg, pos_cov, 2.0, 3.0, 4.0)

        Pv0 = nav_node.getDouble("Pv0")
        Pv1 = nav_node.getDouble("Pv1")
        Pv2 = nav_node.getDouble("Pv2")
        vel_cov = sqrt(Pv0*Pv0 + Pv1*Pv1 + Pv2*Pv2)
        if ekf_status < 2:
            vel_cov = 0
        msg = "Vel Acc: %.2f m/s" % vel_cov
        self.add_status_message(msg, vel_cov, 0.04, 0.06, 0.1)

        Pa0 = nav_node.getDouble("Pa0")
        Pa1 = nav_node.getDouble("Pa1")
        Pa2 = nav_node.getDouble("Pa2")
        att_cov = sqrt(Pa0*Pa0 + Pa1*Pa1 + Pa2*Pa2) * r2d
        if ekf_status < 2:
            att_cov = 0
        msg = "Att Acc: %.2f deg" % att_cov
        self.add_status_message(msg, att_cov, 0.05, 0.2, 0.4)

        ax_bias = nav_node.getDouble("ax_bias")
        ay_bias = nav_node.getDouble("ay_bias")
        az_bias = nav_node.getDouble("az_bias")
        accel_bias = sqrt(ax_bias*ax_bias + ay_bias*ay_bias + az_bias*az_bias)
        if ekf_status < 2:
            accel_bias = 0
        msg = "Accel Bias: %.2f mps2" % accel_bias
        self.add_status_message(msg, accel_bias, 0.1, 0.5, 1.0)

        p_bias = nav_node.getDouble("p_bias") * r2d
        q_bias = nav_node.getDouble("q_bias") * r2d
        r_bias = nav_node.getDouble("r_bias") * r2d
        gyro_bias = sqrt(p_bias*p_bias + q_bias*q_bias + r_bias*r_bias)
        if ekf_status < 2:
            gyro_bias = 0
        msg = "Gyro Bias: %.2f dps" % gyro_bias
        self.add_status_message(msg, gyro_bias, 0.1, 0.5, 1.0)

        imu_temp = imu_node.getDouble("temp_C")
        msg = "IMU Temp: %.0fC" % imu_temp
        self.add_status_message(msg, imu_temp, 30, 40, 50)

        # Other system stuff
        avail_mem = status_node.getUInt("available_memoery")
        msg = "Memory: %d b" % avail_mem
        self.add_status_message_inv(msg, avail_mem, 150000, 100000, 50000)

        # fmu_timer = parseInt(json.status.fmu_timer_misses)
        # msg = "FMU Timer Err: " + fmu_timer
        # add_status_message(msg, fmu_timer, 1, 10, 25)

        air_err = airdata_node.getLong("error_count")
        msg = "Airdata Err: %d" % air_err
        self.add_status_message(msg, air_err, 1, 10, 25)

        # GPS messages
        gps_status = gps_node.getLong("status")
        msg = "GPS status: %d" % gps_status
        self.add_status_message_inv(msg, gps_status, 3, 2, 1)

        if gps_status > 0:
            gps_sats = gps_node.getLong("num_sats")
            msg = "GPS sats: %d" % gps_sats
            self.add_status_message_inv(msg, gps_sats, 10, 7, 5)

            gps_hdop = gps_node.getLong("hdop")
            msg = "GPS hdop: %.2f" % gps_hdop
            self.add_status_message(msg, gps_hdop, 1.5, 3.0, 5.0)

        # Power messages
        av_vcc = power_node.getDouble("avionics_vcc")
        av_error = abs(5.0 - av_vcc)
        msg = "Avionics: %.2f v" %av_vcc
        self.add_status_message(msg, av_error, 0.025, 0.1, 0.2)

        cell_vcc = power_node.getDouble("cell_vcc")
        msg = "Batt Cell: %.2f v" % cell_vcc
        self.add_status_message_inv(msg, cell_vcc, 3.7, 3.6, 3.5)

        if airdata_node.getBool("is_airborne"):
            throttle = eff_node.getDouble("throttle")
            msg = "Throttle: %.0f%" % throttle*100
            self.add_status_message(msg, throttle, 0.6, 0.75, 0.9)

        # Wind
        if airdata_node.getBool("is_airborne"):
            wind_kt = airdata_node.getDouble("wind_speed_mps") * mps2kt
            target_airspeed_kt = targets_node.getDouble("airspeed_kt")
            msg = "Wind: %.0f kt" % wind_kt
            ratio = 0.0
            if target_airspeed_kt > 0.1:
                ratio = wind_kt / target_airspeed_kt
            self.add_status_message(msg, ratio, 0.3, 0.5, 0.7)
