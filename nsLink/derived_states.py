import math

from props import airdata_node, inceptors_node, nav_node, power_node, status_node, targets_node, tecs_config_node, tecs_node


r2d = 180.0 / math.pi
mps2kt = 1.9438444924406046432
kt2mps = 0.5144444444444444444
ft2m = 0.3048
g = 9.81

# crude battery % interpolation model
# 100 - 4.2
# 83% - 3.8
# 27% - 3.65
# 0%  - 3.5
batv = [ 3.3, 3.50, 3.65, 3.80, 4.20 ]
batp = [ 0.0, 0.05, 0.27, 0.83, 1.00 ]
from scipy.interpolate import interp1d
batf = interp1d(batv, batp)
filt_perc = 1.0

class DerivedStates:
    def __init__(self):
        self.last_time = 0.0
        self.flight_timer = 0.0
        self.ap_timer = 0.0
        self.throttle_timer = 0.0
        self.odometer = 0.0
        self.airspeed_filt = 0.0

    def update(self):
        self.compute_derived_states()
        self.compute_tecs()

    def compute_derived_states(self):
        # filtered airspeed
        airspeed_mps = airdata_node.getDouble("airspeed_mps")
        self.airspeed_filt = 0.95 * self.airspeed_filt + 0.05 * airspeed_mps
        airdata_node.setDouble("airspeed_filt_mps", self.airspeed_filt)

        # compute ground track heading/speed
        vn = nav_node.getDouble("vn_mps")
        ve = nav_node.getDouble("ve_mps")
        vd = nav_node.getDouble("vd_mps")
        hdg = (math.pi * 0.5 - math.atan2(vn, ve)) * r2d
        vel_ms = math.sqrt( vn*vn + ve*ve + vd*vd )
        nav_node.setDouble("groundtrack_deg", hdg)
        nav_node.setDouble("groundspeed_ms", vel_ms)
        nav_node.setDouble("groundspeed_kt", vel_ms * mps2kt)

        # compute frame dt
        current_time = nav_node.getDouble('timestamp')
        dt = current_time - self.last_time
        self.last_time = current_time

        # local 'airborne' helper (not official)
        is_airborne = airdata_node.getDouble("is_airborne")

        # local autopilot timer
        ap_enabled = inceptors_node.getBool("master_switch")

        # estimate odometer and timers
        if is_airborne:
            self.flight_timer += dt
            self.odometer += vel_ms * dt
            if ap_enabled:
                self.ap_timer += dt
        if inceptors_node.getDouble("power") > 0.1:
            self.throttle_timer += dt
        status_node.setDouble("flight_timer", self.flight_timer)
        status_node.setDouble("autopilot_timer", self.ap_timer)
        status_node.setDouble("throttle_timer", self.throttle_timer)
        status_node.setDouble("odometer_m", self.odometer)

        # autopilot error metrics
        roll_error = targets_node.getDouble('roll_deg') - nav_node.getDouble('roll_deg')
        #print 'error %.4f,%.1f' % (nav_node.getDouble('timestamp'), roll_error)

        volts = power_node.getDouble("main_vcc")
        amps = power_node.getDouble("main_amps")
        watts = volts * amps
        power_node.setDouble("main_watts", watts)

        cell_volts = power_node.getDouble("cell_vcc")
        if cell_volts < 3.3: cell_volts = 3.3
        if cell_volts > 4.2: cell_volts = 4.2
        batt_perc = batf(cell_volts)
        global filt_perc
        if filt_perc is None:
            filt_perc = batt_perc
        else:
            filt_perc = 0.9995 * filt_perc + 0.0005 * batt_perc
        power_node.setDouble("battery_perc", filt_perc)

    def compute_tecs(self):
        if nav_node.getDouble('timestamp') < 0.01:
            # do nothing if filter not inited
            return

        mass_kg = tecs_config_node.getDouble("mass_kg")
        if mass_kg < 0.01:
            mass_kg = 3.0
        if tecs_config_node.hasChild("weight_bal"):
            wb = tecs_config_node.getDouble("weight_bal")
        else:
            wb = 1.0
        # fixme:
        wb = 0.0
        alt_m = nav_node.getDouble("altitude_m")
        vel_mps = airdata_node.getDouble("airspeed_filt_mps") * kt2mps
        target_alt_m = targets_node.getDouble("altitude_msl_ft") * ft2m
        target_vel_mps = targets_node.getDouble("airspeed_kt") * kt2mps

        energy_pot = mass_kg * g * alt_m
        energy_kin = 0.5 * mass_kg * vel_mps * vel_mps

        target_pot = mass_kg * g * target_alt_m
        target_kin = 0.5 * mass_kg * target_vel_mps * target_vel_mps

        error_pot = target_pot - energy_pot
        error_kin = target_kin - energy_kin
        # print(nav_node.getDouble('timestamp'), 'target_alt:', target_alt_m, 'tgt_pot:', target_pot, 'E_pot:', energy_pot, 'Err_kin:', error_kin, 'Err_pot:', error_pot)
        error_total = error_pot + error_kin
        error_bal =  (2.0 - wb) * error_kin - wb * error_pot

        tecs_node.setDouble("energy_total", energy_pot + energy_kin )
        tecs_node.setDouble("target_total", target_pot + target_kin )
        tecs_node.setDouble("error_total", error_total)
        tecs_node.setDouble("error_diff", error_bal)

derived_states = DerivedStates()