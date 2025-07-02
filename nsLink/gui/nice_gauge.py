from math import ceil, cos, isnan, sin, sqrt
from nicegui import ui
from scipy.interpolate import interp1d
import time

from nstSimulator.utils.constants import d2r, kt2mps, m2ft, mps2kt, r2d

from nodes import airdata_node, effectors_node, environment_node, gps_node, imu_node, nav_node, power_node, refs_node, specs_node, status_node, tecs_config_node

class NiceGauge():
    def __init__(self):
        self.width = 512
        self.height = 512
        self.cx = self.width / 2
        self.cy = self.height / 2
        self.radius = self.width * 0.5
        self.bg_color = "#202020"
        # self.bg_color = "#D0D0D0"

    def circle(self, x, y, radius, color):
        return '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="%s" />' % (x, y, radius, color)

    def rectangle(self, x, y, width, height, corner_radius, color):
        return '<rect x="%.0f" y="%.0f" width="%.0f" height="%.0f" rx="%.0f" fill="%s" />' % (x, y, width, height, corner_radius, color)


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

    def line(self, points, color, fill, stroke_width, fill_opacity):
        svg = ''
        p = points[0]
        svg += '<path d="M %.0f %.0f' % (p[0], p[1])
        for p in points[1:]:
            svg += ' L %.0f %.0f' % (p[0], p[1])
        svg += '"'
        svg += ' stroke="%s"' % color
        if len(fill):
            svg += ' fill="%s"' % fill
        svg += ' stroke-width="%.0f"' % stroke_width
        if fill_opacity > 0.01 and fill_opacity < 0.99:
            svg += ' fill-opacity="%0.1f"' % fill_opacity
        svg += ' />'
        # print("line:", svg)
        return svg

    def tic(self, cx, cy, inner_radius, outer_radius, angle_deg, color, fill, stroke_width, fill_opacity):
        # print("cx:", cx, "angle_deg:", angle_deg)
        x1 = cx + cos(angle_deg*d2r)*inner_radius
        x2 = cx + cos(angle_deg*d2r)*outer_radius
        y1 = cy - sin(angle_deg*d2r)*inner_radius
        y2 = cy - sin(angle_deg*d2r)*outer_radius
        svg = self.line( [[x1, y1], [x2, y2]], color, fill, stroke_width, fill_opacity)
        return svg

    def label(self, cx, cy, radius, angle_deg, text, color, font_size, align="middle"):
        # print("cx:", cx, "angle_deg:", angle_deg)
        x1 = cx + cos(angle_deg*d2r)*radius
        y1 = cy - sin(angle_deg*d2r)*radius
        svg = '<text x="%.0f" y="%.0f" text-anchor="%s" dominant-baseline="middle" fill="%s" font-size="%.0f">%s</text>' % (x1, y1, align, color, font_size, text)
        # print("tic:", svg)
        return svg

    def image(self, cx, cy, w, h, path, radius, angle_deg):
        # svg = '<image href="%s" transform="translate(%.0f %.0f) rotate(%.1f, %.0f, %.0f)" />' % (path, cx, cy, angle_deg, cx, cy)
        svg = '<image href="%s" transform="rotate(%.1f %.0f %.0f) translate(%.1f %.1f)" />' % (path, angle_deg, cx, cy, cx-w*0.5, cy-h*0.5-radius)
        return svg

    def needle(self, cx, cy, pointer_radius, tail_radius, angle_deg, style, color, stroke_width):
        svg = ''
        svg += '<g transform="rotate(%.1f %.0f %.0f)"> ' % (angle_deg, cx, cy)
        if style == "pointer":
            arrow_head = pointer_radius * 0.05
            svg += '<path d="M %.0f %.0f L %.0f %.0f L %.0f %.0f L %.0f %.0f L %.0f %.0f" ' % (cx, cy-tail_radius, cx-arrow_head, cy-tail_radius-1.5*arrow_head,
                                                                                               cx, cy-pointer_radius, cx+arrow_head, cy-tail_radius-1.5*arrow_head,
                                                                                               cx, cy-tail_radius)
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

    def add_shadow(self, inner_svg):
        svg = '<defs><filter id="f1"><feDropShadow dx="4" dy="6" stdDeviation="3" flood-opacity="0.9"/></filter></defs>'
        svg += '<g filter="url(#f1)">'
        svg += inner_svg
        svg += '</g>'
        return svg

