from nicegui import ui

from event_mgr import command_mgr
from event_mgr import event_mgr
from nodes import imu_node

class Notes():
    def __init__(self):
        ui.label("Flight Notes").style("font-size: 140%")
        self.note = ui.input(label='Add Note', placeholder='start typing').on('keydown.enter', self.user_note)
        self.event_log = ui.markdown() # .style('white-space: pre-wrap')
        self.last_command = 0

    def add_note(self, secs, color, message, notify):
        msg = '<font color="%s">__[%.1f]__  ```%s```' % (color, secs, message)
        self.event_log.content = msg + "\n\n" + self.event_log.content
        if notify:
            msg = '[%.1f] %s' % (secs, message)
            ui.notify(msg, position="top")

    def user_note(self):
        secs = imu_node.getUInt("millis") / 1000
        self.add_note(secs, "green", self.note.value, notify=False)
        # msg = '<font color="green">__[%.1f]__  ```%s```' % (secs, self.note.value)
        # self.event_log.content = msg + "</font>\n" + self.event_log.content
        # msg = "[%.1f] %s" % (secs, self.note.value)
        # ui.notify(msg, position="top")
        self.note.value = ""

    @ui.refreshable
    def update(self):
        result = event_mgr.get_next_event()
        if result is not None:
            secs = result[0]/1000
            self.add_note(secs, "black", result[1], notify=True)
            # msg = "__[%.1f]__  ```%s```" % (result[0]/1000, result[1])
            # self.event_log.content = msg + "\n" + self.event_log.content
            # msg = "[%.1f] %s" % (result[0]/1000, result[1])
            # ui.notify(msg, position="top")
            print(event_mgr.pending_log)

        for result in command_mgr.results[self.last_command:]:
            secs = result[0]/1000
            self.add_note(secs, "gray", result[1], notify=False)
            # msg = "__[%.1f]__\n" % (result[0]/1000)
            # msg += "```%s```\n" % result[1]
            # self.event_log.content += msg
            self.last_command = len(command_mgr.results)