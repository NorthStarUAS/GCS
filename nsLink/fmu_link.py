import serial, serial.tools.list_ports
import time

from PropertyTree import PropertyNode

import nst_messages
from alerts import alert_mgr
from logger import Logger
from props import airdata_node, circle_node, effectors_node, home_node, imu_node, inceptors_node, gps_node, mission_node, nav_node, power_node, refs_node, remote_link_node, route_node, active_node, status_node
from serial_link import serial_link, checksum, wrap_packet, START_OF_MSG0, START_OF_MSG1

class FMULink:
    def __init__(self):
        self.parser = serial_link()
        self.log = Logger()

    def begin(self, device, baud, timeout):
        try:
            self.ser = serial.Serial(device, baud, timeout=0, write_timeout=timeout)
        except:
            print("Cannot open:", device)
            ports = list(serial.tools.list_ports.comports())
            print("Available ports:")
            for p in ports:
                print(p)
            quit()

    def receive(self):
        new_data = True
        while new_data:
            pkt_id = self.parser.read(self.ser)
            if pkt_id >= 0:
                # print("received:", pkt_id)
                parse_msg(pkt_id, self.parser.payload)
                remote_link_node.setDouble("last_received_sec", time.time())
                self.log.log_msg(pkt_id, self.parser.pkt_len, self.parser.payload, self.parser.cksum_lo, self.parser.cksum_hi)
            else:
                new_data = False
        remote_link_node.setInt("good_packet_count", self.parser.good_count)
        remote_link_node.setInt("bad_packet_count", self.parser.bad_count)

    def wrap_and_send(self, id, buf):
        print("write id:", id)
        packet = wrap_packet(id, buf)
        result = self.send_packet(packet)
        return result

    def send_packet(self, packet):
        try:
            result = self.ser.write(packet)
        except serial.SerialTimeoutException:
            result = 0
            print("serial send buffer full!  Command not sent.")
        if result != len(packet):
            print("ERROR: wrote %d of %d bytes to serial port!\n" % (result, len(packet)))
        return result

fmu_link = FMULink()