class NiceBar(NiceGauge):
    def __init__(self, text1, minv, maxv, tics, reds, yellows, greens):
        self.time_factor = 60
        self.text1 = text1
        self.minv = minv
        self.maxv = maxv
        self.range = self.maxv - self.minv
        self.tics = tics
        self.reds = reds
        self.draw_yellows = False
        self.yellows = yellows
        self.greens = greens
        self.avg = None
        self.std2 = None
        self.last_time = 0
        self.pointer_color = "white"
        self.start = 0
        self.state = 0
        self.verbose = False

    def set_pointer_color(self, val):
        for green in self.greens:
            if val >= green[0] and val <= green[1]:
                self.pointer_color = "white"
                return
        for red  in self.reds:
            alert = 0
            if val >= red[0] and val <= red[1]:
                alert = 1
            elif val < self.minv or val > self.maxv:
                alert = 1
            if alert:
                if not self.state:
                    if time.time() >= self.start +  0.3:
                        self.state = 1
                        self.start = time.time()
                elif self.state:
                    if time.time() >= self.start + 1.0:
                        self.state = 0
                        self.start = time.time()
                if self.state:
                    self.pointer_color = "red"
                else:
                    self.pointer_color = "white"
                return
        self.pointer_color = "yellow"

    def update_stats(self, val):
        timestamp = imu_node.getUInt("millis") / 1000.0
        dt = timestamp - self.last_time
        self.last_time = timestamp
        if self.avg is None:
            self.avg = val
            self.std2 = 0
        elif dt > 0:
            wf = dt / self.time_factor
            if wf < 0: wf = 0
            if wf > 1: wf = 1
            self.avg = (1-wf)*self.avg + wf*val
            err = abs(val - self.avg)
            self.std2 = (1-wf)*self.std2 + wf*err*err

    def draw(self, x, y, w, h, px, val, text2):
        if val < self.minv - 0.05*self.range:
            val = self.minv - 0.05*self.range
        if val > self.maxv + 0.05*self.range:
            val = self.maxv + 0.05*self.range
        if self.verbose:
            print("bar:", val)
        self.update_stats(val)
        self.set_pointer_color(val)
        svg = ''

        # main bar
        svg += self.line( [[x, y+h*0.5], [x+w, y+h*0.5]], "white", "", h*0.4, 1)

        # regions
        if self.draw_yellows:
            for yellow in self.yellows:
                x1 = ((yellow[0] - self.minv) / self.range) * w
                x2 = ((yellow[1] - self.minv) / self.range) * w
                # print("minv:", self.minv, "range:", self.range, "w:", w, "x1:", x1, "x2:", x2)
                svg += self.line( [[x + x1, y+h*0.5], [x + x2, y+h*0.5]], "yellow", "", h, 1)
        for green in self.greens:
            x1 = ((green[0] - self.minv) / self.range) * w
            x2 = ((green[1] - self.minv) / self.range) * w
            # print("minv:", self.minv, "range:", self.range, "w:", w, "x1:", x1, "x2:", x2)
            svg += self.line( [[x + x1, y+h*0.5], [x + x2, y+h*0.5]], "green", "", h, 1)
        # for xt in range(self.minv+self.tics, self.maxv, self.tics):
        xt = self.minv + self.tics
        while xt < self.maxv:
            x1 = ((xt - self.minv) / self.range) * w
            svg += self.line( [[x + x1, y], [x + x1, y+h*0.8]], "black", "", 1, 1)
            xt += self.tics
        for red in self.reds:
            x1 = ((red[0] - self.minv) / self.range) * w
            x2 = ((red[1] - self.minv) / self.range) * w
            if x1 > 1 and x1 < w-1:
                svg += self.line( [[x + x1, y], [x + x1, y+h]], "red", "", w*0.02, 1)
            if x2 > 1 and x2 < w-1:
                svg += self.line( [[x + x2, y], [x + x2, y+h]], "red", "", w*0.02, 1)

        # trends
        std = sqrt(self.std2)
        v1 = self.avg - std
        if v1 < self.minv: v1 = self.minv
        if v1 > self.maxv: v1 = self.maxv
        v2 = self.avg + std
        if v2 < self.minv: v2 = self.minv
        if v2 > self.maxv: v2 = self.maxv
        x1 = ((v1 - self.minv) / self.range) * w
        x2 = ((v2 - self.minv) / self.range) * w
        y1 = h*0.5
        svg += self.line( [[x+x1, y+h*0.5], [x+x2, y+h*0.5]], "cyan", "", h*0.4, 1)

        x1 = ((self.avg - self.minv) / self.range) * w
        svg += self.line( [[x+x1, y], [x+x1, y+h]], "white", "", 3, 1)

        # current value pointer
        x1 = ((val - self.minv) / self.range) * w
        y1 = h*0.5
        tmp = self.line([[x+x1, y+y1], [x+x1-y1, y+y1-y1*sqrt(3)], [x+x1+y1, y+y1-y1*sqrt(3)], [x+x1, y+y1]],
                        self.pointer_color, self.pointer_color, 1, 1)
        # svg += self.add_shadow(tmp)
        svg += tmp

        svg += self.label(x, y+2*h, 0, 0, self.text1, "white", px, align="start")
        svg += self.label(x+w, y+2*h, 0, 0, text2, "white", px, align="end")

        return svg

