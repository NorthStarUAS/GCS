from nicegui import ui

from logger import event_logger
from nodes import imu_node

class uiNotes():
    def __init__(self):
        ui.label("Flight Notes").style("font-size: 140%")
        self.note = ui.input(label='Add Note', placeholder='start typing').on('keydown.enter', self.user_note)
        self.event_log = ui.markdown() # .style('white-space: pre-wrap')
        self.last_event = 0
        self.last_command = 0

    # register operator note as a received event
    def user_note(self):
        millis = imu_node.getUInt("millis")
        event_logger.add_event(millis, "Operator: " + self.note.value)
        self.note.value = ""

    # add note to gui display
    def add_note(self, secs, color, message, notify):
        msg = '<font color="%s">__[%.1f]__  ```%s```' % (color, secs, message)
        self.event_log.content = msg + "\n\n" + self.event_log.content
        if notify:
            msg = '[%.1f] %s' % (secs, message)
            ui.notify(msg, position="top")

    @ui.refreshable
    def update(self):
        for result in event_logger.event_list[self.last_event:]:
            secs = result[0]/1000
            message = result[1]
            if message.startswith("Operator:"):
                color = "green"
                do_notify = True
            elif message.startswith("uas:"):
                color = "black"
                do_notify = True
            else:
                color = "gray"
                do_notify = False
            self.add_note(secs, color, result[1], notify=do_notify)
            print(result)
            self.last_event = (len(event_logger.event_list))
