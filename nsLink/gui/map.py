from nicegui import ui

class Map():
    def __init__(self):
        # ui.label("I'm the map!")

        # ui.context.client.content.classes('h-screen')
        # ui.context.client.content.classes('h-[100vh]')
        # ui.add_head_html('<style>.q-leaflet.flex-grow .q-field__control { height: 100% }</style>')

        # self.map = ui.leaflet(center=(51.505, -0.09)).style("width:100%; height:800px;")
        self.map = ui.leaflet(center=(51.505, -0.09)).classes("w-full h-[calc(100vh-10rem)]")
        # self.map = ui.leaflet(center=(51.505, -0.09)).classes("w-full h-full")
        # self.map = ui.leaflet(center=(51.505, -0.09)).classes("w-full flex-grow")

        # https://github.com/zauberzeug/nicegui/discussions/4049
        # self.map = ui.leaflet(center=(51.505, -0.09))
        # ui.context.client.page_container.default_slot.children[0].props(
        #     ''':style-fn="(offset, height) => ( { height: offset ? `calc(100vh - ${offset}px)` : '100vh' })"'''
        # )
        # ui.context.client.content.classes("h-full")

        self.ownship = self.map.marker(latlng=self.map.center)
        self.icon = 'L.icon({iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png"})'

        self.post_init_done = False

    @ui.refreshable
    async def update(self):
        if True or not self.post_init_done:
            self.post_init_done = True
            # self.ownship.run_method(':setIcon', self.icon)