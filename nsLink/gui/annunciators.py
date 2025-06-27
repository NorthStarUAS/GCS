from nicegui import ui

from event_mgr import event_mgr
from nodes import ann_node, ident_node

# for name space / ui reasons, the right_drawer event log is connected to the
# header bar which is the annunciators so those two things are glommed together
# here.

class Annunciator():
    def __init__(self, id):
        self.id = id
        self.button = ui.button(id).style("font-size: 100%").props('no-caps')

    def update(self):
        level, msg = ann_node.getString(self.id).split(";")
        self.button.set_text(msg)
        if level == 3:
            self.button.props('color="red"')
        elif level == 2:
            self.button.props('color="yellow"')
        else:
            self.button.props('color="green"')

class Annunciators():
    def __init__(self):
        # with ui.header(elevated=True).classes('items-center justify-between').style("font-size: 150%"):
        with ui.header(elevated=True).classes('items-center').style("font-size: 150%"):
            with ui.button_group().props('rounded'):
                self.ui_callsign = ui.button("Callsign: n/a").style("font-size: 100%").props('no-caps')
                self.annunciator_list = [Annunciator("gps"), Annunciator("ekf"), Annunciator("battery"), Annunciator("timer"),
                                        Annunciator("link"), Annunciator("auto"), Annunciator("wind"), Annunciator("temp")]
            ui.space()
            ui.button(on_click=lambda: self.right_drawer.toggle(), icon='menu').props('flat color=white')

        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as self.right_drawer:
            self.event_log = ui.label('Event Log').style('white-space: pre-wrap')

    def update(self):
        callsign = ident_node.getString("call_sign")
        if len(callsign):
            self.ui_callsign.set_text("Callsign: " + callsign)
        else:
            self.ui_callsign.set_text("Callsign: " + "still waiting")

        for ann in self.annunciator_list:
            ann.update()

        result = event_mgr.get_next_event()
        if result is not None:
            msg = "[%.1f] %s" % (result[0]/1000, result[1])
            ui.notify(msg, position="center", timeout=10.0)
            self.event_log.text += "\n" + msg
            print(event_mgr.pending_log)