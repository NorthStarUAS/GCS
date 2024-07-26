from PropertyTree import PropertyNode

# Configuration
ident_node = PropertyNode('/config/identity')
specs_node = PropertyNode('/config/specs')
tecs_config_node = PropertyNode('/config/autopilot/TECS')

# Sensors
airdata_node = PropertyNode("/sensors/airdata")
imu_node = PropertyNode("/sensors/imu")
inceptor_node = PropertyNode("/sensors/inceptors")
gps_node = PropertyNode("/sensors/gps")
pilot_node = PropertyNode("/sensors/pilot")
power_node = PropertyNode("/sensors/power")
switches_node = PropertyNode("/switches")

# INS/GNSS
nav_node = PropertyNode("/filters/nav")

# Status and Comms
ann_node = PropertyNode("/annunciators")
alerts_node = PropertyNode("/alerts")
remote_link_node = PropertyNode("/comms/remote_link")
status_node = PropertyNode("/status")

# Autopilot
targets_node = PropertyNode("/autopilot/targets")
tecs_node = PropertyNode("/autopilot/tecs")
tecs_config_node = PropertyNode("/config/autopilot/TECS")
