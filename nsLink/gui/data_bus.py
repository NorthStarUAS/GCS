from nicegui import ui
from uuid import uuid4

from PropertyTree import PropertyNode

from commands import commands
from event_mgr import command_mgr

class DataBus():
    def __init__(self):
        user = str(uuid4())
        avatar = f'https://robohash.org/{user}?bgset=bg2'
        with ui.row().classes('w-full items-center'):
            # with ui.avatar():
            #     ui.image(avatar)
            self.input = ui.input(label="Send command", placeholder='start typing') \
                .props('rounded outlined').classes('flex-grow') \
                .on('keydown.enter', self.send)
        with ui.row(wrap=False).classes('w-full items-center'):
            with ui.avatar():
                ui.image(avatar)
            self.last_result = ui.markdown("") # .style('white-space: pre-wrap')
        self.data = ui.label("").classes("w-full font-mono").style("white-space: pre-wrap")
        self.last_command = 0

    def send(self):
        commands.add(self.input.value)
        self.input.value = ""

    @ui.refreshable
    async def update(self):
        if self.last_command < len(command_mgr.results):
            result = command_mgr.results[-1]
            msg = "__[%.1f]__\n" % (result[0]/1000)
            msg += "```%s```\n" % result[1]
            self.last_result.content = msg
            self.last_command = len(command_mgr.results)
        json = PropertyNode("/").get_json_string()
        self.data.text = json