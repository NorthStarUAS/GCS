from nicegui import ui

from PropertyTree import PropertyNode

class DataBus():
    def __init__(self):
        self.data = ui.label("").classes("font-mono").style("white-space: pre-wrap")
        # user = str(uuid4())
        # avatar = f'https://robohash.org/{user}?bgset=bg2'
        # with ui.footer().classes('bg-white'):
        #     with ui.row().classes('w-full items-center'):
        #         with ui.avatar():
        #             ui.image(avatar)
        #         text = ui.input(placeholder='message') \
        #             .props('rounded outlined').classes('flex-grow') \
        #             .on('keydown.enter', send)

    @ui.refreshable
    async def update(self):
        json = PropertyNode("/").get_json_string()
        self.data.text = json