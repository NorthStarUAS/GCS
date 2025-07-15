from nicegui import events, ui
import time

from commands import commands
from nodes import mission_node, nav_node, circle_node

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

        # self.map.marker(latlng=self.map.center, options={'rotationAngle': -30})

        self.map.on('map-click', self.handle_click)

        self.ownship = self.map.marker(latlng=self.map.center, options={'rotationAngle': -30, 'rotationOrigin': 'center'})
        # self.icon = 'L.icon({iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png"})'
        self.icon = 'L.icon({iconUrl: "/icons/fg_generic_craft.png", iconSize: [40, 40], iconAnchor: [20, 20]})'
        self.setup_finished = False
        self.track_timer = 0
        self.pan_timer = 0

        self.track = None

        # Circle dialog box defaults
        self.circle_radius_m = 125
        self.radius_min = 50
        self.radius_max = 500
        self.circle_dir = 1
        self.circle_center = self.map.generic_layer(name="circleMarker", args=[self.map.center, {"color": "blue", "opacity": 0.5}])
        self.circle_perimeter = self.map.generic_layer(name="circle", args=[self.map.center, {"color": "blue", "opacity": 0.5, "fill": False}])

    async def handle_click(self, e: events.GenericEventArguments):
        lat = e.args['latlng']['lat']
        lng = e.args['latlng']['lng']

        with ui.dialog() as circle_dialog:
            with ui.card():
                ui.label("Circle at Click Location:")
                self.enter_radius = ui.input(label='Circle Radius (m) (%d-%d)' % (self.radius_min, self.radius_max), value=self.circle_radius_m)
                self.enter_dir = ui.radio({1: "Left", 2: "Right"}, value=self.circle_dir).props("inline")
                with ui.row():
                    ui.button('Submit', on_click=lambda: circle_dialog.submit('Submit'))
                    ui.button('Cancel', on_click=lambda: circle_dialog.submit('Cancel'))
        result = await circle_dialog
        if result == "Submit":
            if float(self.enter_radius.value) >= self.radius_min and float(self.enter_radius.value) <= self.radius_max:
                print("circle:", self.enter_radius.value, self.enter_dir.value)
                self.circle_radius_m = float(self.enter_radius.value)
                self.circle_dir = self.enter_dir.value
                if self.enter_dir.value == 1:
                    dir = "left"
                else:
                    dir = "right"
                commands.add("set /mission/circle/direction " + dir)
                commands.add("set /mission/circle/radius_m %.0f" % float(self.enter_radius.value))
                commands.add('task circle %.8f %.8f' % (lng, lat))
            else:
                ui.notify("Circle radius out of range")
            # self.map.marker(latlng=(lat, lng))
            # self.circle_marker = self.map.generic_layer(name="circleMarker", args=[self.map.center, {"color": "blue"}])
            # self.map.generic_layer(name="circle", args=[self.map.center, {"color": "blue", "radius": 20}])

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
        if current_time - self.pan_timer >= 1:
            self.map.run_map_method("panInside", (nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")))
            # self.map.set_center((nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")))
            self.pan_timer = current_time

        if current_time - self.track_timer >= 0.5:
            self.track_timer = current_time
            if self.track is None:
                self.track = self.map.generic_layer(name="polyline", args=[ [[nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")]], {'color': 'red', 'opacity': 0.5}])
            else:
                self.track.run_method("addLatLng", (nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg"))),

        if mission_node.getString("task") == "circle":
            # print("circle marker:", circle_node.getDouble("latitude_deg"), circle_node.getDouble("longitude_deg"))
            self.circle_center.run_method("setLatLng", (circle_node.getDouble("latitude_deg"), circle_node.getDouble("longitude_deg")))
            self.circle_perimeter.run_method("setLatLng", (circle_node.getDouble("latitude_deg"), circle_node.getDouble("longitude_deg")))
            self.circle_perimeter.run_method("setRadius", circle_node.getDouble("radius_m"))
            # self.map.generic_layer(name="circleMarker", args=[self.map.center, {"color": "blue", "radius": 20}])
