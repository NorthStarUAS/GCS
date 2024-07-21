import time

import ns_messages
from fmu_link import fmu_link
from props import remote_link_node

class Commands():
    def __init__(self):
        self.cmd_send_index = 1
        self.cmd_recv_index = 0
        self.prime_state = True
        self.cmd_queue =  []
        self.last_sent_time = 0.0
        self.last_received_time = 0.0

    # send current command until acknowledged
    def update(self):
        # look at the remote's report of last message received from base
        sequence_num = remote_link_node.getInt('sequence_num')
        if sequence_num != self.cmd_recv_index:
            self.last_received_time = time.time()
            self.cmd_recv_index = sequence_num
            print("received ack:", self.cmd_recv_index)

        # if current command has been received, advance to next command
        if self.cmd_recv_index == self.cmd_send_index:
            if len(self.cmd_queue):
                if not self.prime_state:
                    self.cmd_queue.pop(0)
                    self.cmd_send_index += 1
                    if self.cmd_send_index > 255:
                        self.cmd_send_index = 1
                else:
                    self.prime_state = False

        self.gen_heartbeat()

        if len(self.cmd_queue):
            current_time = time.time()
            if current_time > self.last_sent_time + 0.5:
                # discard any pending heartbeat commands if we have real work
                while len(self.cmd_queue) > 1 and self.cmd_queue[0] == 'hb':
                    self.cmd_queue.pop(0)
                # send the command
                command = self.cmd_queue[0]
                print('writing:', sequence_num, command)
                cmd = ns_messages.command_v1()
                cmd.sequence_num = self.cmd_send_index
                cmd.message = command
                buf = cmd.pack()
                result = fmu_link.wrap_and_send(cmd.id, buf)
                self.last_sent_time = current_time
                return self.cmd_send_index
        else:
            # nothing to do if command queue empty
            self.prime_state = True

        return 0

    def add(self, command):
        print('command queue:', command)
        self.cmd_queue.append(command)

    def cmd_queue_size(self):
        return len(self.cmd_queue)

    def cmd_queue_empty(self):
        return len(self.cmd_queue) == 0

    def get_cmd_recv_index(self):
        return self.cmd_recv_index

    # schedule a heartbeat message if needed.
    def gen_heartbeat(self):
        elapsed_sec = time.time() - self.last_received_time
        if self.cmd_queue_empty() and elapsed_sec > 10.0:
            self.add('hb')

    def remote_lost_link_predict(self):
        # print("last = %.2f  cur = %.2f", (last_delivered_time, current_time))
        if self.last_received_time + 60 > time.time():
            remote_link_node.setString("link_state", "ok")
            return True
        else:
            remote_link_node.setString("link_state", "lost")
            return False

commands = Commands()