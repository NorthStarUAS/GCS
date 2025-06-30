from nicegui import ui

from PropertyTree import PropertyNode

from event_mgr import event_mgr
from nodes import ident_node

from gui.annunciators import Annunciators

@ui.refreshable
async def bus_data():
    json = PropertyNode("/").get_json_string()
    # ui.run_javascript("var json = " + json)  # copy property tree to javascript session

    # print("json:", json)
    # ui.json_editor({"content": {"json": json}, "readOnly": True},
    #                on_select=lambda e: ui.notify(f'Select: {e}'),
    #                on_change=lambda e: ui.notify(f'Change: {e}'))
    ui.label(json).classes("font-mono").style("white-space: pre-wrap")

class MainDisplay():
    def __init__(self):
        with ui.header(elevated=True).classes('items-center').style("font-size: 150%"):
            self.annunciator_bar = Annunciators()
            ui.space()
            with ui.dropdown_button("Panel", auto_close=True) as tab_menu:
                ui.item("Panel", on_click=lambda: ui.notify('You clicked item 1'))
                ui.item("Map", on_click=lambda: ui.notify('You clicked item 1'))
                ui.item("Data Bus", on_click=lambda: ui.notify('You clicked item 1'))

            ui.button(on_click=lambda: self.right_drawer.toggle(), icon='menu').props('flat color=white')

        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as self.right_drawer:
            self.event_log = ui.label('Event Log').style('white-space: pre-wrap')

        with ui.tabs().classes("w-full") as tabs:
            panel = ui.tab("Panel", icon="speed")
            map = ui.tab("Map", icon="public")
            bus = ui.tab("Data Bus", icon="feed")
        tabs.set_visibility(True)

        with ui.tab_panels(tabs, value=panel).classes('w-full'):
            with ui.tab_panel(bus):
                bus_data()

        ui.timer(0.1, bus_data.refresh)

    def update(self):
        self.annunciator_bar.update()

        result = event_mgr.get_next_event()
        if result is not None:
            msg = "[%.1f] %s" % (result[0]/1000, result[1])
            ui.notify(msg, position="top")
            self.event_log.text += "\n" + msg
            print(event_mgr.pending_log)

