from nicegui import ui
from uuid import uuid4

from commands import commands
from event_mgr import command_mgr

class Console():
    def __init__(self):
        user = str(uuid4())
        avatar = f'https://robohash.org/{user}?bgset=bg2'
        with ui.row().classes('w-full items-center'):
            with ui.avatar():
                ui.image(avatar)
            self.input = ui.input(label="Send command", placeholder='start typing') \
                .props('rounded outlined').classes('flex-grow') \
                .on('keydown.enter', self.send)
        self.data = ui.markdown("").classes("font-mono").style("white-space: pre-wrap")
        self.last_length = 0

    def send(self):
        commands.add(self.input.value)
        self.input.value = ""

    @ui.refreshable
    async def update(self):
        if len(command_mgr.results) > self.last_length:
            self.last_length = len(command_mgr.results)
            self.data.content = ""
            for result in reversed(command_mgr.results):
                msg = "__[%.1f]__\n" % (result[0]/1000)
                msg += "```%s```\n" % result[1]
                self.data.content += msg
