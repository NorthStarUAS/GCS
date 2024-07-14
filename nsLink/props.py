from PropertyTree import PropertyNode

# Sensors
airdata_node = PropertyNode("/sensors/airdata")
imu_node = PropertyNode("/sensors/imu")
pilot_node = PropertyNode("/pilot")
power_node = PropertyNode("/sensors/power")
switches_node = PropertyNode("/switches")

# INS/GNSS
nav_node = PropertyNode("/filters/nav")

# Status and Comms
remote_link_node = PropertyNode("/comms/remote_link")
status_node = PropertyNode("/status")