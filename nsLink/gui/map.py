import geopy.distance
from nicegui import events, ui
import time

from nstSimulator.utils.constants import m2ft, mps2kt

from commands import commands
from nodes import active_node, airdata_node, circle_node, environment_node, home_node, ident_node, mission_node, nav_node, route_node

# var marker = new L.marker([39.5, -77.3], { opacity: 0.01 }); //opacity may be set to zero
# marker.bindTooltip("My Label", {permanent: true, className: "my-label", offset: [0, 0] });

class Map():
    def __init__(self):
        # ui.label("I'm the map!")

        # ui.context.client.content.classes('h-screen')
        # ui.context.client.content.classes('h-[100vh]')
        # ui.add_head_html('<style>.q-leaflet.flex-grow .q-field__control { height: 100% }</style>')
        # self.map = ui.leaflet(center=(51.505, -0.09)).style("width:100%; height:800px;")

        draw_control = {
            'draw': {
                'polygon': False,
                'marker': False,
                'circle': False,
                'rectangle': False,
                'polyline': True,
                'circlemarker': False,
            },
            'edit': {
                'edit': False,
                'remove': False,
            },
        }

        self.map = ui.leaflet(center=(51.505, -0.09),
                              additional_resources=['https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js'],
                              draw_control=draw_control, hide_drawn_items=True
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

        self.map.on('draw:created', self.handle_draw)
        # self.map.on('map-click', self.handle_click)
        self.map.on('map-contextmenu', self.handle_click)  # leaflet click types pre-pended with "map-"

        self.ownship = self.map.marker(latlng=self.map.center, options={'rotationAngle': -30, 'rotationOrigin': 'center'})
        # self.icon = 'L.icon({iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png"})'
        self.icon = 'L.icon({iconUrl: "/icons/fg_generic_craft.png", iconSize: [40, 40], iconAnchor: [20, 20]})'
        self.setup_finished = False
        self.track_timer = 0
        self.track_trim_timer = 0
        self.pan_timer = 0

        self.track = None
        self.track_history = []
        self.track_save_min = 15

        self.home_waypoint = self.map.generic_layer(name="circleMarker", args=[self.map.center, {"color": "black", "opacity": 0.5}])

        # Circle dialog box defaults (fixme: poll uas and then use /config/mission/* values here)
        self.circle_radius_m = 125
        self.radius_min = 50
        self.radius_max = 500
        self.circle_dir = 1

        # route/circle stuff
        self.active_route = []
        self.active_waypoint = self.map.generic_layer(name="circleMarker", args=[self.map.center, {"color": "blue", "opacity": 0.5}])
        self.circle_perimeter = self.map.generic_layer(name="circle", args=[self.map.center, {"color": "blue", "opacity": 0.5, "fill": False}])
        self.route = self.map.generic_layer(name="polyline", args=[ [[nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")]], {'color': 'blue', 'opacity': 0.5}])

    def update_track_history(self):
        min_delta = 0.2  # 5 hz
        nav_time_sec = nav_node.getUInt("millis") / 1000.0
        if nav_time_sec > 0 and nav_time_sec >= self.track_timer + min_delta:
            if self.track_timer == 0.0:
                self.track_timer = nav_time_sec  # init: jump to current time
            self.track_timer += min_delta
            self.track_history.append([nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg"), nav_time_sec])

            if self.track is None:
                self.track = self.map.generic_layer(name="polyline", args=[ [[nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")]], {'color': 'red', 'opacity': 0.5}])
            else:
                self.track.run_method("addLatLng", (nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg"))),

        # trim history every trim_delta seconds
        trim_delta = 10
        if nav_time_sec > self.track_trim_timer + trim_delta:
            if self.track_trim_timer == 0.0:
                self.track_trim_timer = nav_time_sec
            self.track_trim_timer += trim_delta
            do_trim = -1
            cutoff_sec = nav_time_sec - self.track_save_min*60
            for i in range(len(self.track_history)):
                if self.track_history[i][2] >= cutoff_sec:
                    do_trim = i
                    break
            if do_trim >= 0:
                self.track_history = self.track_history[do_trim:]
                self.track.run_method("setLatLngs", self.track_history),

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

    async def handle_draw(self, e: events.GenericEventArguments):
        with ui.dialog() as route_dialog:
            with ui.card():
                ui.markdown("Send this new route to the aicraft (%d waypoints):" % len(e.args['layer']['_latlngs']))
                with ui.row():
                    ui.button('Submit', on_click=lambda: route_dialog.submit('Submit'))
                    ui.button('Cancel', on_click=lambda: route_dialog.submit('Cancel'))
        result = await route_dialog
        if result == "Submit":
            print(e.args['layer']['_latlngs'])
            route_string = "route start"
            for wpt in e.args['layer']['_latlngs']:
                route_string += ' %.0f %.0f' % (wpt["lng"]*10000000, wpt["lat"]*10000000)
                if len(route_string) > 180:
                    commands.add(route_string)
                    route_string = "route cont"
            if len(route_string) > 10:
                # remaining wpts to send
                commands.add(route_string)
            if len(e.args['layer']['_latlngs']):
                # route had length
                commands.add("route end")
                commands.add("task route")

    @ui.refreshable
    async def update(self):
        if not self.setup_finished:
            await self.map.initialized()
            # we can stack up a bunch of "await map initialized()"" here, so if
            # we get to this point and the map has already been initialized,
            # let's just return and let future calls do updates
            if self.setup_finished:
                return
            print("map initialized")
            self.ownship.run_method(':setIcon', self.icon)
            self.ownship.run_method("bindTooltip", "<div>callsign</div>", {"permanent": True, "direction": "bottom", "offset": (0, 30)})
            self.map.run_map_method("panTo", (nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")))
            self.active_waypoint.run_method("bindTooltip", "<div>waypoint</div>", {"permanent": True, "direction": "bottom", "offset": (0, 20)})
            self.setup_finished = True
        self.ownship.move(nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg"))
        self.ownship.run_method('setRotationAngle', nav_node.getDouble("yaw_deg"))

        current_time = time.time()
        if current_time - self.pan_timer >= 1:
            self.map.run_map_method("panInside", (nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")), {"padding": [20,20]})
            # self.map.set_center((nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")))
            self.pan_timer = current_time

        display_alt = round(environment_node.getDouble("altitude_agl_m")*m2ft/5)*5
        self.ownship.run_method("setTooltipContent", '<font color="red"<div>%s</div><div>%.0f (kts)</div><div>%.0f (ft agl)</div></font>' % (ident_node.getString("call_sign"), airdata_node.getDouble("airspeed_filt_mps")*mps2kt, display_alt))

        self.update_track_history()
        # if current_time - self.track_timer >= 0.2:
        #     self.track_timer = current_time
        #     if self.track is None:
        #         # self.track = self.map.generic_layer(name="polyline", args=[ [[nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg")]], {'color': 'red', 'opacity': 0.5}])
        #         self.track = self.map.generic_layer(name="polyline", args=[ self.track_history, {'color': 'red', 'opacity': 0.5}])
        #     else:
        #         self.track.run_method("addLatLng", (nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg"))),

        self.home_waypoint.run_method("setLatLng", (home_node.getDouble("latitude_deg"), home_node.getDouble("longitude_deg")))

        if mission_node.getString("task") == "circle" or mission_node.getString("task") == "land":
            # print("circle marker:", circle_node.getDouble("latitude_deg"), circle_node.getDouble("longitude_deg"))
            self.active_waypoint.run_method("setLatLng", (circle_node.getDouble("latitude_deg"), circle_node.getDouble("longitude_deg")))
            self.active_waypoint.run_method("setTooltipContent", '<font color="blue"<div>Radius: %.0f m</div></font>' % (circle_node.getDouble("radius_m")))
        elif mission_node.getString("task") == "route":
            i = route_node.getInt("target_wpt_idx")
            if i < active_node.getLen("wpt"):
                node = active_node.getChild("wpt/%d" % i)
                self.active_waypoint.run_method("setLatLng", (node.getDouble("latitude_deg"), node.getDouble("longitude_deg")))
                waypoint_pos = (node.getDouble("latitude_deg"), node.getDouble("longitude_deg"))
                ownship_pos = (nav_node.getDouble("latitude_deg"), nav_node.getDouble("longitude_deg"))
                dist = geopy.distance.distance(ownship_pos, waypoint_pos).m
                rate = nav_node.getDouble("groundspeed_mps")
                if rate > 0.1:
                    secs = dist / rate
                    self.active_waypoint.run_method("setTooltipContent", '<font color="blue"<div>ETA: %.0f sec</div></font>' % (secs))


        self.circle_perimeter.run_method("setLatLng", (circle_node.getDouble("latitude_deg"), circle_node.getDouble("longitude_deg")))
        self.circle_perimeter.run_method("setRadius", circle_node.getDouble("radius_m"))

        new_route = []
        route_size = route_node.getInt("route_size")
        for i in range(route_size):
            node = active_node.getChild("wpt/%d" % i)
            new_route.append( [node.getDouble("latitude_deg"), node.getDouble("longitude_deg")] )
        if new_route != self.active_route:
            print("new_route:", new_route)
            self.active_route = new_route
            self.route.run_method("setLatLngs", self.active_route)
