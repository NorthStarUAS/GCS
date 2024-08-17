# asynchat example adapted from here:
#   http://www.grantjenks.com/wiki/random/python_asynchat_chat_example

import asynchat  # dnf install python3-pyasynchat; pip install pyasynchat
import asyncore
import socket
import re

from PropertyTree import PropertyNode

from alerts import alert_mgr
from commands import commands
from props import airdata_node, effectors_node, imu_node, nav_node, refs_node

mps2kt = 1.9438444924406046432
m2ft = 1.0 / 0.3048

class ChatHandler(asynchat.async_chat):
    def __init__(self, sock):
        asynchat.async_chat.__init__(self, sock=sock)
        self.set_terminator(b'\n')
        self.buffer = []
        self.path = '/'
        self.prompt = True

        self.pos_comb_node = PropertyNode("/position/combined")

    def collect_incoming_data(self, data):
        print('collect:', data)
        self.buffer.append(data.decode())

    def found_terminator(self):
        msg = ''.join(self.buffer)
        print('Received:', msg)  # fixme: if display on
        self.process_command(msg)
        self.buffer = []

    def gen_fcs_nav_string(self):
        result = [ refs_node.getDouble('groundtrack_deg'),
                   refs_node.getDouble('roll_deg'),
                   nav_node.getDouble('heading_deg'),
                   nav_node.getDouble('roll_deg'),
                   effectors_node.getDouble('channel', 0) ]
        return ','.join(map(str, result))

    def gen_fcs_speed_string(self):
        result = [ refs_node.getDouble('airspeed_kt'),
                   refs_node.getDouble('pitch_deg'),
                   airdata_node.getDouble('airspeed_filt_mps') * mps2kt,
                   nav_node.getDouble('pitch_deg'),
                   effectors_node.getDouble('channel', 1) ]
        return ','.join(map(str, result))

    def gen_fcs_altitude_string(self):
        result = [ refs_node.getDouble('altitude_msl_ft'),
                   self.pos_comb_node.getDouble('altitude_true_m') * m2ft,
                   effectors_node.getDouble('channel', 2) ]
        return ','.join(map(str, result))

    def my_push(self, msg):
        self.push(str.encode(msg))

    def process_command(self, msg):
        if msg != "" and msg != "\r":
            alert_mgr.add_message("local: " + msg, timeout_sec=15)

        tokens = msg.split()
        if len(tokens) == 0:
            self.usage()
        elif tokens[0] == 'data':
            self.prompt = False
        elif tokens[0] == 'prompt':
            self.prompt = True
        elif tokens[0] == 'ls':
            newpath = self.path
            if len(tokens) == 2:
                if tokens[1][0] == '/':
                    newpath = tokens[1]
                else:
                    if self.path[-1] == '/':
                        newpath = self.path + tokens[1]
                    else:
                        newpath = self.path + '/' + tokens[1]
            newpath = self.normalize_path(newpath)
            node = PropertyNode(newpath, False)
            if not node.isNull():
                children = node.getChildren(False)
                for child in children:
                    if node.isArray(child):
                        line = ''
                        for i in range(node.getLen(child)):
                            if node.isValue(child, i):
                                value = node.getString(child, i)
                                line += "%s/%d" % (child, i)
                                line += ' =\t\"' + value + '"\t' + '\n'
                            else:
                                line += "%s/%d/" % (child, i) + '\n'
                    else:
                        if node.isValue(child):
                            value = node.getString(child)
                            line = child + ' =\t\"' + value + '"\t' + '\n'
                        else:
                            line = child + '/' + '\n'
                    self.my_push(line)
            else:
                self.my_push('Error: ' + newpath + ' not found\n')
        elif tokens[0] == 'cd':
            newpath = self.path
            if len(tokens) == 2:
                if tokens[1][0] == '/':
                    newpath = tokens[1]
                else:
                    if self.path[-1] == '/':
                        newpath = self.path + tokens[1]
                    else:
                        newpath = self.path + '/' + tokens[1]
            newpath = self.normalize_path(newpath)
            node = PropertyNode(newpath, False)
            if node:
                self.my_push('path ok: ' + newpath + '\n')
                self.path = newpath
            else:
                self.my_push('Error: ' + newpath + ' not found\n')
        elif tokens[0] == 'pwd':
            self.my_push(self.path + '\n' )
        elif tokens[0] == 'get' or tokens[0] == 'show':
            if len(tokens) == 2:
                if re.search('/', tokens[1]):
                    if tokens[1][0] == '/':
                        # absolute path
                        tmp = tokens[1].split('/')
                    else:
                        # relative path
                        combinedpath = '/'.join([self.path, tokens[1]])
                        combinedpath = self.normalize_path(combinedpath)
                        tmp = combinedpath.split('/')
                    tmppath = '/'.join(tmp[0:-1])
                    if tmppath == '':
                        tmppath = '/'
                    node = PropertyNode(tmppath)
                    name = tmp[-1]
                else:
                    node = PropertyNode(self.path)
                    name = tokens[1]
                value = node.getString(name)
                if self.prompt:
                    self.my_push(tokens[1] + ' = "' + value + '"\n')
                else:
                    self.my_push(value + '\n')
            else:
                self.my_push('usage: get [[/]path/]attr\n')
        elif tokens[0] == 'set':
            if len(tokens) >= 3:
                if re.search('/', tokens[1]):
                    if tokens[1][0] == '/':
                        # absolute path
                        tmp = tokens[1].split('/')
                    else:
                        # relative path
                        combinedpath = '/'.join([self.path, tokens[1]])
                        combinedpath = self.normalize_path(combinedpath)
                        tmp = combinedpath.split('/')
                    tmppath = '/'.join(tmp[0:-1])
                    if tmppath == '':
                        tmppath = '/'
                    node = PropertyNode(tmppath)
                    name = tmp[-1]
                else:
                    node = PropertyNode(self.path)
                    name = tokens[1]
                value = ' '.join(tokens[2:])
                node.setString(name, value)
                if self.prompt:
                    # now fetch and write out the new value as confirmation
                    # of the change
                    value = node.getString(name)
                    self.my_push(tokens[1] + ' = "' + value + '"\n')
            else:
                self.my_push('usage: set [[/]path/]attr value\n')
        elif tokens[0] == 'send':
            c = ' '
            commands.add(c.join(tokens[1:]))
        # elif tokens[0] == 'run':
        #     if len(tokens) == 2:
        # 	string command = tokens[1]
        # 	if command == 'ap.reinit()':
        # 	    control_reinit()
        # 	else:
        # 	    push( 'unknown command: ' )
        # 	    push( tokens[1].c_str() )
        # 	    push( getTerminator() )
        #     else:
        # 	push( 'usage: run <command>' )
        # 	push( getTerminator() )
        elif tokens[0] == 'quit':
            self.close()
            return
        elif tokens[0] == 'shutdown-server':
            if len(tokens) == 2:
                if tokens[1] == 'xyzzy':
                    quit()
            self.my_push('usage: shutdown-server xyzzy\n')
            self.my_push('extra magic argument is required\n')
        elif tokens[0] == 'fcs':
            if len(tokens) == 2:
                tmp = ""
                if self.prompt:
                    tmp = tokens[1]
                    tmp += " = "
                if tokens[1] == "heading":
                    tmp = str(imu_node.getDouble('timestamp')) + ','
                    tmp += self.gen_fcs_nav_string()
                elif tokens[1] == "speed":
                    tmp = str(imu_node.getDouble('timestamp')) + ','
                    tmp += self.gen_fcs_speed_string()
                elif tokens[1] == "altitude":
                    tmp = str(imu_node.getDouble('timestamp')) + ','
                    tmp += self.gen_fcs_altitude_string()
                elif tokens[1] == "all":
                    tmp = str(imu_node.getDouble('timestamp')) + ','
                    tmp += self.gen_fcs_nav_string()
                    tmp += ","
                    tmp += self.gen_fcs_speed_string()
                    tmp += ","
                    tmp += self.gen_fcs_altitude_string()
                tmp += '\n'
                self.my_push( tmp )
        elif tokens[0] == 'fcs-update':
            if len(tokens) == 2:
                newcmd = "fcs-update," + tokens[1]
                commands.add(newcmd)
                if self.prompt:
                    self.my_push('command will be relayed to vehicle.\n')
        else:
            self.usage()

        if self.prompt:
            self.my_push('> ')

    def usage(self):
        message = """
Valid commands are:

help               show this help message
data               switch to raw data mode
prompt             switch to interactive mode (default)
ls [<dir>]         list directory
cd <dir>           cd to a directory, '..' to move back
pwd                display your current path
get <var>          show the value of a parameter
set <var> <val>    set <var> to a new <val>
dump [<dir>]       dump the current state (in xml)
# run <command>      run built in command
quit               terminate client connection
shutdown-server    instruct host server to exit (requires magic argument)
"""
        self.my_push(message)

    def normalize_path(self, raw_path):
        tokens = raw_path.split('/')
        #print(tokens)
        tmp = ['']
        for t in tokens:
            if t == '..':
                if len(tmp) > 1:
                    tmp.pop()
            elif t == '.':
                # do nothing
                pass
            elif t == '':
                # happens if we have double slashes
                pass
            else:
                tmp.append(t)
        result = '/'.join(tmp)
        if result == '':
            result = '/'
        #print 'Original path:', raw_path
        #print 'new      path:', result
        return result

class ChatServer(asyncore.dispatcher):
    def __init__(self, host, port):
        asyncore.dispatcher.__init__(self)
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.bind((host, port))
        self.listen(5)

    def handle_accept(self):
        pair = self.accept()
        if pair is not None:
            sock, addr = pair
            print('Incoming connection from %s' % repr(addr))
            handler = ChatHandler(sock)

def init(port=5050):
    server = ChatServer('localhost', port)
    print('Telnet server on localhost:' + str(port))

def update():
    asyncore.loop(timeout=0, count=1)
