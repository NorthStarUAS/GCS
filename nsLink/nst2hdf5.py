#!/usr/bin/python3

# export more real csv with first line column headers

import argparse
import datetime
import h5py
import numpy as np
import os
import pandas as pd
import sys
import tempfile
from tqdm import tqdm

from props import environment_node, gps_node, imu_node, status_node

sys.path.append("../../src")
import nst_messages

import commands
from derived_states import derived_states
import fmu_link

m2nm = 0.0005399568034557235    # meters to nautical miles

def generate_path(id):
    if id in [nst_messages.gps_v5_id]:
        path = "/sensors/gps"
    elif id in [nst_messages.imu_v6_id]:
        path = "/sensors/imu"
    elif id in [nst_messages.airdata_v8_id, nst_messages.airdata_v9_id]:
        path = "/sensors/airdata"
    elif id in [nst_messages.inceptors_v2_id]:
        path = "/sensors/inceptors"
    elif id in [nst_messages.power_v2_id]:
        path = "/sensors/power"
    elif id in [nst_messages.nav_v6_id]:
        path = "/filters/nav"
    elif id in [nst_messages.nav_metrics_v6_id]:
        path = "/filters/nav_metrics"
    elif id in [nst_messages.environment_v1_id]:
        path = "/filters/env"
    elif id in [nst_messages.fcs_outputs_v1_id]:
        path = "/fcs/outputs"
    elif id in [nst_messages.effectors_v1_id]:
        path = "/fcs/effectors"
    elif id in [nst_messages.fcs_refs_v1_id ]:
        path = "/fcs/refs"
    elif id in [nst_messages.status_v8_id]:
        path = "/status"
    elif id in [nst_messages.event_v3_id]:
        path = "/events"
    elif id in [nst_messages.command_v1_id]:
        path = "/command"
    elif id in [nst_messages.mission_v1_id]:
        path = "/mission"
    elif id in [nst_messages.ack_v1_id]:
        path = "/ack"
    else:
        print("Unknown packet id!", id)
        path = "/unknown-packet-id"
    return path

argparser = argparse.ArgumentParser(description="aura export")
argparser.add_argument("flight", help="load specified flight log")
argparser.add_argument("--skip-seconds", help="seconds to skip when processing flight log")

args = argparser.parse_args()

data = {}
master_headers = {}

located = False
gps_lon = 0.0
gps_lat = 0.0
gps_unix_sec = 0.0

if args.flight:
    if os.path.isdir(args.flight):
        filename = os.path.join(args.flight, "flight.dat.gz")
    else:
        filename = args.flight
    print("filename:", filename)
    if filename.endswith(".gz"):
        (fd, filetmp) = tempfile.mkstemp()
        command = "zcat " + filename + " > " + filetmp
        print(command)
        os.system(command)
        fd = open(filetmp, "rb")
    else:
        fd = open(filename, "rb")

    full = fd.read()

    if filename.endswith(".gz"):
        # remove temporary file name
        os.remove(filetmp)

    divs = 500
    size = len(full)
    chunk_size = size / divs
    threshold = chunk_size
    print("len of decompressed file:", size)

    print("Parsing log file:")
    t = tqdm(total=size, smoothing=0.05)
    last_counter = 0
    while True:
        try:
            (id, msg, counter) = fmu_link.file_read(full)
            # print(id, msg.__dict__)
            t.update(counter-last_counter)
            last_counter = counter
            if not located:
                if gps_node.getInt("status") >= 3 and gps_node.getInt("num_sats") >= 5:
                    gps_node.pretty_print()
                    gps_lat = gps_node.getDouble("latitude_raw") / 10000000.0
                    gps_lon = gps_node.getDouble("longitude_raw") / 10000000.0
                    gps_unix_sec = gps_node.getDouble("unix_usec") / 1000000.0
                    located = True
                    print("start location:", gps_lat, gps_lon, gps_unix_sec)
            derived_states.update()
            path = generate_path(id)
            if "unknown" in path and msg is not None:
                print("unknown:", msg, msg.__dict__)
            if msg is not None:
                if path in data:
                    data[path].append(msg.__dict__)
                else:
                    data[path] = [ msg.__dict__ ]
        except IndexError:
            t.close()
            print("end of file")
            break
else:
    print("A flight log file must be provided")

output_dir = os.path.dirname(os.path.realpath(filename))

# last recorded time stamp
total_time = imu_node.getDouble("millis") / 1000.0
imu_node.pretty_print()

filename = os.path.join(output_dir, "flight.h5")
f = h5py.File(filename, "w")

md = f.create_group("/metadata")
md.attrs["format"] = "NorthStarUAS"
md.attrs["version"] = "4.1"
md.attrs["creator"] = "Curtis L. Olson"
md.attrs["url"] = "https://www.flightgear.org"

