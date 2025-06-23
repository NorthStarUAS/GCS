from math import ceil, cos, sin
from nicegui import ui
from scipy.interpolate import interp1d

from nstSimulator.utils.constants import d2r, kt2mps, m2ft, mps2kt

from nodes import airdata_node, environment_node, nav_node, refs_node, specs_node, tecs_config_node

class NiceGauge():
    def __init__(self):
        self.width = 512
        self.height = 512
        self.cx = self.width / 2
        self.cy = self.height / 2
        self.radius = self.width * 0.5
        self.bg_color = "#202020"

    def arc(self, cx, cy, radius, start_deg, end_deg, color, fill, stroke_width, fill_opacity):
        # print("cx:", cx, "start_deg:", start_deg, "end_deg:", end_deg)
        x1 = cx + cos(start_deg*d2r)*radius
        x2 = cx + cos(end_deg*d2r)*radius
        y1 = cy - sin(start_deg*d2r)*radius
        y2 = cy - sin(end_deg*d2r)*radius
        svg = '<path d="M %.0f %.0f A %.0f %.0f 0 %d 1 %.0f %.0f" ' % (x1, y1, radius, radius, end_deg-start_deg>180, x2, y2)
        svg += 'stroke="%s" ' % color
        if len(fill):
            svg += 'fill="%s" ' % fill
        svg += 'stroke-width="%.0f" ' % stroke_width
        svg += 'fill-opacity="%0.1f" ' % fill_opacity
        svg += '/>'
        # print("arc:", svg)
        return svg

    def tic(self, cx, cy, inner_radius, outer_radius, angle_deg, color, fill, stroke_width, fill_opacity):
        # print("cx:", cx, "angle_deg:", angle_deg)
        x1 = cx + cos(angle_deg*d2r)*inner_radius
        x2 = cx + cos(angle_deg*d2r)*outer_radius
        y1 = cy - sin(angle_deg*d2r)*inner_radius
        y2 = cy - sin(angle_deg*d2r)*outer_radius
        svg = '<path d="M %.0f %.0f L %.0f %.0f" ' % (x1, y1, x2, y2)
        svg += 'stroke="%s" ' % color
        if len(fill):
            svg += 'fill="%s" ' % fill
        svg += 'stroke-width="%.0f" ' % stroke_width
        svg += 'fill-opacity="%0.1f" ' % fill_opacity
        svg += '/>'
        # print("tic:", svg)
        return svg

    def label(self, cx, cy, radius, angle_deg, text, color, font_size):
        # print("cx:", cx, "angle_deg:", angle_deg)
        x1 = cx + cos(angle_deg*d2r)*radius
        y1 = cy - sin(angle_deg*d2r)*radius
        svg = '<text x="%.0f" y="%.0f" text-anchor="middle" dominant-baseline="middle" fill="%s" font-size="%.0f">%s</text>' % (x1, y1, color, font_size, text)
        # print("tic:", svg)
        return svg

    def image(self, cx, cy, w, h, path, radius, angle_deg):
        # svg = '<image href="%s" transform="translate(%.0f %.0f) rotate(%.1f, %.0f, %.0f)" />' % (path, cx, cy, angle_deg, cx, cy)
        svg = '<image href="%s" transform="rotate(%.1f %.0f %.0f) translate(%.0f %.0f)" />' % (path, angle_deg, cx, cy, cx-w*0.5, cy-h*0.5-radius)
        return svg

    def needle(self, cx, cy, pointer_radius, tail_radius, angle_deg, style, color, stroke_width):
        svg = '<g transform="rotate(%.1f %.0f %.0f)"> ' % (angle_deg, cx, cy)
        if style == "pointer":
            arrow_head = pointer_radius * 0.05
            svg += '<path d="M %.0f %.0f L %.0f %.0f L %.0f %.0f L %.0f %.0f" ' % (cx, cy-tail_radius, cx-arrow_head, cy-tail_radius-1.5*arrow_head,
                                                                                   cx, cy-pointer_radius, cx+arrow_head, cy-tail_radius-1.5*arrow_head)
            svg += 'fill="%s" ' % color
        elif style == "arrow":
            arrow_head = pointer_radius * 0.08
            svg += '<path d="M %.0f %.0f L %.0f %.0f M %.0f %.0f L %.0f %.0f L %.0f %.0f" ' % (cx, cy-tail_radius, cx, cy-pointer_radius,
                                                                                            cx-arrow_head, cy-(pointer_radius-2*arrow_head),
                                                                                            cx, cy-pointer_radius,
                                                                                            cx+arrow_head, cy-(pointer_radius-2*arrow_head))
            svg += 'fill-opacity="0" '
        svg += 'stroke="%s" ' % color
        svg += 'stroke-width="%.0f" ' % stroke_width
        svg += ' /> </g>'
        return svg