class Airspeed(NiceGauge):
    def __init__(self):
        super().__init__()

        bg_radius = self.width*0.5 * 0.95
        self.base = ui.interactive_image(size=(self.width,self.height)).classes("w-96").props("fit=scale-down")
        self.background = self.circle(self.cx, self.cy, bg_radius, self.bg_color)
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
            tic_svg += self.tic(self.cx, self.cy, inner_radius, arc_radius, tic_deg, "white", "", tic_width, 1)
            tic_svg += self.label(self.cx, self.cy, label_radius, tic_deg, str(tic_kt), "white", px)
        if dstic > 0:
            inner_radius = arc_radius - arc_width
            for tic_kt in range(dstic, int(upper_kt+1), dstic):
                tic_deg = 90 - asi_func(tic_kt*speed_scale)
                tic_svg += self.tic(self.cx, self.cy, inner_radius, arc_radius, tic_deg, "white", "", tic_width*0.8, 1)

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
        svg = self.needle(self.cx, self.cy, arc_radius-1.2*arc_width, arc_radius*0.2, ground_deg, "arrow", "orange", 5)
        ground_needle = svg
        # ground_needle = self.add_shadow(svg)

        speed_deg = asi_func(speed*speed_scale)
        svg = self.needle(self.cx, self.cy, arc_radius-0.5*arc_width, arc_radius*0.05, speed_deg, "pointer", "white", 2)
        speed_needle = svg
        # speed_needle = self.add_shadow(svg)

        # assemble the components
        self.base.content = self.background
        self.base.content += self.green_arc + self.yellow_arc + self.red_arc + tic_svg
        self.base.content += speed_text + ground_text + ground_needle + bug + speed_needle

