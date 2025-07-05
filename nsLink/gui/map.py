from nicegui import ui
import time

from nodes import nav_node

class Map():
    def __init__(self):
        # ui.label("I'm the map!")

        # ui.context.client.content.classes('h-screen')
        # ui.context.client.content.classes('h-[100vh]')
        # ui.add_head_html('<style>.q-leaflet.flex-grow .q-field__control { height: 100% }</style>')

        # self.map = ui.leaflet(center=(51.505, -0.09)).style("width:100%; height:800px;")
        self.map = ui.leaflet(center=(51.505, -0.09),
                              additional_resources=['https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js']
                              ).classes("w-full h-[calc(100vh-10rem)]")
        # self.map = ui.leaflet(center=(51.505, -0.09)).classes("w-full h-full")
        # self.map = ui.leaflet(center=(51.505, -0.09)).classes("w-full flex-grow")

        # https://github.com/zauberzeug/nicegui/discussions/4049
        # self.map = ui.leaflet(center=(51.505, -0.09))
        # ui.context.client.page_container.default_slot.children[0].props(
        #     ''':style-fn="(offset, height) => ( { height: offset ? `calc(100vh - ${offset}px)` : '100vh' })"'''
        # )
        # ui.context.client.content.classes("h-full")

        self.map.marker(latlng=self.map.center, options={'rotationAngle': -30})
        self.ownship = self.map.marker(latlng=self.map.center, options={'rotationAngle': -30, 'rotationOrigin': 'center'})
        # self.icon = 'L.icon({iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png"})'
        self.icon = 'L.icon({iconUrl: "/icons/fg_generic_craft.png", iconSize: [40, 40], iconAnchor: [20, 20]})'
        self.setup_finished = False
        self.centering_timer = 0

        self.track = self.map.generic_layer(name="polyline", args=[ [[45.51, -122.68],[37.77, -122.43],[34.04, -118.2]], {'color': 'red'}])

    @ui.refreshable
    async def update(self):
        if not self.setup_finished:
            await self.map.initialized()
            print("map initialized")
            self.ownship.run_method(':setIcon', self.icon)
            self.setup_finished = True
            # self.map.client.run_javascript("console.log(window);")
            # self.map.client.run_javascript("Object.getOwnPropertyNames(window).forEach(function(currentValue){console.log(currentValue)});")
            # self.map.client.run_javascript('alert("map inited")')
        self.ownship.move(nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg"))
        self.ownship.run_method('setRotationAngle', nav_node.getDouble("yaw_deg"))

        current_time = time.time()
        if current_time - self.centering_timer >= 10:
            self.map.set_center((nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")))
            self.centering_timer = current_time

            import random
            self.track.run_method("addLatLng", (nav_node.getDouble("latitude_deg") + random.random(), nav_node.getDouble("longitude_deg")+random.random()))
        # result = await self.map.run_map_method('getBounds')
        # print("bounds:", result)

        # autopan experiment (send javascript code to run client-side because
        # there is potential for multiple clients with different bounds)
        # js = "var newLatLng = new L.LatLng(%.8f,%.8f); " % (nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg"))
        # var visible = mymap.getBounds().contains(ownship.getLatLng());
        # js += "var visible = this.map.getBounds().contains(newLatLng); "
        # js += "console.log(this); "
        # self.map.client.run_javascript(js)