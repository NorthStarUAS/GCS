from nicegui import ui

from event_mgr import event_mgr
from nodes import imu_node

class Notes():
    def __init__(self):
        ui.label("Flight Notes").style("font-size: 140%")
        self.note = ui.input(label='Add Note', placeholder='start typing').on('keydown.enter', self.add_note)
        self.event_log = ui.markdown().style('white-space: pre-wrap')

    def add_note(self):
        secs = imu_node.getUInt("millis") / 1000
        msg = "__[%.1f]__  ```%s```" % (secs, self.note.value)
        self.event_log.content = msg + "\n" + self.event_log.content
        msg = "[%.1f] %s" % (secs, self.note.value)
        ui.notify(msg, position="top")
        self.note.value = ""

    @ui.refreshable
    def update(self):
        result = event_mgr.get_next_event()
        if result is not None:
            msg = "__[%.1f]__  ```%s```" % (result[0]/1000, result[1])
            self.event_log.content = msg + "\n" + self.event_log.content

            msg = "[%.1f] %s" % (result[0]/1000, result[1])
            ui.notify(msg, position="top")

            print(event_mgr.pending_log)