class Attitude(NiceGauge):
    def __init__(self):
        super().__init__()

        bg_radius = self.width*0.5 * 0.95
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = self.circle(self.cx, self.cy, bg_radius, self.bg_color)
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
        self.background = self.circle(self.cx, self.cy, bg_radius, self.bg_color)
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
            tic_svg += self.tic(self.cx, self.cy, inner_radius, arc_radius, tic_deg, "white", "", tic_width, 1)
            tic_svg += self.label(self.cx, self.cy, label_radius, tic_deg, str(tic_ft), "white", px)
        if dstic > 0:
            inner_radius = arc_radius - arc_width
            for tic_kt in range(dstic, int(upper_ft+1), dstic):
                tic_deg = 90 - alt_func(tic_kt)
                tic_svg += self.tic(self.cx, self.cy, inner_radius, arc_radius, tic_deg, "white", "", tic_width*0.8, 1)

        bug_kt = refs_node.getDouble("altitude_agl_ft")
        bug_deg = alt_func(bug_kt)
        bug = self.image(self.cx, self.cy, 48, 48, "resources/panel/textures/hdg2.png", arc_radius, bug_deg)

        alt_ft = environment_node.getDouble("altitude_agl_m") * m2ft
        # display_ft = round(alt_ft/10)*10
        alt_text = self.label(self.cx, self.cy, self.width*0.08, 90, "AGL (ft)", "white", px)

        alt_deg = alt_func(alt_ft)
        svg = self.needle(self.cx, self.cy, arc_radius-0.5*arc_width, arc_radius*0.05, alt_deg, "pointer", "white", 2)
        alt_needle = svg
        # alt_needle = self.add_shadow(svg)

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
        self.background = self.circle(self.cx, self.cy, bg_radius, self.bg_color)
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
        wind_vane = self.needle(self.cx, self.cy, arc_radius-2*arc_width, -arc_radius*0.6, wind_deg + 180 - heading_deg, "arrow", "lightblue", 5)
        wind_text = self.label(self.cx+self.width*0.14, self.cy-self.width*0.06, 0, 0, "WND:%.0f" % (wind_kt*speed_scale), "lightblue", self.width*0.06)

        course = self.needle(self.cx, self.cy, arc_radius-2*arc_width, -arc_radius*0.6, self.groundtrack_deg - heading_deg, "arrow", "orange", 5)
        ground_text = self.label(self.cx-self.width*0.14, self.cy-self.width*0.06, 0, 0, "CRS", "orange", self.width*0.06)

        bug_deg = refs_node.getDouble("groundtrack_deg")
        bug = self.image(self.cx, self.cy, 48, 48, "resources/panel/textures/hdg2.png", arc_radius-arc_width, bug_deg - heading_deg)

        # // face plate
        # context.drawImage(img_hdg3, x, y, width=size, height=size)
        faceplate = self.image(self.cx, self.cy, 512, 512, "resources/panel/textures/hdg3.png", 0, 0)

        self.base.content = self.background + rose + wind_vane + wind_text + course + ground_text + bug + faceplate