class Airspeed(NiceGauge):
    def __init__(self):
        super().__init__()

        bg_radius = self.width*0.5 * 0.95
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="%s" />' % (self.cx, self.cy, bg_radius, self.bg_color)
        self.base.content = self.background
        print("ati init svg:", self.base.content)

    def update(self):
        display_units = specs_node.getString("display_units")
        speed_scale = 1.0
        if display_units == "mps":
            speed_scale = kt2mps
        elif display_units == "kts":
            speed_scale = 1.0
        else:
            # default to mps if not specified
            speed_scale = kt2mps
            display_units = "mps"

        min_kt = tecs_config_node.getDouble("min_kt")
        max_kt = tecs_config_node.getDouble("max_kt")
        if max_kt < 0.1: return
        cruise_kt = tecs_config_node.getDouble("cruise_kt")
        range_kt = max_kt - min_kt
        caution_kt = min_kt + 0.8 * range_kt
        vne_kt = max_kt + 0.2 * range_kt

        upper_kt = ceil( vne_kt / 10 ) * 10 + 10
        asi_interpx = [ 0, upper_kt, 2*upper_kt ]
        asi_interpy = [ 0, 340, 360 ]
        asi_func = interp1d(asi_interpx, asi_interpy)

        # print("min_kt:", min_kt, "caution_kt", caution_kt, "max_kt", max_kt, "vne_kt:", vne_kt)
        min_deg = 90 - asi_func(min_kt*speed_scale)
        max_deg = 90 - asi_func(max_kt*speed_scale)
        cruise_deg = 90 - asi_func(cruise_kt*speed_scale)
        caution_deg = 90 - asi_func(caution_kt*speed_scale)
        vne_deg = 90 - asi_func(vne_kt*speed_scale)
        upper_deg = 90 - asi_func(upper_kt*speed_scale)

        arc_radius = self.width*0.5 * 0.84
        arc_width = self.width * 0.04

        # arcs
        self.green_arc = self.arc(self.cx, self.cy, arc_radius - arc_width*0.5, min_deg, caution_deg, "green", "", arc_width, 0)
        self.yellow_arc = self.arc(self.cx, self.cy, arc_radius - arc_width*0.5, caution_deg, max_deg, "yellow", "", arc_width, 0)
        self.red_arc = self.arc(self.cx, self.cy, arc_radius - arc_width*0.5, max_deg, vne_deg, "red", "", arc_width, 0)

        # tics
        px = round(self.width * 0.07)
        dstic = 0
        if upper_kt <= 60:
            dtic = 5
            dstic = 1
        elif max_kt <= 100:
            dtic = 10
            dstic = 5
        else:
            dtic = 20
            dstic = 10
        tic_svg = ""
        inner_radius = arc_radius - 1.5*arc_width
        tic_width = self.width * 0.01
        label_radius = self.width*0.5 * 0.6
        for tic_kt in range(dtic, int(upper_kt+1), dtic):
            tic_deg = 90 - asi_func(tic_kt*speed_scale)
            tic_svg += self.tic(self.cx, self.cy, inner_radius, arc_radius, tic_deg, "white", "", tic_width, 0)
            tic_svg += self.label(self.cx, self.cy, label_radius, tic_deg, str(tic_kt), "white", px)
        if dstic > 0:
            inner_radius = arc_radius - arc_width
            for tic_kt in range(dstic, int(upper_kt+1), dstic):
                tic_deg = 90 - asi_func(tic_kt*speed_scale)
                tic_svg += self.tic(self.cx, self.cy, inner_radius, arc_radius, tic_deg, "white", "", tic_width*0.8, 0)

        if specs_node.getString("vehicle_class") == "surface":
            speed = nav_node.getDouble("groundspeed_kt")
        else:
            speed = airdata_node.getDouble("airspeed_filt_mps") * mps2kt
        # speed_text = self.label(self.cx, self.cy, self.width*0.08, 90, "%.0f %s" % (speed, display_units.upper()), "white", px)
        speed_text = self.label(self.cx, self.cy, self.width*0.08, 90, "%s" % (display_units.upper()), "white", px)

        ground_kt = nav_node.getDouble("groundspeed_kt")
        ground_text = self.label(self.cx, self.cy, self.width*0.16, -90, "GS: %.0f" % ground_kt, "orange", round(self.width*0.06))

        bug_kt = refs_node.getDouble("airspeed_kt")
        bug_deg = asi_func(bug_kt*speed_scale)
        bug = self.image(self.cx, self.cy, 48, 48, "resources/panel/textures/hdg2.png", arc_radius, bug_deg)

        ground_deg = asi_func(ground_kt)
        ground_needle = self.needle(self.cx, self.cy, arc_radius-1.2*arc_width, arc_radius*0.2, ground_deg, "arrow", "orange", 5)

        speed_deg = asi_func(speed*speed_scale)
        speed_needle = self.needle(self.cx, self.cy, arc_radius-1*arc_width, arc_radius*0.05, speed_deg, "pointer", "white", 2)

        # assemble the components
        self.base.content = self.background
        self.base.content += self.green_arc + self.yellow_arc + self.red_arc + tic_svg
        self.base.content += speed_text + ground_text + ground_needle + bug + speed_needle