# working on eliminating "packer" and replacing it with auto-generated message code.
def parse_msg(id, buf):
    if id == nst_messages.gps_v4_id:
        msg = nst_messages.gps_v4(buf)
        msg.msg2props(gps_node)
    elif id == nst_messages.gps_v5_id:
        msg = nst_messages.gps_v5(buf)
        msg.msg2props(gps_node)
    elif id == nst_messages.imu_v5_id:
        msg = nst_messages.imu_v5(buf)
        msg.msg2props(imu_node)
    elif id == nst_messages.imu_v6_id:
        msg = nst_messages.imu_v6(buf)
        msg.msg2props(imu_node)
    elif id == nst_messages.airdata_v7_id:
        msg = nst_messages.airdata_v7(buf)
        msg.msg2props(airdata_node)
    elif id == nst_messages.airdata_v8_id:
        msg = nst_messages.airdata_v8(buf)
        msg.msg2props(airdata_node)
    elif id == nst_messages.effectors_v1_id:
        msg = nst_messages.effectors_v1(buf)
        msg.msg2props(effectors_node)
    elif id == nst_messages.filter_v5_id:
        msg = nst_messages.nav_v5(buf)
        msg.msg2props(nav_node)
    elif id == nst_messages.nav_v6_id:
        msg = nst_messages.nav_v6(buf)
        msg.msg2props(nav_node)
        nav_node.setDouble("latitude_deg", nav_node.getInt("latitude_raw") / 10000000.0)
        nav_node.setDouble("longitude_deg", nav_node.getInt("longitude_raw") / 10000000.0)
        # if remote_link_node.getInt("sequence_num") != msg.sequence_num:
        #     print("nav msg incrementing sequence num:", msg.sequence_num)
        #     remote_link_node.setInt("sequence_num", msg.sequence_num)
    elif id == nst_messages.nav_metrics_v6_id:
        msg = nst_messages.nav_metrics_v6(buf)
        msg.msg2props(nav_node)
    elif id == nst_messages.inceptors_v2_id:
        msg = nst_messages.inceptors_v2(buf)
        msg.msg2props(inceptors_node)
    elif id == nst_messages.power_v1_id:
        msg = nst_messages.power_v1(buf)
        msg.msg2props(power_node)
    elif id == nst_messages.fcs_refs_v1_id:
        msg = nst_messages.fcs_refs_v1(buf)
        msg.msg2props(refs_node)
    elif id == nst_messages.mission_v1_id:
        msg = nst_messages.mission_v1(buf)
        mission_node.setString("task", msg.task_name)
        # # fixme: need to parse route / waypoints
        route_node.setUInt("route_size", msg.route_size)
        route_node.setUInt("target_waypoint_idx", msg.target_waypoint_idx)
        if msg.wp_index < msg.route_size:
            wp_node = active_node.getChild("wpt/%d" % msg.wp_index)
            wp_node.setDouble("longitude_deg", msg.wp_longitude_raw / 10000000.0)
            wp_node.setDouble("latitude_deg", msg.wp_latitude_raw / 10000000.0)
        if msg.wp_index == 65534:
            circle_node.setDouble("longitude_deg", msg.wp_longitude_raw / 10000000.0)
            circle_node.setDouble("latitude_deg", msg.wp_latitude_raw / 10000000.0)
            if msg.task_attribute >= 30000:
                circle_node.setString("direction", "right");
                msg.task_attribute -= 30000
            else:
                circle_node.setString("direction", "left");
            circle_node.setDouble("radius_m",msg.task_attribute)
        if msg.wp_index == 65535:
            home_node.setDouble("longitude_deg", msg.wp_longitude_raw / 10000000.0)
            home_node.setDouble("latitude_deg", msg.wp_latitude_raw / 10000000.0)
            home_node.setDouble("azimuth_deg",msg.task_attribute)
    elif id == nst_messages.system_health_v6_id:
        index = packer.unpack_system_health_v6(buf)
    elif id == nst_messages.status_v7_id:
        msg = nst_messages.status_v7(buf)
        msg.msg2props(status_node)
    elif id == nst_messages.event_v3_id:
        msg = nst_messages.event_v3(buf)
        alert_mgr.add_message(msg.message, 2, 10)
    elif id == nst_messages.command_v1_id:
        command = nst_messages.command_v1(buf)
        pos1 = command.message.find(" ")
        pos2 = command.message.find(" ", pos1+1)
        path = command.message[pos1+1:pos2]
        json = command.message[pos2+1:len(command.message)]
        print(path, " = ", json)
        node = PropertyNode(path)
        if not node.set_json_string(json):
            print("json string parsing/setting failed")
    elif id == nst_messages.ack_v1_id:
        msg = nst_messages.ack_v1(buf)
        print("ack:", msg.sequence_num, "result:", msg.result)
        remote_link_node.setInt("sequence_num", msg.sequence_num)
    else:
        print("Unknown packet id:", id)

counter = 0
def file_read(buf):
    global counter

    savebuf = ''
    myeof = False

    # scan for sync characters
    sync0 = buf[counter]; counter += 1
    sync1 = buf[counter]; counter += 1
    while (sync0 != START_OF_MSG0 or sync1 != START_OF_MSG1) and counter < len(buf):
        sync0 = sync1
        sync1 = buf[counter]; counter += 1
        print("scanning for start of message:", counter, sync0, sync1)

    # print "found start of message ..."

    # read message id and size
    id = buf[counter]; counter += 1
    pkt_len_lo = buf[counter]; counter += 1
    pkt_len_hi = buf[counter]; counter += 1
    size = pkt_len_hi*256 + pkt_len_lo
    # print("message =", id, "size =", size)

    # load message
    try:
        savebuf = buf[counter:counter+size]; counter += size
    except:
        print("ERROR: didn't read enough bytes!")

    # read checksum
    cksum0 = buf[counter]; counter += 1
    cksum1 = buf[counter]; counter += 1

    (c0, c1) = checksum(id, savebuf, pkt_len_lo, pkt_len_hi)
    if cksum0 == c0 and cksum1 == c1:
        # print "check sum passed"
        parse_msg(id, savebuf)
        return (id, counter)

    print("Check sum failure!")
    return (-1, counter)
