from PropertyTree import PropertyNode

# Configuration
ident_node = PropertyNode("/config/identity")
specs_node = PropertyNode("/config/specs")
launch_node = PropertyNode("/config/mission/launch")
land_node = PropertyNode("/config/mission/land")

# Sensors
airdata_node = PropertyNode("/sensors/airdata")
imu_node = PropertyNode("/sensors/imu")
inceptors_node = PropertyNode("/sensors/inceptors")
gps_node = PropertyNode("/sensors/gps")
power_node = PropertyNode("/sensors/power")

# INS/GNSS
environment_node = PropertyNode("/filters/env")
nav_node = PropertyNode("/filters/nav")

# Status and Comms
status_node = PropertyNode("/status")
events_node = PropertyNode("/events")
ann_node = PropertyNode("/status/annunciators")
remote_link_node = PropertyNode("/comms/remote_link")

# FCS
refs_node = PropertyNode("/fcs/refs")
tecs_node = PropertyNode("/fcs/tecs")
tecs_config_node = PropertyNode("/config/fcs/TECS")
outputs_node = PropertyNode("/fcs/outputs")
effectors_node = PropertyNode("/fcs/effectors")

# Mission and Tasks
mission_node = PropertyNode("/mission")
circle_node = PropertyNode("/mission/circle")
home_node = PropertyNode("/mission/home")
route_node = PropertyNode("/mission/route")
active_node = PropertyNode("/mission/route/active")
