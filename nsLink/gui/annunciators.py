from nicegui import ui

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
        with ui.button_group().props('rounded'):
            self.ui_callsign = ui.button("Callsign: n/a").style("font-size: 100%").props('no-caps')
            self.annunciator_list = [Annunciator("gps"), Annunciator("ekf"), Annunciator("battery"), Annunciator("timer"),
                                    Annunciator("link"), Annunciator("auto"), Annunciator("wind"), Annunciator("temp"),
                                    Annunciator("task")]

    def update(self):
        callsign = ident_node.getString("call_sign")
        if len(callsign):
            self.ui_callsign.set_text("Callsign: " + callsign)
        else:
            self.ui_callsign.set_text("Callsign: " + "still waiting")

        for ann in self.annunciator_list:
            ann.update()