for key in sorted(data):
    print("key:", key)
    # print("data:", data[key])
    print("data[0]:", data[key][0])
    for sub in sorted(data[key][0]):
        print("sub:", sub)
    size = len(data[key])
    if total_time > 0.01:
        rate = size / total_time
    else:
        rate = 0.0
    print("%-10s %5.1f/sec (%7d records)" % (key, rate, size))
    if size == 0:
        continue
    df = pd.DataFrame(data[key])
    if "millis" in data[key]:
        df.set_index("millis", inplace=True, drop=False)
    elif "metric_millis" in data[key]:
        df.set_index("metric_millis", inplace=True, drop=False)
    else:
        print("oops, no timstamp?")
    for column in df.columns:
        print("key2:", key + "/" + column)
        print("vals:", np.array(df[column].tolist()))
        print(type(df[column].values))
        if type(df[column].values[0]) != str:
            f.create_dataset(key + "/" + column,
                             data=np.array(df[column].tolist()),
                             compression="gzip", compression_opts=9)
        else:
            # special str handling
            dt = h5py.special_dtype(vlen=str)
            f.create_dataset(key + "/" + column,
                             data=df[column].values, dtype=dt,
                             compression="gzip", compression_opts=9)

f.close()

print()
print("Total log time: %.1f min" % (total_time / 60.0))
print("Flight timer: %.1f min" % (environment_node.getDouble("flight_timer_millis") / (1000 * 60.0)))
print("Flight timer (accum/estim): %.1f min" % (status_node.getDouble("flight_timer") / 60))
print("Autopilot timer: %.1f min" % (status_node.getDouble("autopilot_timer") / 60.0))
print("Throttle timer: %.1f min" % (status_node.getDouble("throttle_timer") / 60.0))
od = status_node.getDouble("odometer_m")
print("Distance flown: %.2f nm (%.2f km)" % (od*m2nm, od*0.001))
print()

apikey = ""
try:
    from os.path import expanduser
    home = expanduser("~")
    f = open(home + "/.pirateweather")
    apikey = f.read().rstrip()
except:
    print("you must sign up for a free apikey at pirateweather.net and insert it as a single line inside a file called ~/.pirateweather (with no other text in the file)")

if not apikey:
    print("Cannot lookup weather because no pirateweather.net apikey found.")
elif gps_unix_sec < 1:
    print("Cannot lookup weather because gps didn't report unix time.")
else:
    print()
    #utc = datetime.timezone(0)
    d = datetime.datetime.utcfromtimestamp(gps_unix_sec)
    print(d.strftime("%Y-%m-%d-%H:%M:%S"))

    url = "https://timemachine.pirateweather.net/forecast/" + apikey + "/%.8f,%.8f,%.d" % (gps_lat, gps_lon, gps_unix_sec)
    print("url:", url)
    import urllib.request, json
    response = urllib.request.urlopen(url)
    data = json.loads(response.read())
    mph2kt = 0.868976
    mb2inhg = 0.0295299830714
    if "currently" in data:
        currently = data["currently"]
        #for key in currently:
        #    print key, ":", currently[key]
        if "icon" in currently:
            icon = currently["icon"]
            print("Summary:", icon)
        if "temperature" in currently:
            tempF = currently["temperature"]
            tempC = (tempF - 32.0) * 5 / 9
            print("Temp:", "%.1f F" % tempF, "(%.1f C)" % tempC)
        if "dewPoint" in currently:
            tempF = currently["dewPoint"]
            tempC = (tempF - 32.0) * 5 / 9
            print("Dewpoint:", "%.1f F" % tempF, "(%.1f C)" % tempC)
        if "humidity" in currently:
            hum = currently["humidity"]
            print("Humidity:", "%.0f%%" % (hum * 100.0))
        if "pressure" in currently:
            mbar = currently["pressure"]
            inhg = mbar * mb2inhg
            print("Pressure:", "%.2f inhg" % inhg, "(%.1f mbar)" % mbar)
        if "windSpeed" in currently:
            wind_mph = currently["windSpeed"]
            wind_kts = wind_mph * mph2kt
        else:
            wind_mph = 0
            wind_kts = 0
        if "windBearing" in currently:
            wind_deg = currently["windBearing"]
        else:
            wind_deg = 0
        print("Wind %d deg @ %.1f kt (%.1f mph) @ " % (wind_deg, wind_kts, wind_mph, ))
        if "visibility" in currently:
            vis = currently["visibility"]
            print("Visibility:", "%.1f miles" % vis)
        if "cloudCover" in currently:
            cov = currently["cloudCover"]
            print("Cloud Cover:", "%.0f%%" % (cov * 100.0))