class Attitude(NiceGauge):
    def __init__(self):
        super().__init__()

        bg_radius = self.width*0.5 * 0.95
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="%s" />' % (self.cx, self.cy, bg_radius, self.bg_color)
        self.base.content = self.background
        print("ati init svg:", self.base.content)

    def update(self):
        roll_deg = nav_node.getDouble("roll_deg")
        pitch_deg = nav_node.getDouble("pitch_deg")

        backplate = self.image(self.cx, self.cy, 384, 384, "resources/panel/textures/ati1.png", 0, -roll_deg)

        p = pitch_deg
        if p < -20: p = -20
        if p > 20: p = 20
        y_offset = p * 4.5
        pitch = self.image(self.cx, self.cy+y_offset, 392, 256, "resources/panel/textures/ati2.png", 0, -roll_deg)

        roll = self.image(self.cx, self.cy, 464, 464, "resources/panel/textures/ati3.png", 0, -roll_deg)

        bird = self.image(self.cx, self.cy+77, 264, 174, "resources/panel/textures/ati4.png", 0, 0)

        bezel = self.image(self.cx, self.cy, 512, 512, "resources/panel/textures/ati5.png", 0, 0)

        self.base.content = self.background + backplate + pitch + roll + bird + bezel

class Altitude(NiceGauge):
    def __init__(self):
        super().__init__()

        bg_radius = self.width*0.5 * 0.95
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="%s" />' % (self.cx, self.cy, bg_radius, self.bg_color)
        self.base.content = self.background
        print("ati init svg:", self.base.content)

    def update(self):
        max_ft = specs_node.getDouble("max_ft")
        safe_ft = 100
        if max_ft < 200:
            max_ft = 400
        vne_ft = max_ft + 100

        upper_ft = ceil( max_ft / 100 ) * 100 + 200
        alt_interpx = [ 0, upper_ft, 2*upper_ft ]
        alt_interpy = [ 0, 340, 360 ]
        alt_func = interp1d(alt_interpx, alt_interpy, bounds_error=False, fill_value="extrapolate")

        safe_deg = 90 - alt_func(safe_ft)
        max_deg = 90 - alt_func(max_ft)
        vne_deg = 90 - alt_func(vne_ft)

        arc_radius = self.width*0.5 * 0.84
        arc_width = self.width * 0.04

        # arcs
        self.green_arc = self.arc(self.cx, self.cy, arc_radius - arc_width*0.5, safe_deg, max_deg, "green", "", arc_width, 0)
        self.yellow_arc = self.arc(self.cx, self.cy, arc_radius - arc_width*0.5, max_deg, vne_deg, "yellow", "", arc_width, 0)

        # tics
        px = round(self.width * 0.07)
        dstic = 0
        if max_ft <= 500:
            dtic = 100
            dstic = 20
        elif max_ft <= 200:
            dtic = 100
            dstic = 50
        else:
            dtic = 500
            dstic = 100
        tic_svg = ""
        inner_radius = arc_radius - 1.5*arc_width
        tic_width = self.width * 0.01
        label_radius = self.width*0.5 * 0.55
        for tic_ft in range(dtic, int(upper_ft+1), dtic):
            tic_deg = 90 - alt_func(tic_ft)
            tic_svg += self.tic(self.cx, self.cy, inner_radius, arc_radius, tic_deg, "white", "", tic_width, 0)
            tic_svg += self.label(self.cx, self.cy, label_radius, tic_deg, str(tic_ft), "white", px)
        if dstic > 0:
            inner_radius = arc_radius - arc_width
            for tic_kt in range(dstic, int(upper_ft+1), dstic):
                tic_deg = 90 - alt_func(tic_kt)
                tic_svg += self.tic(self.cx, self.cy, inner_radius, arc_radius, tic_deg, "white", "", tic_width*0.8, 0)

        bug_kt = refs_node.getDouble("altitude_agl_ft")
        bug_deg = alt_func(bug_kt)
        bug = self.image(self.cx, self.cy, 48, 48, "resources/panel/textures/hdg2.png", arc_radius, bug_deg)

        alt_ft = environment_node.getDouble("altitude_agl_m") * m2ft
        # display_ft = round(alt_ft/10)*10
        alt_text = self.label(self.cx, self.cy, self.width*0.08, 90, "AGL (ft)", "white", px)

        alt_deg = alt_func(alt_ft)
        alt_needle = self.needle(self.cx, self.cy, arc_radius-1*arc_width, arc_radius*0.05, alt_deg, "pointer", "white", 2)

        # assemble the components
        self.base.content = self.background
        self.base.content += self.green_arc + self.yellow_arc + tic_svg
        self.base.content += bug + alt_text + alt_needle

