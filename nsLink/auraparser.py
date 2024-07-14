import datetime

from PropertyTree import PropertyNode

import ns_messages
from props import airdata_node, imu_node, nav_node, pilot_node, power_node, remote_link_node, status_node, switches_node
from serial_link import serial_link, START_OF_MSG0, START_OF_MSG1

parser = None
f = None

def init():
    global parser
    parser = serial_link()
    new_logfile()

def update(ser):
    global parser
    pkt_id = parser.read(ser)
    if pkt_id >= 0:
        parse_msg(pkt_id, parser.payload)
        log_msg(f, pkt_id, parser.pkt_len, parser.payload,
                parser.cksum_lo, parser.cksum_hi)

def new_logfile():
    global f

    d = datetime.datetime.utcnow()
    logfile = 'flight-' + d.strftime("%Y%m%d-%H%M%S") + '.log'
    try:
        f = open(logfile, 'wb')
    except:
        print("Cannot open:", logfile)
        quit()

def parse_msg(id, buf):
    if id == ns_messages.gps_v3_id:
        index = packer.unpack_gps_v3(buf)
    elif id == ns_messages.gps_v4_id:
        index = packer.unpack_gps_v4(buf)
    elif id == ns_messages.gps_v5_id:
        index = packer.unpack_gps_v5(buf)
    elif id == ns_messages.imu_v4_id:
        index = packer.unpack_imu_v4(buf)
    elif id == ns_messages.imu_v5_id:
        index = packer.unpack_imu_v5(buf)
    elif id == ns_messages.imu_v6_id:
        msg = ns_messages.imu_v6(buf)
        msg.msg2props(imu_node)
        index = msg.index
    elif id == ns_messages.airdata_v6_id:
        index = packer.unpack_airdata_v6(buf)
    elif id == ns_messages.airdata_v7_id:
        index = packer.unpack_airdata_v7(buf)
    elif id == ns_messages.airdata_v8_id:
        msg = ns_messages.airdata_v8(buf)
        msg.msg2props(airdata_node)
        index = msg.index
    elif id == ns_messages.effectors_v1_id:
        index = packer.unpack_effectors_v1(buf)
    elif id == ns_messages.filter_v4_id:
        index = packer.unpack_filter_v4(buf)
    elif id == ns_messages.filter_v5_id:
        index = packer.unpack_filter_v5(buf)
    elif id == ns_messages.nav_v6_id:
        msg = ns_messages.nav_v6(buf)
        msg.msg2props(nav_node)
        index = msg.index
    elif id == ns_messages.nav_metrics_v6_id:
        msg = ns_messages.nav_metrics_v6(buf)
        msg.msg2props(nav_node)
        index = msg.index
    elif id == ns_messages.actuator_v2_id:
        index = packer.unpack_act_v2(buf)
    elif id == ns_messages.actuator_v3_id:
        index = packer.unpack_act_v3(buf)
    elif id == ns_messages.pilot_v3_id:
        index = packer.unpack_pilot_v3(buf)
    elif id == ns_messages.pilot_v4_id:
        msg = ns_messages.pilot_v4(buf)
        msg.msg2props(pilot_node)
        index = msg.index
        switches_node.setBool("master_switch", msg.master_switch)
        switches_node.setBool("throttle_safety", msg.throttle_safety)
    elif id == ns_messages.inceptors_v1_id:
        index = packer.unpack_inceptors_v1(buf)
    elif id == ns_messages.power_v1_id:
        msg = ns_messages.power_v1(buf)
        msg.msg2props(power_node)
        index = msg.index
    elif id == ns_messages.ap_status_v6_id:
        index = packer.unpack_ap_status_v6(buf)
    elif id == ns_messages.ap_status_v7_id:
        index = packer.unpack_ap_status_v7(buf)
    elif id == ns_messages.ap_targets_v1_id:
        index = packer.unpack_ap_targets_v1(buf)
    elif id == ns_messages.mission_v1_id:
        index = packer.unpack_mission_v1(buf)
    elif id == ns_messages.system_health_v5_id:
        index = packer.unpack_system_health_v5(buf)
    elif id == ns_messages.system_health_v6_id:
        index = packer.unpack_system_health_v6(buf)
    elif id == ns_messages.status_v7_id:
        msg = ns_messages.status_v7(buf)
        msg.msg2props(status_node)
        index = msg.index
    elif id == ns_messages.event_v1_id:
        index = packer.unpack_event_v1(buf)
    elif id == ns_messages.event_v2_id:
        index = packer.unpack_event_v2(buf)
    elif id == ns_messages.command_v1_id:
        command = ns_messages.command_v1(buf)
        pos1 = command.message.find(" ")
        pos2 = command.message.find(" ", pos1+1)
        path = command.message[pos1+1:pos2]
        json = command.message[pos2+1:len(command.message)]
        print(path, " = ", json)
        node = PropertyNode(path)
        if not node.set_json_string(json):
            print("json string parsing/setting failed")
        index = 0
    elif id == ns_messages.ack_v1_id:
        msg = ns_messages.ack_v1(buf)
        if msg.result > 0:
            remote_link_node.setInt("sequence_num", msg.sequence_num)
        index = 0
    else:
        print("Unknown packet id:", id)
        index = 0
    # except:
    #     print "Error unpacking packet id:", id
    #     index = 0
    return index

def log_msg(f, pkt_id, pkt_len, payload, cksum_lo, cksum_hi):
    f.write(bytes([START_OF_MSG0]))
    f.write(bytes([START_OF_MSG1]))
    f.write(bytes([pkt_id]))
    f.write(bytes([pkt_len]))
    f.write(payload)
    f.write(bytes([cksum_lo]))
    f.write(bytes([cksum_hi]))

# simple 2-byte checksum
def validate_cksum(id, len_lo, len_hi, buf, cksum0, cksum1):
    c0 = 0
    c1 = 0
    c0 = (c0 + id) & 0xff
    c1 = (c1 + c0) & 0xff
    # print "c0 =", c0, "c1 =", c1
    c0 = (c0 + len_lo) & 0xff
    c1 = (c1 + c0) & 0xff
    #print("c0 =", c0, "c1 =", c1)
    c0 = (c0 + len_hi) & 0xff
    c1 = (c1 + c0) & 0xff
    #print("c0 =", c0, "c1 =", c1)
    for i in range(0, len_hi*256+len_lo):
        c0 = (c0 + buf[i]) & 0xff
        c1 = (c1 + c0) & 0xff
        # print "c0 =", c0, "c1 =", c1, '[', ord(buf[i]), ']'
        # print "c0 =", c0, "(", cksum0, ")", "c1 =", c1, "(", cksum1, ")"
    if c0 == cksum0 and c1 == cksum1:
        return True
    else:
        print("c0 =", c0, "(", cksum0, ")", "c1 =", c1, "(", cksum1, ")")
        return False

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

    if validate_cksum(id, pkt_len_lo, pkt_len_hi, savebuf, cksum0, cksum1):
        # print "check sum passed"
        index = parse_msg(id, savebuf)
        return (id, index, counter)

    print("Check sum failure!")
    return (-1, -1, counter)