class Power(NiceGauge):
    def __init__(self):
        super().__init__()

        pad = self.width * 0.025
        bg_radius = self.width * 0.15
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = self.rectangle(pad, pad, self.width-2*pad, self.height-2*pad, bg_radius, self.bg_color)
        y1 = self.width*0.12
        px = self.width * 0.06
        self.power_label = self.label(self.cx, y1, 0, 0, "POWER", "white", px, align="middle")

        self.base.content = self.background + self.power_label

        self.batt_bar = NiceBar("Battery", 0, 100, 10, [[0,10]], [[10,25]], [[25,100]])
        self.cell_bar = NiceBar("Per Cell", 3.0, 4.2, 0.1, [[3.0,3.3]], [], [[3.5,4.2]])
        self.vcc_bar = NiceBar("Avionics", 4.5, 5.5, 0.1, [[4.5,4.8], [5.2,5.5]], [], [[4.9,5.1]])
        self.pwm_vcc_bar = NiceBar("PWM", 4.5, 6.0, 0.1, [[4.5,4.8], [5.8,6.0]], [], [[4.9,5.5]])
        self.imu_temp_bar = NiceBar("IMU Temp", 0, 60, 10, [[50,60]], [], [[0,40]])

        print("power init svg:", self.base.content)

    def update(self):
        pad = self.width * 0.025
        ipad = pad * 6
        h = self.height * 0.04
        vspace = self.height * 0.14
        px = self.width * 0.047

        battery_percent = power_node.getDouble("battery_perc")*100
        if battery_percent < 0: battery_percent = 0

        y1 = self.height * 0.17
        val_text = "%.0f%%" % battery_percent
        # print("width:", self.width, "ipad:", ipad, "val:", self.width - 2*ipad)
        svg = self.batt_bar.draw(ipad, y1, self.width - 2*ipad, h, px, battery_percent, val_text)

        y1 += vspace
        cell_volts = power_node.getDouble("cell_vcc")
        val_text = "%.2fV" % cell_volts
        svg += self.cell_bar.draw(ipad, y1, self.width - 2*ipad, h, px, cell_volts, val_text)

        y1 += vspace
        vcc = power_node.getDouble("avionics_vcc")
        val_text = "%.2fV" % vcc
        svg += self.vcc_bar.draw(ipad, y1, self.width - 2*ipad, h, px, vcc, val_text)

        y1 += vspace
        pwm_vcc = power_node.getDouble("pwm_vcc")
        val_text = "%.2fV" % pwm_vcc
        svg += self.pwm_vcc_bar.draw(ipad, y1, self.width - 2*ipad, h, px, pwm_vcc, val_text)

        y1 += vspace
        imu_temp = imu_node.getDouble("temp_C")
        val_text = "%.0fC" % imu_temp
        svg += self.imu_temp_bar.draw(ipad, y1, self.width - 2*ipad, h, px, imu_temp, val_text)

        self.base.content = self.background + self.power_label + svg

