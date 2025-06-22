from math import ceil, cos, sin
from nicegui import ui
from scipy.interpolate import interp1d

from nstSimulator.utils.constants import d2r, kt2mps

from nodes import specs_node, tecs_config_node

class NiceGauge():
    def __init__(self):
        self.width = 512
        self.height = 512
        self.cx = self.width / 2
        self.cy = self.height / 2
        self.radius = self.width * 0.5
        self.bg_color = "#202020"

    def arc(self, cx, cy, radius, start_deg, end_deg, stroke, fill, stroke_width, fill_opacity):
        # print("cx:", cx, "start_deg:", start_deg, "end_deg:", end_deg)
        x1 = cx + cos(start_deg*d2r)*radius
        x2 = cx + cos(end_deg*d2r)*radius
        y1 = cy - sin(start_deg*d2r)*radius
        y2 = cy - sin(end_deg*d2r)*radius
        svg = '<path d="M %.0f %.0f A %.0f %.0f 0 %d 1 %.0f %.0f" ' % (x1, y1, radius, radius, end_deg-start_deg>180, x2, y2)
        svg += 'stroke="%s" ' % stroke
        if len(fill):
            svg += 'fill="%s" ' % fill
        svg += 'stroke-width="%.0f" ' % stroke_width
        svg += 'fill-opacity="%0.1f" ' % fill_opacity
        svg += '/>'
        # print("arc:", svg)
        return svg

    def tic(self, cx, cy, inner_radius, outer_radius, angle_deg, stroke, fill, stroke_width, fill_opacity):
        # print("cx:", cx, "angle_deg:", angle_deg)
        x1 = cx + cos(angle_deg*d2r)*inner_radius
        x2 = cx + cos(angle_deg*d2r)*outer_radius
        y1 = cy - sin(angle_deg*d2r)*inner_radius
        y2 = cy - sin(angle_deg*d2r)*outer_radius
        svg = '<path d="M %.0f %.0f L %.0f %.0f" ' % (x1, y1, x2, y2)
        svg += 'stroke="%s" ' % stroke
        if len(fill):
            svg += 'fill="%s" ' % fill
        svg += 'stroke-width="%.0f" ' % stroke_width
        svg += 'fill-opacity="%0.1f" ' % fill_opacity
        svg += '/>'
        # print("tic:", svg)
        return svg

    def label(self, cx, cy, radius, angle_deg, text, stroke, font_size):
        # print("cx:", cx, "angle_deg:", angle_deg)
        x1 = cx + cos(angle_deg*d2r)*radius
        y1 = cy - sin(angle_deg*d2r)*radius
        # svg = '<text x="%.0f" y="%.0f" dominant-baseline="middle" text-anchor="middle">%s</text>' % (x1, y1, text)
        svg = '<text x="%.0f" y="%.0f" text-anchor="middle" dominant-baseline="middle" fill="%s" font-size="%.0f">%s</text>' % (x1, y1, stroke, font_size, text)
        # svg += 'stroke="%s" ' % stroke
        # svg += 'stroke-width="%.0f" ' % stroke_width
        # svg += 'fill-opacity="%0.1f" ' % fill_opacity
        # svg += '/>'
        # print("tic:", svg)
        return svg

class Airspeed(NiceGauge):
    def __init__(self):
        super().__init__()

        bg_radius = self.width*0.5 * 0.95
        self.base = ui.interactive_image(size=(self.width,self.height)).classes('w-96').props("fit=scale-down")
        self.background = '<circle cx="%.0f" cy="%.0f" r="%.0f" fill="%s" />' % (self.cx, self.cy, bg_radius, self.bg_color)
        # self.background = ""
        self.base.content = self.background
        print("asi init svg:", self.base.content)

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

        # var speed = 0.0;
        # if ( json.config.specs.vehicle_class != null && json.config.specs.vehicle_class != "surface" ) {
        #     speed = json.sensors.airdata.airspeed_filt_mps*mps2kt;
        # } else {
        #     speed = json.filters.nav.groundspeed_kt;
        # }

        # // units label
        # var px = Math.round(size * 0.07);
        # context.font = px + "px Courier New, monospace";
        # context.fillStyle = "white";
        # context.textAlign = "center";
        # context.fillText(speed.toFixed(0) + " " + display_units.toUpperCase(), cx, cy - size*0.08);

        # // ground speed label
        # var px = Math.round(size * 0.06);
        # context.font = px + "px Courier New, monospace";
        # context.fillStyle = "orange";
        # context.textAlign = "center";
        # gs = json.filters.nav.groundspeed_kt;
        # context.fillText("GS: " + gs.toFixed(0), cx, cy + size*0.16);

        # // bug
        # context.save();
        # var nw = Math.floor(img_hdg2.width*scale)
        # var nh = Math.floor(img_hdg2.height*scale)
        # context.translate(cx, cy);
        # var deg = my_interp( json.fcs.refs.airspeed_kt*speed_scale,
        #                      asi_interpx, asi_interpy);
        # context.rotate(deg*d2r);
        # context.drawImage(img_hdg2, -nw*0.5, -size*0.5*0.95, width=nw, height=nh);
        # context.restore();

        # // gs needle
        # context.save();
        # context.strokeStyle = 'orange';
        # context.lineWidth = 4;
        # context.translate(cx, cy);
        # var gs_kt = json.filters.nav.groundspeed_kt*speed_scale;
        # var deg = my_interp( gs_kt, asi_interpx, asi_interpy);
        # context.rotate(deg*d2r);
        # context.beginPath();
        # context.moveTo(0, 0);
        # context.lineTo(0, -size*0.44*0.85);
        # context.stroke();
        # context.beginPath();
        # context.moveTo(0, -size*0.44*0.85);
        # context.lineTo(-size*0.03*0.85, -size*0.37*0.85);
        # context.stroke();
        # context.beginPath();
        # context.moveTo(0, -size*0.44*0.85);
        # context.lineTo(size*0.03*0.85, -size*0.37*0.85);
        # context.stroke();
        # context.restore();

        # // airspeed needle
        # context.save();
        # var nw = Math.floor(img_asi3.width*scale)
        # var nh = Math.floor(img_asi3.height*scale)
        # context.translate(cx, cy);
        # var speed = 0.0;
        # if ( json.config.specs.vehicle_class != null && json.config.specs.vehicle_class != "surface" ) {
        #     speed = json.sensors.airdata.airspeed_filt_mps*mps2kt;
        # } else {
        #     speed = json.filters.nav.groundspeed_kt;
        # }

        # var deg = my_interp( speed * speed_scale, asi_interpx, asi_interpy);
        # context.rotate(deg*d2r);
        # context.drawImage(img_asi3, -nw*0.5, -nh*0.85, width=nw, height=nh);
        # context.restore();

        self.base.content = self.background + self.green_arc + self.yellow_arc + self.red_arc + tic_svg
        # print(self.base.content)
