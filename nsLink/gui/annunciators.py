from nicegui import ui

from nodes import ann_node, ident_node

class Annunciator():
    def __init__(self, id):
        self.id = id
        self.button = ui.button(id).style("font-size: 100%").props('no-caps')

    def update(self):
        level, msg = ann_node.getString(self.id).split(";")
        print(level, msg)
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
            self.ui_callsign = ui.button("Callsign: n/a").style("font-size: 100%")
            self.annunciator_list = [Annunciator("gps"), Annunciator("ekf"), Annunciator("battery"), Annunciator("timer"),
                                     Annunciator("link"), Annunciator("auto"), Annunciator("wind"), Annunciator("temp")]
            ui.space()
            ui.button(on_click=lambda: right_drawer.toggle(), icon='menu').props('flat color=white')

    def update(self):
        callsign = ident_node.getString("call_sign")
        if len(callsign):
            self.ui_callsign.set_text("Callsign: " + callsign)
        else:
            self.ui_callsign.set_text("Callsign: " + "still waiting")

        for ann in self.annunciator_list:
            ann.update()
