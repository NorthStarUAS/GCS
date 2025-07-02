from nodes import imu_node

# really, the only reason to track these messages and store them here is so the
# gui can display them.  But I hesitate to intricately weave gui dependencies
# into the code, so this is a staging area the gui can pull from.

class Events():
    def __init__(self):
        self.saved_log = []
        self.pending_log = []

    def add_event(self, event_message):
        millis = imu_node.getUInt("millis")
        self.pending_log.append( [millis, event_message] )

    def get_next_event(self):
        if len(self.pending_log):
            result = self.pending_log[0]
            self.saved_log.append(result)
            self.pending_log = self.pending_log[1:]
        else:
            result = None
        return result

class Commands():
    def __init__(self):
        self.results = []

    def add_event(self, event_message):
        millis = imu_node.getUInt("millis")
        self.results.append( [millis, event_message] )

event_mgr = Events()
command_mgr = Commands()