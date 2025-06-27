from nicegui import ui

class Events():
    def __init__(self):
        return
        with ui.right_drawer(fixed=False).style('background-color: #ebf1fa').props('bordered') as right_drawer:
            ui.label('Event Log')

    def update(self):
        pass