class INS_GNSS(NiceGauge):
    def __init__(self):
        super().__init__()

        pad = self.width * 0.025
        bg_radius = self.width * 0.15
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = self.rectangle(pad, pad, self.width-2*pad, self.height-2*pad, bg_radius, self.bg_color)
        y1 = self.width*0.12
        px = self.width * 0.06
        self.power_label = self.label(self.cx, y1, 0, 0, "INS/GNSS", "white", px, align="middle")

        self.base.content = self.background + self.power_label

        self.sats_bar = NiceBar("GPS Sats", 0, 25, 5, [[0,5]], [], [[7,25]]);
        self.hdop_bar = NiceBar("GPS hdop", 0, 10, 2, [[5,10]], [], [[0,3.5]]);
        self.pos_bar = NiceBar("Pos Acc", 0, 10, 2, [[6,10]], [], [[0,4]]);
        self.vel_bar = NiceBar("Vel Acc", 0, 1, 0.2, [[0.4,1]], [], [[0,0.2]]);
        self.att_bar = NiceBar("Att Acc", 0, 2.5, 0.5, [[1,2.5]], [], [[0,0.5]]);
        self.accel_bar = NiceBar("Accel Bias", 0, 2, 0.4, [[1,2]], [], [[0,0.5]]);
        self.gyro_bar = NiceBar("Gyro Bias", 0, 2, 0.4, [[1,2]], [], [[0,0.5]]);

    def update(self):
        pad = self.width * 0.025
        ipad = pad * 6
        h = self.height * 0.034
        vspace = self.height * 0.11
        px = self.width * 0.043

        y1 = self.height * 0.17

        gps_sats = gps_node.getInt("num_sats")
        val_text = str(gps_sats)
        svg = self.sats_bar.draw(ipad, y1, self.width - 2*ipad, h, px, gps_sats, val_text)

        y1 += vspace
        gps_hdop = gps_node.getDouble("hdop")
        val_text = "%.2f" % gps_hdop
        svg += self.hdop_bar.draw(ipad, y1, self.width - 2*ipad, h, px, gps_hdop, val_text)

        y1 += vspace
        pp0 = nav_node.getDouble("Pp0")
        pp1 = nav_node.getDouble("Pp1")
        pp2 = nav_node.getDouble("Pp2")
        pos_cov = sqrt(pp0*pp0 + pp1*pp1 + pp2*pp2)
        if isnan(pos_cov): pos_cov = 0
        val_text = "%.1f m" % pos_cov
        svg += self.pos_bar.draw(ipad, y1, self.width - 2*ipad, h, px, pos_cov, val_text)

        y1 += vspace
        pv0 = nav_node.getDouble("Pv0")
        pv1 = nav_node.getDouble("Pv1")
        pv2 = nav_node.getDouble("Pv2")
        vel_cov = sqrt(pv0*pv0 + pv1*pv1 + pv2*pv2)
        if isnan(vel_cov): vel_cov = 0
        val_text = "%.2f m/s" % vel_cov
        svg += self.vel_bar.draw(ipad, y1, self.width - 2*ipad, h, px, vel_cov, val_text)

        y1 += vspace
        pa0 = nav_node.getDouble("Pa0")
        pa1 = nav_node.getDouble("Pa1")
        pa2 = nav_node.getDouble("Pa2")
        att_cov = sqrt(pa0*pa0 + pa1*pa1 + pa2*pa2) * r2d
        if isnan(att_cov): att_cov = 0
        val_text = "%.2f deg" % att_cov
        svg += self.att_bar.draw(ipad, y1, self.width - 2*ipad, h, px, att_cov, val_text)

        y1 += vspace
        ax_bias = abs(nav_node.getDouble("ax_bias"))
        ay_bias = abs(nav_node.getDouble("ay_bias"))
        az_bias = abs(nav_node.getDouble("az_bias"))
        accel_bias = sqrt(ax_bias*ax_bias + ay_bias*ay_bias + az_bias*az_bias)
        if nav_node.getInt("status") < 2:
            accel_bias = 0.0
        val_text = "%.2f mps2" % accel_bias
        svg += self.accel_bar.draw(ipad, y1, self.width - 2*ipad, h, px, accel_bias, val_text)

        y1 += vspace
        p_bias = abs(nav_node.getDouble("p_bias"))
        q_bias = abs(nav_node.getDouble("q_bias"))
        r_bias = abs(nav_node.getDouble("r_bias"))
        gyro_bias_deg = sqrt(p_bias*p_bias + q_bias*q_bias + r_bias*r_bias) * r2d
        if nav_node.getInt("status") < 2:
            gyro_bias_deg = 0
        val_text = "%.2f dps" % gyro_bias_deg
        svg += self.gyro_bar.draw(ipad, y1, self.width - 2*ipad, h, px, gyro_bias_deg, val_text)

        self.base.content = self.background + self.power_label + svg

