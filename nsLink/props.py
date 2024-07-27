from PropertyTree import PropertyNode

# Configuration
ident_node = PropertyNode('/config/identity')
specs_node = PropertyNode('/config/specs')
tecs_config_node = PropertyNode('/config/autopilot/TECS')

# Sensors
airdata_node = PropertyNode("/sensors/airdata")
imu_node = PropertyNode("/sensors/imu")
gps_node = PropertyNode("/sensors/gps")
power_node = PropertyNode("/sensors/power")

# INS/GNSS
nav_node = PropertyNode("/filters/nav")

# Status and Comms
ann_node = PropertyNode("/annunciators")
alerts_node = PropertyNode("/alerts")
remote_link_node = PropertyNode("/comms/remote_link")
status_node = PropertyNode("/status")

# Autopilot
inceptors_node = PropertyNode("/fcs/inceptors")

targets_node = PropertyNode("/autopilot/targets")
tecs_node = PropertyNode("/autopilot/tecs")
tecs_config_node = PropertyNode("/config/autopilot/TECS")
