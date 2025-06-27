from nicegui import ui

from event_mgr import event_mgr

class Events():
    def __init__(self):
        return
        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as right_drawer:
            ui.label('Event Log')

    def update(self):
        return
        result = event_mgr.get_next_event()
        if result is not None:
            ui.notify("[%.1f] %s" % (result[0]/1000, result[1]))
            print(event_mgr.pending_log)