class Heading(NiceGauge):
    def __init__(self):
        super().__init__()

        bg_radius = self.width*0.5 * 0.95
        self.groundtrack_deg = 0
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="%s" />' % (self.cx, self.cy, bg_radius, self.bg_color)
        self.base.content = self.background
        print("ati init svg:", self.base.content)

    def update(self):
        heading_deg = nav_node.getDouble("yaw_deg")
        groundspeed_kt = nav_node.getDouble("groundspeed_kt")
        if groundspeed_kt > 0.5:
            self.groundtrack_deg = nav_node.getDouble("groundtrack_deg")
        wind_deg = environment_node.getDouble("wind_deg")
        wind_kt = environment_node.getDouble("wind_mps")*mps2kt

        rose = self.image(self.cx, self.cy, 512, 512, "resources/panel/textures/hdg1.png", 0, -heading_deg)

        display_units = specs_node.getString("display_units")
        speed_scale = 1.0
        if display_units == "mps":
            speed_scale = kt2mps
        elif display_units == "kts":
            speed_scale = 1.0
        else:
            # default to mps if not specified
            speed_scale = kt2mps
            display_units = "mps"

        arc_radius = self.width*0.5 * 0.84
        arc_width = self.width * 0.04
        wind_vane = self.needle(self.cx, self.cy, arc_radius-1.2*arc_width, -arc_radius*0.6, wind_deg + 180 - heading_deg, "arrow", "lightblue", 5)
        wind_text = self.label(self.cx+self.width*0.14, self.cy-self.width*0.06, 0, 0, "WND:%.0f" % (wind_kt*speed_scale), "lightblue", self.width*0.06)

        course = self.needle(self.cx, self.cy, arc_radius-1.2*arc_width, -arc_radius*0.6, self.groundtrack_deg - heading_deg, "arrow", "orange", 5)
        ground_text = self.label(self.cx-self.width*0.14, self.cy-self.width*0.06, 0, 0, "CRS", "orange", self.width*0.06)

        bug_deg = refs_node.getDouble("groundtrack_deg")
        bug = self.image(self.cx, self.cy, 48, 48, "resources/panel/textures/hdg2.png", arc_radius-arc_width, bug_deg - heading_deg)

        # // face plate
        # context.drawImage(img_hdg3, x, y, width=size, height=size);
        faceplate = self.image(self.cx, self.cy, 512, 512, "resources/panel/textures/hdg3.png", 0, 0)

        self.base.content = self.background + rose + wind_vane + wind_text + course + ground_text + bug + faceplate