class Controls(NiceGauge):
    def __init__(self):
        super().__init__()

        pad = self.width * 0.025
        bg_radius = self.width * 0.15
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = self.rectangle(pad, pad, self.width-2*pad, self.height-2*pad, bg_radius, self.bg_color)
        y1 = self.width*0.12
        px = self.width * 0.06
        self.controls_label = self.label(self.cx, y1, 0, 0, "FLIGHT CONTROLS", "white", px, align="middle")

        self.base.content = self.background + self.controls_label

        self.ail_bar = NiceBar("Aileron", -1, 1, 0.2, [], [], [[-0.5,0.5]])
        self.ele_bar = NiceBar("Elevator", -1, 1, 0.2, [], [], [[-0.5,0.5]])
        self.rud_bar = NiceBar("Rudder", -1, 1, 0.2, [], [], [[-0.5,0.5]])
        self.thr_bar = NiceBar("Throttle", 0, 100, 10, [[90,100]], [], [[0,75]])
        self.flaps_bar = NiceBar("Flaps", 0, 1, 0.1, [], [], [[0,0.5]])

        print("controls init svg:", self.base.content)

    def update(self):
        pad = self.width * 0.025
        ipad = pad * 6
        h = self.height * 0.04
        vspace = self.height * 0.14
        px = self.width * 0.047

        ail = effectors_node.getDouble("channel", 1)
        ele = effectors_node.getDouble("channel", 2)
        rud = effectors_node.getDouble("channel", 3)
        thr = effectors_node.getDouble("channel", 0) * 100
        flaps = effectors_node.getDouble("flaps")

        y1 = self.width*0.17
        svg = ''

        val_text = "%.2f" % ail
        svg += self.ail_bar.draw(ipad, y1, self.width - 2*ipad, h, px, ail, val_text)

        y1 += vspace
        val_text = "%.2f" % ele
        svg += self.ele_bar.draw(ipad, y1, self.width - 2*ipad, h, px, ele, val_text)

        y1 += vspace
        val_text = "%.2f" % rud
        svg += self.rud_bar.draw(ipad, y1, self.width - 2*ipad, h, px, rud, val_text)

        y1 += vspace
        val_text = "%.0f%%" % thr
        svg += self.thr_bar.draw(ipad, y1, self.width - 2*ipad, h, px, thr, val_text)

        y1 += vspace
        val_text = "%.2f" % flaps
        svg += self.flaps_bar.draw(ipad, y1, self.width - 2*ipad, h, px, flaps, val_text)

        self.base.content = self.background + self.controls_label + svg

class Status(NiceGauge):
    def __init__(self):
        super().__init__()

        pad = self.width * 0.025
        bg_radius = self.width * 0.15
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = self.rectangle(pad, pad, self.width-2*pad, self.height-2*pad, bg_radius, self.bg_color)
        y1 = self.width*0.12
        px = self.width * 0.06
        self.status_label = self.label(self.cx, y1, 0, 0, "STATUS", "white", px, align="middle")

        self.base.content = self.background + self.status_label

        self.batt_bar = NiceBar("Battery", 0, 100, 10, [[0,10]], [[10,25]], [[25,100]])
        self.cell_bar = NiceBar("Per Cell", 3.0, 4.2, 0.1, [[3.0,3.3]], [], [[3.5,4.2]])
        self.vcc_bar = NiceBar("Avionics", 4.5, 5.5, 0.1, [[4.5,4.8], [5.2,5.5]], [], [[4.9,5.1]])
        self.pwm_vcc_bar = NiceBar("PWM", 4.5, 6.0, 0.1, [[4.5,4.8], [5.8,6.0]], [], [[4.9,5.5]])
        self.imu_temp_bar = NiceBar("IMU Temp", 0, 60, 10, [[50,60]], [], [[0,40]])

        print("power init svg:", self.base.content)

    def update(self):
        pad = self.width * 0.025
        ipad = pad * 6
        h = self.height * 0.07
        vspace = self.height * 0.14
        px = self.width * 0.05
        pos = self.width * 0.25

        alert_count = status_node.getLen("alerts")
        warns_count = status_node.getLen("warns")
        oks_count = status_node.getLen("oks")

        svg = ''
        if alert_count == 0 and warns_count == 0 and oks_count == 0:
            svg += self.label(ipad, pos, 0, 0, "Status: OK", "green", px, align="start")
            pos += h

        for i in range(alert_count):
            text = status_node.getString("alerts", i)
            if len(text):
                svg += self.label(ipad, pos, 0, 0, text, "red", px, align="start")
                pos += h
        for i in range(warns_count):
            text = status_node.getString("warns", i)
            if len(text):
                svg += self.label(ipad, pos, 0, 0, text, "yellow", px, align="start")
                pos += h
        for i in range(oks_count):
            text = status_node.getString("oks", i)
            if len(text):
                svg += self.label(ipad, pos, 0, 0, text, "green", px, align="start")
                pos += h

        self.base.content = self.background + self.status_label + svg
