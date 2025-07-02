from nicegui import ui

from PropertyTree import PropertyNode

class DataBus():
    def __init__(self):
        self.data = ui.label("").classes("font-mono").style("white-space: pre-wrap")

    @ui.refreshable
    async def update(self):
        json = PropertyNode("/").get_json_string()
        self.data.text = json