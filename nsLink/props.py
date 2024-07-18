from PropertyTree import PropertyNode

# Configuration
ident_node = PropertyNode('/config/identity')
specs_node = PropertyNode('/config/specs')
tecs_config_node = PropertyNode('/config/autopilot/TECS')

# Sensors
airdata_node = PropertyNode("/sensors/airdata")
imu_node = PropertyNode("/sensors/imu")
gps_node = PropertyNode("/sensors/gps")
pilot_node = PropertyNode("/pilot")
power_node = PropertyNode("/sensors/power")
switches_node = PropertyNode("/switches")

# INS/GNSS
nav_node = PropertyNode("/filters/nav")

# Status and Comms
remote_link_node = PropertyNode("/comms/remote_link")
status_node = PropertyNode("/status")
