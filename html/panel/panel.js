// Analog instrument panel.
//
// Uses the html5 canvas and a websockets/json interface to the data
// sever for telemetry.

var d2r = Math.PI / 180;
var r2d = 180 / Math.PI;
var mps2kt = 1.9438444924406046432;
var kt2mps = 0.514444;

var panel = function() {
    var canvas;
    var context;
    var options;
    var opacity = 1;

    var img_volts = new Image();
    var img_aura_asi1 = new Image();
    var img_aura_asi2 = new Image();
    var img_asi3 = new Image();
    var img_ati1 = new Image();
    var img_ati2 = new Image();
    var img_ati3 = new Image();
    var img_ati4 = new Image();
    var img_ati5 = new Image();
    var img_alt1 = new Image();
    var img_alt2 = new Image();
    var img_alt3 = new Image();
    var img_alt4 = new Image();
    var img_alt5 = new Image();
    var img_power = new Image();
    //var img_tc1 = new Image();
    //var img_tc2 = new Image();
    //var img_tc3 = new Image();
    //var img_tc4 = new Image();
    var img_hdg1 = new Image();
    var img_hdg2 = new Image();
    var img_hdg3 = new Image();
    var img_vsi1 = new Image();

    var instrument_config = {
        vcc : {draw: draw_vcc},
        asi : {draw: draw_asi2},
        ati : {draw: draw_ati},
        alt : {draw: draw_alt},
        amp : {draw: draw_amp},
        power : {draw: draw_power},
        power2 : {draw: draw_power2},
        tc : {draw: draw_tc},
        status : {draw: draw_status2},
        dg : {draw: draw_dg},
        vsi : {draw: draw_vsi},
        controls : {draw: draw_controls},
        insgns : {draw: draw_insgnss},
    };

    var layout_config = {
        horizontal : {
            instruments : [['asi', 'ati', 'alt', 'power2'],
                           ['status', 'dg', 'insgns', 'controls']]
        },
        vertical : {
            instruments : [['power2', 'status'],
                           ['asi', 'ati'],
                           ['alt', 'dg'],
                           ['vsi', '']]
        }
    };

    function my_interp( input, interpx, interpy ) {
        var len = interpx.length;
        if ( input < interpx[0] ) { input = interpx[0]; }
        if ( input > interpx[len-1] ) { input = interpx[len-1]; }
        for ( var i = 0; i < len - 1; i++ ) {
            if ( input >= interpx[i] && input <= interpx[i+1] ) {
                var rangex = interpx[i+1] - interpx[i];
                var portion = input - interpx[i];
                var percent = portion / rangex;
                var rangey = interpy[i+1] - interpy[i];
                return interpy[i] + rangey * percent;
            }
        }
        return 0;
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth - 30;
        canvas.height = window.innerHeight - 30;
    }

    function init() {
        canvas = document.getElementById("panel");
        context = canvas.getContext('2d');
        window.addEventListener('resize', resizeCanvas, false);
        resizeCanvas();

        img_volts.src = 'textures/volts.png';
        img_aura_asi1.src = 'textures/aura-asi1.png';
        img_aura_asi2.src = 'textures/aura-asi2.png';
        img_asi3.src = 'textures/asi3.png';
        img_ati1.src = 'textures/ati1.png';
        img_ati2.src = 'textures/ati2.png';
        img_ati3.src = 'textures/ati3.png';
        img_ati4.src = 'textures/ati4.png';
        img_ati5.src = 'textures/ati5.png';
        img_alt1.src = 'textures/alt1.png';
        img_alt2.src = 'textures/alt2.png';
        img_alt3.src = 'textures/alt3.png';
        img_alt4.src = 'textures/alt4.png';
        img_alt5.src = 'textures/alt5.png';
        img_power.src = 'textures/power.png';
        //img_tc1.src = 'textures/tc1.png';
        //img_tc2.src = 'textures/tc2.png';
        //img_tc3.src = 'textures/tc3.png';
        //img_tc4.src = 'textures/tc4.png';
        img_hdg1.src = 'textures/hdg1.png';
        img_hdg2.src = 'textures/hdg2.png';
        img_hdg3.src = 'textures/hdg3.png';
        img_vsi1.src = 'textures/vsi1.png';

        console.log('finished scheduling texture loads');
    }

    function draw() {
        var layout;
        if ( canvas.width >= canvas.height ) {
            layout = layout_config['horizontal'];
        } else {
            layout = layout_config['vertical'];
        }
        context.clearRect(0,0,canvas.width,canvas.height);
        var num_rows = layout.instruments.length;
        var dy = Math.floor(canvas.height / num_rows);
        for (var row = 0; row < num_rows; row++) {
            var num_cols = layout.instruments[row].length;
            var dx = Math.floor(canvas.width / num_cols);
            var size = dx;
            if ( dy < dx ) { size = dy; }
            var offset_x = Math.floor((canvas.width - (num_cols * size)) / 2);
            var offset_y = Math.floor((canvas.height - (num_rows * size)) / 2);
            for (var col = 0; col < num_cols; col++) {
                var pos_x = offset_x + size * col;
                var pos_y = offset_y + size * row;
                var instrument = layout.instruments[row][col];
                if (instrument_config[instrument]) {
	            if (instrument_config[instrument].draw) {
	                instrument_config[instrument].draw(pos_x, pos_y, size);
                    }
                }
            }
        }
    }

    function draw_vcc( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        // background
        context.drawImage(img_volts, x, y, width=size, height=size);

        // vcc needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale)
        var nh = Math.floor(img_asi3.height*scale)
        context.translate(cx, cy);
        var vcc = json.sensors.power.avionics_vcc;
        if (vcc < 4.45) { vcc = 4.45; }
        if (vcc > 5.55) { vcc = 5.55; }
        var deg = (vcc - 5.0) * 150.0;
        context.rotate(deg*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();

        // volts needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale)
        var nh = Math.floor(img_asi3.height*scale)
        context.translate(cx, cy);
        var cell_volts = parseFloat(json.sensors.power.cell_vcc);
        if (cell_volts < 2.95) { cell_volts = 2.95; }
        if (cell_volts > 4.25) { cell_volts = 4.25; }
        var deg = ((3.6 - cell_volts) * 75.0 / 0.6) + 180.0;
        context.rotate(deg*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();

    }

    var asi_interpx = [ 0, 80,  160 ];
    var asi_interpy = [ 0, 340, 680 ];
    function draw_asi( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var display_units = json.config.specs.display_units;
        var speed_scale = 1.0;
        if ( display_units == "mps" ) {
            speed_scale = kt2mps;
        } else if ( display_units == "kts" ) {
            speed_scale = 1.0;
        } else {
            // default to mps if not specified
            speed_scale = kt2mps;
            display_units = "MPS";
        }

        var min_kt = parseFloat(json.config.autopilot.TECS.min_kt);
        var max_kt = parseFloat(json.config.autopilot.TECS.max_kt);
        var cruise_kt = parseFloat(json.config.specs.cruise_kt);
        var range_kt = max_kt - min_kt;
        var caution_kt = min_kt + 0.8 * range_kt;
        var die_kt = max_kt + 10.0;


        var min_deg = my_interp(min_kt*speed_scale, asi_interpx, asi_interpy);
        var max_deg = my_interp(max_kt*speed_scale, asi_interpx, asi_interpy);
        var cruise_deg = my_interp(cruise_kt*speed_scale, asi_interpx, asi_interpy);
        var caution_deg = my_interp(caution_kt*speed_scale, asi_interpx, asi_interpy);
        var die_deg = my_interp(die_kt*speed_scale, asi_interpx, asi_interpy);

        var min_rad = (min_deg - 90) * d2r;
        var max_rad = (max_deg - 90) * d2r;
        var caution_rad = (caution_deg - 90) * d2r;
        var die_rad = (die_deg - 90) * d2r;

        // background
        context.drawImage(img_aura_asi1, x, y, width=size, height=size);

        // green arc
        context.beginPath();
        context.arc(cx, cy, size*0.414, min_rad, caution_rad)
        context.strokeStyle = '#0C0';
        context.lineWidth = 20;
        context.stroke();

        // yellow arc
        context.beginPath();
        context.arc(cx, cy, size*0.422, caution_rad, max_rad)
        context.strokeStyle = 'yellow';
        context.lineWidth = 15;
        context.stroke();

        // red arc
        context.beginPath();
        context.arc(cx, cy, size*0.430, max_rad, die_rad)
        context.strokeStyle = '#e03030';
        context.lineWidth = 10;
        context.stroke();

        // tics
        context.drawImage(img_aura_asi2, x, y, width=size, height=size);

        // units label
        var px = Math.round(size * 0.07);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(display_units.toUpperCase(), cx, cy + size*0.13);

        // 'true' label
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "orange";
        context.textAlign = "center";
        context.fillText("(TRUE)", cx, cy + size*0.21);

        // bug
        context.save();
        var nw = Math.floor(img_hdg2.width*scale)
        var nh = Math.floor(img_hdg2.height*scale)
        context.translate(cx, cy);
        var deg = my_interp( json.autopilot.targets.airspeed_kt*speed_scale,
                             asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.drawImage(img_hdg2, -nw*0.5, -size*0.5*0.95, width=nw, height=nh);
        context.restore();

        // true airspeed needle
        context.save();
        context.strokeStyle = 'orange';
        context.lineWidth = 5;
        context.translate(cx, cy);
        var ps = json.sensors.airdata.pitot_scale_factor;
        var true_kt = json.sensors.airdata.airspeed_filt_mps*mps2kt*speed_scale * ps;
        var deg = my_interp( true_kt, asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -size*0.45*0.85);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.45*0.85);
        context.lineTo(-size*0.03*0.85, -size*0.37*0.85);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.45*0.85);
        context.lineTo(size*0.03*0.85, -size*0.37*0.85);
        context.stroke();
        context.restore();

        // airspeed needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale)
        var nh = Math.floor(img_asi3.height*scale)
        context.translate(cx, cy);
        var speed = 0.0;
        if ( json.config.specs.vehicle_class != null && json.config.specs.vehicle_class != "surface" ) {
            speed = json.sensors.airdata.airspeed_filt_mps*mps2kt;
        } else {
            speed = json.filters.nav.groundspeed_kt;
        }

        var deg = my_interp( speed * speed_scale, asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();
    }

    function draw_asi2( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var display_units = json.config.specs.display_units;
        var speed_scale = 1.0;
        if ( display_units == "mps" ) {
            speed_scale = kt2mps;
        } else if ( display_units == "kts" ) {
            speed_scale = 1.0;
        } else {
            // default to mps if not specified
            speed_scale = kt2mps;
            display_units = "mps";
        }

        var min_kt = parseFloat(json.config.autopilot.TECS.min_kt);
        var max_kt = parseFloat(json.config.autopilot.TECS.max_kt);
        var cruise_kt = parseFloat(json.config.specs.cruise_kt);
        var range_kt = max_kt - min_kt;
        var caution_kt = min_kt + 0.8 * range_kt;
        var die_kt = max_kt + 10.0;

        var max_display = Math.ceil( die_kt / 10 ) * 10
        max_display = 220;
        var asi_interpx = [ 0, max_display, 2*max_display ];
        var asi_interpy = [ 0, 340, 360 ];

        var min_deg = my_interp(min_kt*speed_scale, asi_interpx, asi_interpy);
        var max_deg = my_interp(max_kt*speed_scale, asi_interpx, asi_interpy);
        var cruise_deg = my_interp(cruise_kt*speed_scale, asi_interpx, asi_interpy);
        var caution_deg = my_interp(caution_kt*speed_scale, asi_interpx, asi_interpy);
        var die_deg = my_interp(die_kt*speed_scale, asi_interpx, asi_interpy);

        var min_rad = (min_deg - 90) * d2r;
        var max_rad = (max_deg - 90) * d2r;
        var caution_rad = (caution_deg - 90) * d2r;
        var die_rad = (die_deg - 90) * d2r;

        // background
        context.drawImage(img_aura_asi1, x, y, width=size, height=size);

        // green arc
        context.beginPath();
        context.arc(cx, cy, size*0.414, min_rad, caution_rad);
        context.strokeStyle = '#0C0';
        context.lineWidth = 20;
        context.stroke();

        // yellow arc
        context.beginPath();
        context.arc(cx, cy, size*0.422, caution_rad, max_rad);
        context.strokeStyle = 'yellow';
        context.lineWidth = 15;
        context.stroke();

        // red arc
        context.beginPath();
        context.arc(cx, cy, size*0.430, max_rad, die_rad);
        context.strokeStyle = '#e03030';
        context.lineWidth = 10;
        context.stroke();

        // tics
        var px = Math.round(size * 0.07);
        context.font = "bold " + px + "px Arial";
        context.fillStyle = "white";
        context.textAlign = "center";
        dstic = 0;
        if ( max_display <= 50 ) {
            dtic = 5;
            dstic = 1;
        } else if ( max_display <= 100 ) {
            dtic = 10;
            dstic = 5;
        } else {
            dtic = 20;
            dstic = 10;
        }
        for ( var i = dtic; i <= max_display; i += dtic ) {
            context.beginPath();
            var tic_rad = my_interp(i*speed_scale, asi_interpx, asi_interpy) * d2r ;
            // console.log(i, speed_scale, tic_rad);
            context.arc(cx, cy, size*0.398, tic_rad-0.5*Math.PI-0.015, tic_rad-0.5*Math.PI+0.015);
            context.strokeStyle = '#ffffff';
            context.lineWidth = 30;
            context.stroke();
            var tx = cx + Math.sin(tic_rad) * size*0.29;
            var ty = cy - Math.cos(tic_rad) * size*0.3 + size*0.03;
            context.fillText(i.toString(), tx, ty);
        }
        if ( dstic > 0 ) {
            for ( var i = dstic; i <= max_display; i += dstic ) {
                context.beginPath();
                var tic_rad = my_interp(i*speed_scale, asi_interpx, asi_interpy) * d2r ;
                // console.log(i, speed_scale, tic_rad);
                context.arc(cx, cy, size*0.414, tic_rad-0.5*Math.PI-0.01, tic_rad-0.5*Math.PI+0.01);
                context.strokeStyle = '#ffffff';
                context.lineWidth = 20;
                context.stroke();
            }
        }

        var speed = 0.0;
        if ( json.config.specs.vehicle_class != null && json.config.specs.vehicle_class != "surface" ) {
            speed = json.sensors.airdata.airspeed_filt_mps*mps2kt;
        } else {
            speed = json.filters.nav.groundspeed_kt;
        }

        // units label
        var px = Math.round(size * 0.07);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(speed.toFixed(0) + " " + display_units.toUpperCase(), cx, cy - size*0.08);

        // ground speed label
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "orange";
        context.textAlign = "center";
        gs = json.filters.nav.groundspeed_kt;
        context.fillText("GS: " + gs.toFixed(0), cx, cy + size*0.16);

        // bug
        context.save();
        var nw = Math.floor(img_hdg2.width*scale)
        var nh = Math.floor(img_hdg2.height*scale)
        context.translate(cx, cy);
        var deg = my_interp( json.autopilot.targets.airspeed_kt*speed_scale,
                             asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.drawImage(img_hdg2, -nw*0.5, -size*0.5*0.95, width=nw, height=nh);
        context.restore();

        // gs needle
        context.save();
        context.strokeStyle = 'orange';
        context.lineWidth = 4;
        context.translate(cx, cy);
        var gs_kt = json.filters.nav.groundspeed_kt*speed_scale;
        var deg = my_interp( gs_kt, asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -size*0.44*0.85);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.44*0.85);
        context.lineTo(-size*0.03*0.85, -size*0.37*0.85);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.44*0.85);
        context.lineTo(size*0.03*0.85, -size*0.37*0.85);
        context.stroke();
        context.restore();

        // airspeed needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale)
        var nh = Math.floor(img_asi3.height*scale)
        context.translate(cx, cy);
        var speed = 0.0;
        if ( json.config.specs.vehicle_class != null && json.config.specs.vehicle_class != "surface" ) {
            speed = json.sensors.airdata.airspeed_filt_mps*mps2kt;
        } else {
            speed = json.filters.nav.groundspeed_kt;
        }

        var deg = my_interp( speed * speed_scale, asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();
    }

    function draw_ati( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var roll = json.filters.nav.roll_deg;
        var pitch = json.filters.nav.pitch_deg;

        // backplate
        context.save();
        var nw = Math.floor(img_ati1.width*scale)
        var nh = Math.floor(img_ati1.height*scale)
        context.translate(cx, cy);
        context.rotate(-roll*d2r);
        context.drawImage(img_ati1, -nw*0.5, -nh*0.5, width=nw, height=nh);
        context.restore();

        // pitch overlay
        context.save();
        var nw = Math.floor(img_ati2.width*scale)
        var nh = Math.floor(img_ati2.height*scale)
        context.translate(cx, cy);
        context.rotate(-roll*d2r);
        var p = pitch;
        if ( p < -20 ) { p = -20; }
        if ( p > 20 ) { p = 20; }
        var y_offset = (p * 4.5) * scale;
        context.drawImage(img_ati2, -nw*0.5, -nh*0.5+y_offset, width=nw, height=nh);
        context.restore();

        // roll
        context.save();
        var nw = Math.floor(img_ati3.width*scale)
        var nh = Math.floor(img_ati3.height*scale)
        context.translate(cx, cy);
        context.rotate(-roll*d2r);
        context.drawImage(img_ati3, -nw*0.5, -nh*0.5, width=nw, height=nh);
        context.restore();

        // bird
        context.save();
        var nw = Math.floor(img_ati4.width*scale)
        var nh = Math.floor(img_ati4.height*scale)
        context.translate(cx, cy);
        context.drawImage(img_ati4, -nw*0.5, -nh*0.5+(78*scale), width=nw, height=nh);
        context.restore();

        // bezel
        context.drawImage(img_ati5, x, y, width=size, height=size);
    }

    function draw_alt( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        //var alt_ft = json.position.altitude_true_m / 0.3048;
        var alt_ft = json.filters.nav.altitude_m / 0.3048;
        var ground_ft = json.sensors.airdata.altitude_ground_m / 0.3048;
        var target_ft = ground_ft + json.autopilot.targets.altitude_agl_ft;

        // kollsman
        context.save();
        var nw = Math.floor(img_alt1.width*scale)
        var nh = Math.floor(img_alt1.height*scale)
        context.translate(cx, cy);
        context.drawImage(img_alt1, -nw*0.5, -nh*0.5, width=(size*0.75), height=(size*0.75));
        context.restore();

        // backplate
        context.drawImage(img_alt2, x, y, width=size, height=size);

        // ground elevation
        context.save();
        context.strokeStyle = '#e03030';
        context.lineWidth = 7;
        context.translate(cx, cy);
        context.rotate((ground_ft*0.36)*d2r);
        context.beginPath();
        context.moveTo(0, -size*0.35*0.85);
        context.lineTo(0, -size*0.48*0.85);
        context.stroke();
        context.restore();

        // bug
        context.save();
        var nw = Math.floor(img_hdg2.width*scale)
        var nh = Math.floor(img_hdg2.height*scale)
        context.translate(cx, cy);
        context.rotate((target_ft*0.36)*d2r);
        context.drawImage(img_hdg2, -nw*0.5, -size*0.5*0.85, width=nw, height=nh);
        context.restore();

        // needle 10k ft
        context.save();
        var nw = Math.floor(img_alt3.width*scale)
        var nh = Math.floor(img_alt3.height*scale)
        context.translate(cx, cy);
        context.rotate((alt_ft*0.0036)*d2r);
        context.drawImage(img_alt3, -nw*0.5, -nh*0.5, width=nw, height=nh);
        context.restore();

        // needle 1k ft
        context.save();
        var nw = Math.floor(img_alt4.width*scale)
        var nh = Math.floor(img_alt4.height*scale)
        context.translate(cx, cy);
        context.rotate((alt_ft*0.036)*d2r);
        context.drawImage(img_alt4, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();

        // needle 100 ft
        context.save();
        var nw = Math.floor(img_alt5.width*scale)
        var nh = Math.floor(img_alt5.height*scale)
        context.translate(cx, cy);
        context.rotate((alt_ft*0.36)*d2r);
        context.drawImage(img_alt5, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();
    }

    function draw_amp( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var amps = json.sensors.power.main_amps;

        // backplate
        context.drawImage(img_amp, x, y, width=size, height=size);

        // needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale)
        var nh = Math.floor(img_asi3.height*scale)
        context.translate(cx, cy);
        context.rotate((amps * 340 / 50.0) * d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();
    }

    function myroundRect2(x,y,width,height,radius) {

        var r = Math.min(Math.max(width-1,1),Math.max(height-1,1),radius);
        var rectX = x;
        var rectY = y;
        var rectWidth = width;
        var rectHeight = height;
        var cornerRadius = r;

        context.save();
        context.lineJoin = 'round';
        context.lineWidth = cornerRadius;
        context.beginPath();
        context.strokeRect(rectX+(cornerRadius/2), rectY+(cornerRadius/2), rectWidth-cornerRadius, rectHeight-cornerRadius);
        context.fillRect(rectX+(cornerRadius/2), rectY+(cornerRadius/2), rectWidth-cornerRadius, rectHeight-cornerRadius);
        context.stroke();
        context.restore();
    }

    class MyBar {
        constructor(text1, minv, maxv, tics, reds, yellows, greens) {
            this.time_factor = 60;
            this.text1 = text1;
            this.minv = minv;
            this.maxv = maxv;
            this.range = this.maxv - this.minv;
            this.tics = tics;
            this.reds = reds;
            this.yellows = yellows;
            this.greens = greens;
            this.avg = null;
            this.std2 = null;
            this.last_time = 0;
	    this.pointer_color = 'white';
	    this.start = 0;
	    this.state = 0;
            this.verbose = false;
        }
	set_pointer_color(val) {
            for ( var i = 0; i < this.greens.length; i++ ) {
		if ( val >= this.greens[i][0] && val <= this.greens[i][1] ) {
		    this.pointer_color = 'white';
		    return;
		}
	    }
            for ( var i = 0; i < this.reds.length; i++ ) {
		var alert = 0;
		if ( val >= this.reds[i][0] && val <= this.reds[i][1] ) {
		    alert = 1;
		} else if ( val < this.minv ) {
		    alert = 1;
		} else if ( val > this.maxv ) {
		    alert = 1;
		}
		if ( alert ) {
		    if ( this.state == 0 ) {
			if ( Date.now() > this.start+300 ) {
			    this.state = 1;
			    this.start = Date.now();
			}
		    } else if ( this.state == 1 ) {
			if ( Date.now() > this.start+1000 ) {
			    this.state = 0;
			    this.start = Date.now();
			}
		    }
		    if ( this.state == 1 ) {
			this.pointer_color = 'red';
		    } else {
			this.pointer_color = 'white';
		    }
		    return;
		}
	    }
	    this.pointer_color = 'yellow';
	}
        update_stats(val) {
            if ( typeof json.sensors.imu !== 'undefined' ) {
                var timestamp = parseFloat(json.sensors.imu.millis) / 1000.0;
                var dt = timestamp - this.last_time;
                this.last_time = timestamp;
                if (this.avg == null || isNaN(this.avg) ) {
                    this.avg = val;
                    this.std2 = 0;
                } else if (dt > 0) {
                    var wf = dt / this.time_factor;
                    if ( wf < 0 ) { wf = 0; }
                    if ( wf > 1 ) { wf = 1; }
                    this.avg = (1-wf)*this.avg + wf*val;
                    var err = Math.abs(val - this.avg);
                    this.std2 = (1-wf)*this.std2 + wf*err*err;
                }
            }
        }
        draw(x, y, w, h, px, val, text2) {
            if ( val < this.minv - 0.05*this.range ) {
                val = this.minv - 0.05*this.range;
            }
            if ( val > this.maxv + 0.05*this.range ) {
                val = this.maxv + 0.05*this.range;
            }
            if ( this.verbose ) {
                console.log(val);
            }
            this.update_stats(val);
	    this.set_pointer_color(val);
            context.save();

            context.shadowColor = "transparent";

            context.strokeStyle = "white";
            context.lineWidth = Math.round(h*0.4);
            context.beginPath();
            context.moveTo(x, y+Math.round(h*0.5));
            context.lineTo(x+w, y+Math.round(h*0.5));
            context.stroke();
            context.strokeStyle = 'yellow';
            for ( var i = 0; i < this.yellows.length; i++ ) {
                context.lineWidth = h;
                var x1 = ((this.yellows[i][0] - this.minv) / this.range) * w;
                var x2 = ((this.yellows[i][1] - this.minv) / this.range) * w;
                context.beginPath();
                context.moveTo(x+x1, y + Math.round(h*0.5));
                context.lineTo(x+x2, y + Math.round(h*0.5));
                context.stroke();
            }
            context.strokeStyle = '#0C0';
            context.lineWidth = h;
            for ( var i = 0; i < this.greens.length; i++ ) {
                var x1 = ((this.greens[i][0] - this.minv) / this.range) * w;
                var x2 = ((this.greens[i][1] - this.minv) / this.range) * w;
                context.beginPath();
                context.moveTo(x+x1, y + Math.round(h*0.5));
                context.lineTo(x+x2, y + Math.round(h*0.5));
                context.stroke();
            }
            context.strokeStyle = "black";
            context.lineWidth = 1;
            context.beginPath();
            for ( var xt = this.minv+this.tics; xt < this.maxv; xt += this.tics ) {
                var x1 = ((xt - this.minv) / this.range) * w;
                context.moveTo(x+x1, y);
                context.lineTo(x+x1, y + Math.round(h*0.8));
            }
            context.stroke();
            context.strokeStyle = '#e03030';
            for ( var i = 0; i < this.reds.length; i++ ) {
                context.lineWidth = Math.round(w*0.02);
                var x1 = ((this.reds[i][0] - this.minv) / this.range) * w;
                var x2 = ((this.reds[i][1] - this.minv) / this.range) * w;
		if ( x1 > 1 && x1 < w-1 ) {
                    context.beginPath();
                    context.moveTo(x+x1, y);
                    context.lineTo(x+x1, y + h);
                    context.stroke();
                }
		if ( x2 > 1 && x2 < w-1 ) {
                    context.beginPath();
                    context.moveTo(x+x2, y);
                    context.lineTo(x+x2, y + h);
                    context.stroke();
                }
            }
            context.strokeStyle = "cyan";
            var std = Math.sqrt(this.std2);
            var v1 = this.avg - std;
            if (v1 < this.minv) { v1 = this.minv; }
            if (v1 > this.maxv) { v1 = this.maxv; }
            var v2 = this.avg + std;
            if (v2 < this.minv) { v2 = this.minv; }
            if (v2 > this.maxv) { v2 = this.maxv; }
            var x1 = ((v1 - this.minv) / this.range) * w;
            var x2 = ((v2 - this.minv) / this.range) * w;
            var y1 = Math.round(h*0.5);
            context.lineWidth = Math.round(h*0.4);
            context.beginPath();
            context.moveTo(x+x1, y + y1);
            context.lineTo(x+x2, y + y1);
            context.stroke();
            context.strokeStyle = "white"
            context.lineWidth = 3;
            var x1 = ((this.avg - this.minv) / this.range) * w;
            context.beginPath();
            context.moveTo(x+x1, y);
            context.lineTo(x+x1, y + h);
            context.stroke();

            context.save()
            var x1 = ((val - this.minv) / this.range) * w
            var y1 = Math.round(h*0.5);
            context.lineWidth = 1;
            context.strokeStyle = this.pointer_color;
            context.fillStyle = this.pointer_color;
            context.beginPath();
            context.moveTo(x+x1, y+y1);
            context.lineTo(x+x1-y1, y+y1-y1*Math.sqrt(3));
            context.lineTo(x+x1+y1, y+y1-y1*Math.sqrt(3));
            context.lineTo(x+x1, y+y1);
            context.stroke();
	    context.shadowOffsetX = 1;
	    context.shadowOffsetY = 2;
	    context.shadowBlur = 3;
	    context.shadowColor = "rgba(0, 0, 0, 0.9)";
            context.fill();
            context.restore();

            context.font = px + "px Courier New, monospace";
	    context.strokeStyle = "white";
            context.fillStyle = "white";
            context.textAlign = "left";
            context.fillText(this.text1, x, y + Math.round(2.2*h));
            context.textAlign = "right";
            context.fillText(text2, x + w, y + Math.round(2.2*h));
            context.beginPath();
            context.restore();
        }
    }

    var batt_bar = new MyBar("Battery", 0.0, 100, 10,
                             [[0,10]], [], [[25,100]]);
    var cell_bar = new MyBar("Per Cell", 3.0, 4.2, 0.1,
                             [[3.0,3.3]], [], [[3.5,4.2]]);
    var curr_bar = new MyBar("Current Draw", 0, 200, 25,
                             [[150,200]], [], [[0,50]]);
    var vcc_bar = new MyBar("Avionics", 4.5, 5.5, 0.1,
                            [[4.5,4.8], [5.2,5.5]],
                            [],
                            [[4.9,5.1]]);
    var imu_temp_bar = new MyBar("IMU Temp", 0, 60, 10,
                                 [[50,60]], [], [[0,40]]);

    function draw_power2( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var pad = Math.round(size * 0.025);
        var ipad = pad * 6;
        var r = Math.round(size * 0.3);
        var h = Math.round(size * 0.04);
        var vspace = Math.round(size * 0.15);

        context.strokeStyle = '#202020';
        context.fillStyle = '#202020';
        myroundRect2(x+pad, y+pad, size-2*pad, size-2*pad, r);

        // power label
        var y1 = Math.round(size*0.12);
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText("POWER", cx, y + y1);

        px =  Math.round(size * 0.05);

        var mah = parseFloat(json.sensors.power.total_mah).toFixed(0);
        var battery_total = parseFloat(json.config.specs.battery_mah)
        var remaining = battery_total - mah
        // var battery_percent = ((remaining / battery_total) * 100).toFixed(0)
        var battery_percent = parseFloat(json.sensors.power.battery_perc)*100
        if ( battery_percent < 0 ) {
            battery_percent = 0;
        }
        y1 = Math.round(size*0.17);
        var val_text = (battery_percent).toFixed(0) + "%";
        batt_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                      px, battery_percent, val_text)

        y1 += vspace;
        var cell_volts = json.sensors.power.cell_vcc;
        if ( cell_volts == null ) { cell_volts = 0; }
        var val_text = (cell_volts).toFixed(2) + "V";
        cell_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                      px, cell_volts, val_text);

        y1 += vspace;
        var watts = json.sensors.power.main_watts;
        var val_text = (watts).toFixed(0) + "W";
        curr_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                      px, watts, val_text);

        y1 += vspace;
        var vcc = json.sensors.power.avionics_vcc;
        if ( vcc == null ) { vcc = 0; }
        var val_text = (vcc).toFixed(2) + "V";
        vcc_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                     px, vcc, val_text);

        y1 += vspace;
        var imu_temp = 0;
        if ( typeof json.sensors.imu !== 'undefined' ) {
            imu_temp = parseFloat(json.sensors.imu.temp_C);
        }
        var val_text = (imu_temp).toFixed(0) + "C";
        imu_temp_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                          px, imu_temp, val_text);
    }

    var ail_bar = new MyBar("Aileron", -1, 1, 0.2,
                            [], [], [[-0.5,0.5]]);
    var ele_bar = new MyBar("Elevator", -1, 1, 0.2,
                            [], [], [[-0.5,0.5]]);
    var rud_bar = new MyBar("Rudder", -1, 1, 0.2,
                            [], [], [[-0.5,0.5]]);
    var thr_bar = new MyBar("Throttle", 0, 100, 10,
                            [[90,100]], [], [[0,75]]);
    var flaps_bar = new MyBar("Flaps", 0, 1, 0.1,
                              [], [], [[0,0.5]]);
    function draw_controls( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var pad = Math.round(size * 0.025);
        var ipad = pad * 6;
        var r = Math.round(size * 0.3);
        var h = Math.round(size * 0.04);
        var vspace = Math.round(size * 0.15);

        context.strokeStyle = '#202020';
        context.fillStyle = '#202020';
        myroundRect2(x+pad, y+pad, size-2*pad, size-2*pad, r);

        // controls label
        var px = Math.round(size * 0.06);
        var y1 = Math.round(size*0.12);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText("FLIGHT CONTROLS", cx, y + y1);

        px =  Math.round(size * 0.05);

        var ail = 0;
        var ele = 0;
        var rud = 0;
        var thr = 0;
        var flaps = 0;
        if ( typeof json.effectors !== 'undefined' ) {
            var ail = json.effectors.aileron;
            var ele = json.effectors.elevator;
            var rud = json.effectors.rudder;
            var thr = parseFloat(json.effectors.throttle)*100;
            var flaps = json.effectors.flaps;
        }

        y1 = Math.round(size*0.17);
        if ( ail == null ) { ail = 0; }
        var val_text = (ail).toFixed(2);
        ail_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                    px, ail, val_text);

        y1 += vspace;
        if ( ele == null ) { ele = 0; }
        var val_text = (ele).toFixed(2);
        ele_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                    px, ele, val_text);

        y1 += vspace;
        if ( rud == null ) { rud = 0; }
        var val_text = (rud).toFixed(2);
        rud_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                    px, rud, val_text);

        y1 += vspace;
        if ( thr == null ) { thr = 0; }
        var val_text = (thr).toFixed(0) + "%";
        thr_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                    px, thr, val_text);

        y1 += vspace;
        if ( flaps == null ) { flaps = 0; }
        var val_text = (flaps).toFixed(2);
        flaps_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                    px, flaps, val_text);
    }

    var sats_bar = new MyBar("GPS Sats", 0, 25, 5,
                             [[0,5]], [], [[7,25]]);
    var hdop_bar = new MyBar("GPS hdop", 0, 10, 2,
                             [[5,10]], [], [[0,3.5]]);
    var pos_bar = new MyBar("Pos Acc", 0, 10, 2,
                            [[6,10]], [], [[0,4]]);
    var vel_bar = new MyBar("Vel Acc", 0, 1, 0.2,
                            [[0.4,1]], [], [[0,0.2]]);
    var att_bar = new MyBar("Att Acc", 0, 2.5, 0.5,
                            [[1,2.5]], [], [[0,0.5]]);
    var accel_bar = new MyBar("Accel Bias", 0, 2, 0.4,
                              [[1,2]], [], [[0,0.5]]);
    var gyro_bar = new MyBar("Gyro Bias", 0, 2, 0.4,
                             [[1,2]], [], [[0,0.5]]);
    function draw_insgnss( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var pad = Math.round(size * 0.025);
        var ipad = pad * 6;
        var r = Math.round(size * 0.3);
        var h = Math.round(size * 0.03);
        var vspace = Math.round(size * 0.10);

        context.strokeStyle = '#202020';
        context.fillStyle = '#202020';
        myroundRect2(x+pad, y+pad, size-2*pad, size-2*pad, r);

        // controls label
        var px = Math.round(size * 0.06);
        var y1 = Math.round(size*0.12);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText("INS/GNSS", cx, y + y1);

        px =  Math.round(size * 0.04);

        y1 = Math.round(size*0.17);
        var gps_sats = 0;
        var gps_hdop = 0;
        if ( typeof json.sensors.gps !== 'undefined' ) {
            gps_sats = parseInt(json.sensors.gps.num_sats);
            var val_text = gps_sats;
            sats_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                        px, gps_sats, val_text);

            y1 += vspace;
            gps_hdop = parseFloat(json.sensors.gps.hdop);
            var val_text = (gps_hdop).toFixed(2);
            hdop_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                        px, gps_hdop, val_text);
        }

        y1 += vspace;
        var pp0 = parseFloat(json.filters.nav.Pp0);
        var pp1 = parseFloat(json.filters.nav.Pp1);
        var pp2 = parseFloat(json.filters.nav.Pp2);
        var pos_cov = Math.sqrt(pp0*pp0 + pp1*pp1 + pp2*pp2);
        if ( isNaN(pos_cov) ) { pos_cov = 0; }
        var val_text = (pos_cov).toFixed(1) + " m";
        pos_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                      px, pos_cov, val_text);

        y1 += vspace;
        var pv0 = parseFloat(json.filters.nav.Pv0);
        var pv1 = parseFloat(json.filters.nav.Pv1);
        var pv2 = parseFloat(json.filters.nav.Pv2);
        var vel_cov = Math.sqrt(pv0*pv0 + pv1*pv1 + pv2*pv2);
        if ( isNaN(vel_cov) ) { vel_cov = 0; }
        var val_text = (vel_cov).toFixed(2) + " m/s";
        vel_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                      px, vel_cov, val_text);

        y1 += vspace;
        var pa0 = parseFloat(json.filters.nav.Pa0);
        var pa1 = parseFloat(json.filters.nav.Pa1);
        var pa2 = parseFloat(json.filters.nav.Pa2);
        var att_cov = Math.sqrt(pa0*pa0 + pa1*pa1 + pa2*pa2) * r2d;
        if ( isNaN(att_cov) ) { att_cov = 0; }
        var val_text = (att_cov).toFixed(2) + " deg";
        att_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                     px, att_cov, val_text);

        y1 += vspace;
        var ax_bias = Math.abs(parseFloat(json.filters.nav.ax_bias));
        var ay_bias = Math.abs(parseFloat(json.filters.nav.ay_bias));
        var az_bias = Math.abs(parseFloat(json.filters.nav.az_bias));
        var accel_bias = Math.sqrt(ax_bias*ax_bias + ay_bias*ay_bias + az_bias*az_bias);
        if ( json.filters.nav.status < 2 ) {
            accel_bias = 0.0;
        }
        var val_text = (accel_bias).toFixed(2) + " mps2";
        accel_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                     px, accel_bias, val_text);

        y1 += vspace;
        var p_bias = Math.abs(parseFloat(json.filters.nav.p_bias));
        var q_bias = Math.abs(parseFloat(json.filters.nav.q_bias));
        var r_bias = Math.abs(parseFloat(json.filters.nav.r_bias));
        var gyro_bias = Math.sqrt(p_bias*p_bias + q_bias*q_bias + r_bias*r_bias);
        var gyro_bias_deg = gyro_bias * r2d;
        if ( json.filters.nav.status < 2 ) {
            gyro_bias_deg = 0;
        }
        var val_text = (gyro_bias_deg).toFixed(2) + " dps";
        gyro_bar.draw(x + ipad, y + y1, size - 2*ipad, h,
                       px, gyro_bias_deg, val_text);
    }

    function draw_power( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var watts = json.sensors.power.main_watts;
        var max_watts = 500;

        // backplate
        context.drawImage(img_power, x, y, width=size, height=size);

        // watt needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale)
        var nh = Math.floor(img_asi3.height*scale)
        context.translate(cx, cy);
        context.rotate((watts*150/max_watts + 195) * d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();

        var mah = parseFloat(json.sensors.power.total_mah).toFixed(0);
        var battery_total = parseFloat(json.config.specs.battery_mah)
        var remaining = battery_total - mah
        // var battery_percent = ((remaining / battery_total) * 100).toFixed(0)
        var battery_percent = (parseFloat(json.sensors.power.battery_perc) * 100)
        if ( battery_percent < 0 ) {
            battery_percent = 0;
        }

        // battery needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale)
        var nh = Math.floor(img_asi3.height*scale)
        context.translate(cx, cy);
        context.rotate((165 - battery_percent*1.5) * d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();
    }

    var alerts = [];
    var warns = [];
    var oks = [];

    function add_status_message( text, x, ok, warn, alert ) {
        if ( x >= alert ) {
            alerts.push(text);
        } else if ( x >= warn )  {
            warns.push(text);
        } else if ( x >= ok ) {
            oks.push(text);
        }
    }

    function add_status_message_inv( text, x, ok, warn, alert ) {
        if ( x < alert ) {
            alerts.push(text);
        } else if ( x < warn )  {
            warns.push(text);
        } else if ( x < ok ) {
            oks.push(text);
        }
    }

    function draw_status_old( x, y, size ) {
        var px;
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        // background
        //context.drawImage(img_aura_asi1, x, y, width=size, height=size);
        var pad = Math.floor(size * 0.02);
        var r = Math.floor(size * 0.3);
        context.strokeStyle = '#202020';
        context.fillStyle = '#202020';
        myroundRect2(x+pad, y+pad, size-2*pad, size-2*pad, r);

        // 'status' label
        px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText("STATUS", cx, cy - size*0.35);

        alerts = [];
        warns = [];
        oks = [];
        var text;

        // INS/GNS messages

        var pos_cov = parseFloat(json.filters.nav.max_pos_cov)*3;
        if ( json.filters.nav.status < 2 ) {
            pos_cov = 0;
        }
        text = "Pos Acc: " + pos_cov.toFixed(2) + " m";
        add_status_message(text, pos_cov, 4.0, 5, 6.0)

        var vel_cov = parseFloat(json.filters.nav.max_vel_cov)*3;
        if ( json.filters.nav.status < 2 ) {
            vel_cov = 0;
        }
        text = "Vel Acc: " + vel_cov.toFixed(2) + " m/s";
        add_status_message(text, vel_cov, 0.1, 0.2, 0.30);

        var att_cov = parseFloat(json.filters.nav.max_att_cov)*3 * 180.0 / Math.PI;
        if ( json.filters.nav.status < 2 ) {
            att_cov = 0;
        }
        text = "Att Acc: " + att_cov.toFixed(2) + " deg";
        add_status_message(text, att_cov, 0.1, 0.5, 1.0);

        var ax_bias = parseFloat(json.filters.nav.ax_bias);
        var ay_bias = parseFloat(json.filters.nav.ay_bias);
        var az_bias = parseFloat(json.filters.nav.az_bias);
        var accel_bias = Math.sqrt(ax_bias*ax_bias + ay_bias*ay_bias + az_bias*az_bias);
        if ( json.filters.nav.status < 2 ) {
            accel_bias = 0;
        }
        text = "Accel Bias: " + accel_bias.toFixed(2) + " mps2";
        add_status_message(text, accel_bias, 0.1, 0.5, 1.0);

        var p_bias = parseFloat(json.filters.nav.p_bias) * r2d;
        var q_bias = parseFloat(json.filters.nav.q_bias) * r2d;
        var r_bias = parseFloat(json.filters.nav.r_bias) * r2d;
        var gyro_bias = Math.sqrt(p_bias*p_bias + q_bias*q_bias + r_bias*r_bias);
        if ( json.filters.nav.status < 2 ) {
            gyro_bias = 0;
        }
        text = "Gyro Bias: " + gyro_bias.toFixed(2) + " dps";
        add_status_message(text, gyro_bias, 0.1, 0.5, 1.0);

        var imu_temp = 0;
        if ( typeof json.sensors.imu !== 'undefined' ) {
            imu_temp = parseFloat(json.sensors.imu.temp_C);
        }
        text = "IMU Temp: " + (imu_temp).toFixed(0) + "C";
        add_status_message(text, imu_temp, 30, 40, 50);

        // Other system stuff

        var load_avg = parseFloat(json.status.system_load_avg);
        text = "Load Avg: " + (load_avg).toFixed(2);
        add_status_message(text, load_avg, 0.01, 1.8, 2.0);

        var fmu_timer = parseInt(json.status.fmu_timer_misses);
        text = "FMU Timer Err: " + fmu_timer
        add_status_message(text, fmu_timer, 1, 10, 25);

        var air_err = parseInt(json.sensors.airdata.error_count);
        text = "Airdata Err: " + air_err;
        add_status_message(text, air_err, 1, 10, 25);

        // GPS messages
        var gps_sats = 0;
        var gps_hdop = 0;
        if ( typeof json.sensors.gps !== 'undefined' ) {
            gps_sats = parseInt(json.sensors.gps.num_sats);
            text = "GPS sats: " + gps_sats;
            add_status_message_inv(text, gps_sats, 10, 7, 5);

            gps_hdop = parseFloat(json.sensors.gps.hdop);
            text = "GPS hdop: " + (gps_hdop).toFixed(2);
            add_status_message(text, gps_hdop, 1.5, 3.0, 5.0);
        }

        // Power messages
        var av_vcc = parseFloat(json.sensors.power.avionics_vcc);
        var av_error = Math.abs(5.0 - av_vcc);
        text = "Avionics: " + (av_vcc).toFixed(2) + " v";
        add_status_message(text, av_error, 0.025, 0.1, 0.2);

        var cell_vcc = parseFloat(json.sensors.power.cell_vcc);
        text = "Batt Cell: " + (cell_vcc).toFixed(2) + " v";
        add_status_message_inv(text, cell_vcc, 3.7, 3.6, 3.5);

        if ( json.status.in_flight == "True" ) {
            var throttle = parseFloat(json.effectors.throttle);
            text = "Throttle: " + (throttle*100).toFixed() + "%";
            add_status_message(text, throttle, 0.6, 0.75, 0.9);
        }

        // Wind

        if ( json.status.in_flight == "True" ) {
            var wind_kt = parseFloat(json.sensors.airdata.wind_speed_mps)*mps2kt;
            var target_airspeed_kt = parseFloat(json.autopilot.targets.airspeed_kt);
            text = "Wind: " + wind_kt.toFixed(0) + " kt";
            var ratio = 0.0;
            if ( target_airspeed_kt > 0.1 ) {
                ratio = wind_kt / target_airspeed_kt;
            }
            add_status_message(text, ratio, 0.3, 0.5, 0.7);
        }

        var pos = -0.25;

        px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.textAlign = "left";
        //context.shadowOffsetX = 2;
        //context.shadowOffsetY = 2;
        //context.shadowBlur = 3;
        //context.shadowColor = "rgba(255, 255, 255, 0.5)";

        if ( alerts.length == 0 && warns.length == 0 && oks.length == 0 ) {
            oks.push("Status: OK")
        }

        // draw alerts
        context.fillStyle = "red";
        for ( var i = 0; i < alerts.length; i++ ) {
            context.fillText(alerts[i], cx - size * 0.4, cy + size*pos);
            pos += 0.07;
        }

        // draw alerts
        context.fillStyle = "yellow";
        for ( var i = 0; i < warns.length; i++ ) {
            context.fillText(warns[i], cx - size * 0.4, cy + size*pos);
            pos += 0.07;
        }

        // draw oks
        context.fillStyle = '#0C0';
        for ( var i = 0; i < oks.length; i++ ) {
            context.fillText(oks[i], cx - size * 0.4, cy + size*pos);
            pos += 0.07;
        }
    }

    function draw_status2( x, y, size ) {
        var px;
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        // background
        var pad = Math.floor(size * 0.02);
        var r = Math.floor(size * 0.3);
        context.strokeStyle = '#202020';
        context.fillStyle = '#202020';
        myroundRect2(x+pad, y+pad, size-2*pad, size-2*pad, r);

        // 'status' label
        px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText("STATUS", cx, cy - size*0.35);

        var pos = -0.25;

        px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.textAlign = "left";

        if ( json.alerts.alerts != null ) {
            alerts = json.alerts.alerts;
        } else{
            alerts = [""];
        }
        if ( json.alerts.warns != null ) {
            warns = json.alerts.warns;
        } else{
            warns = [""];
        }
        if ( json.alerts.oks != null ) {
            oks = json.alerts.oks;
        } else{
            oks = [""];
        }
        if ( alerts[0] == "" && warns[0] == "" && oks[0] == "" ) {
            oks.push("Status: OK")
        }

        // draw alerts
        context.fillStyle = "red";
        for ( var i = 0; i < alerts.length; i++ ) {
            if ( alerts[i] != "" ) {
                context.fillText(alerts[i], cx - size * 0.4, cy + size*pos);
                pos += 0.07;
            }
        }

        // draw warns
        context.fillStyle = "yellow";
        for ( var i = 0; i < warns.length; i++ ) {
            if ( warns[i] != "" ) {
                context.fillText(warns[i], cx - size * 0.4, cy + size*pos);
                pos += 0.07;
            }
        }

        // draw oks
        context.fillStyle = '#0C0';
        for ( var i = 0; i < oks.length; i++ ) {
            if ( oks[i] != "" ) {
                context.fillText(oks[i], cx - size * 0.4, cy + size*pos);
                pos += 0.07;
            }
        }
    }

    var tc_filt = 0.0;
    function draw_tc( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        // channel
        context.save();
        var nw = Math.floor(img_tc1.width*scale)
        var nh = Math.floor(img_tc1.height*scale)
        context.translate(cx, cy);
        context.drawImage(img_tc1, -nw*0.5, -nh*0.5+(80*scale), width=nw, height=nh);
        context.restore();

        // ball
        var tc = 0.0;
        if ( json.sensors.imu != null ) {
            var ay = json.sensors.imu.ay_mps_sec;
            var az = json.sensors.imu.az_mps_sec;
            var tc = ay / az;
            tc_filt = 0.8 * tc_filt + 0.2 * tc;
        }
        var xpos = tc_filt * -500 * scale;
        context.save();
        var nw = Math.floor(img_tc2.width*scale)
        var nh = Math.floor(img_tc2.height*scale)
        context.translate(cx, cy);
        context.drawImage(img_tc2, -nw*0.5 + xpos, -nh*0.5+(84*scale), width=nw, height=nh);
        context.restore();

        // face plate
        context.drawImage(img_tc3, x, y, width=size, height=size);

        // plane (turn rate)
        r = 0.0;
        if ( json.sensors.imu != null ) {
            r = json.sensors.imu.r_rad_sec * r2d;
        }
        if ( r < -4 ) { r = -4; }
        if ( r > 4 ) { r = 4; }
        context.save();
        var nw = Math.floor(img_tc4.width*scale*0.85)
        var nh = Math.floor(img_tc4.height*scale*0.85)
        context.translate(cx, cy);
        context.rotate(r*10 * d2r);
        context.drawImage(img_tc4, -nw*0.5, -nh*0.5, width=nw, height=nh);
        context.restore();
    }

    var groundtrack_deg = 0.0;
    function draw_dg( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var heading = json.filters.nav.yaw_deg;
        var groundspeed_ms = parseFloat(json.filters.nav.groundspeed_ms);
        if ( groundspeed_ms > 0.25 ) {
            groundtrack_deg = json.filters.nav.groundtrack_deg;
        }
        var ap_hdg = json.autopilot.targets.groundtrack_deg
        var wind_deg = json.sensors.airdata.wind_dir_deg;

        var display_units = json.config.specs.display_units;
        var speed_scale = 1.0;
        if ( display_units == "mps" ) {
            speed_scale = kt2mps;
        } else if ( display_units == "kts" ) {
            speed_scale = 1.0;
        } else {
            // default to mps if not specified
            speed_scale = kt2mps;
        }

        // rose
        context.save();
        var nw = Math.floor(img_hdg1.width*scale)
        var nh = Math.floor(img_hdg1.height*scale)
        context.translate(cx, cy);
        context.rotate(-heading*d2r);
        context.drawImage(img_hdg1, -nw*0.5, -nh*0.5, width=nw, height=nh);
        context.restore();

        // wind vane
        context.save();
        context.strokeStyle = 'lightblue';
        context.lineWidth = 5;
        context.translate(cx, cy);
        var vane_rot = -parseFloat(heading) + parseFloat(wind_deg) + 180;
        context.rotate(vane_rot*d2r);
        context.beginPath();
        context.moveTo(0, size*0.5*0.65);
        context.lineTo(0, -size*0.5*0.65);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.5*0.65);
        context.lineTo(-size*0.03*0.65, -size*0.42*0.65);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.5*0.65);
        context.lineTo(size*0.03*0.65, -size*0.42*0.65);
        context.stroke();
        context.restore();

        // wind label
        var wind_kt = 0;
        if ( json.sensors.airdata.wind_speed_mps != null ) {
            wind_kt = parseFloat(json.sensors.airdata.wind_speed_mps*mps2kt*speed_scale).toFixed(0);
        }
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "lightblue";
        context.textAlign = "center";
        context.fillText("WND:" + wind_kt, cx + size*0.14, cy - size*0.06);

        // ground track
        context.save();
        context.strokeStyle = 'orange';
        context.lineWidth = 5;
        context.translate(cx, cy);
        var track_rot = -parseFloat(heading) + groundtrack_deg;
        context.rotate(track_rot*d2r);
        context.beginPath();
        context.moveTo(0, size*0.5*0.65);
        context.lineTo(0, -size*0.5*0.65);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.5*0.65);
        context.lineTo(-size*0.03*0.65, -size*0.42*0.65);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.5*0.65);
        context.lineTo(size*0.03*0.65, -size*0.42*0.65);
        context.stroke();
        context.restore();

        // groundspeed label
        var track_mps = parseFloat(json.filters.nav.groundspeed_ms);
        var track_speed = (track_mps * mps2kt * speed_scale).toFixed(0);
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "orange";
        context.textAlign = "center";
        context.fillText("GS:" + track_speed, cx - size*0.14, cy - size*0.06);

        // bug
        context.save();
        var nw = Math.floor(img_hdg2.width*scale)
        var nh = Math.floor(img_hdg2.height*scale)
        context.translate(cx, cy);
        var bug_deg = -parseFloat(heading) + parseFloat(ap_hdg);
        context.rotate(bug_deg*d2r);
        context.drawImage(img_hdg2, -nw*0.5, -size*0.5*0.82, width=nw, height=nh);
        context.restore();

        // face plate
        context.drawImage(img_hdg3, x, y, width=size, height=size);
    }

    var vsi_interpx = [ -2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000 ];
    var vsi_interpy = [ -173.5, -131.5, -82, -36, 0, 35, 81, 131, 173 ];
    var climb_filt = 0.0;
    function draw_vsi( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        // face plate
        context.drawImage(img_vsi1, x, y, width=size, height=size);

        var climb_fpm = json.velocity.pressure_vertical_speed_fps * 60;
        climb_filt = 0.95 * climb_filt + 0.05 * climb_fpm;
        var needle_rot = my_interp(climb_filt, vsi_interpx, vsi_interpy) - 90;
        // needle
        context.save();
        var nw = Math.floor(img_alt5.width*scale)
        var nh = Math.floor(img_alt5.height*scale)
        context.translate(cx, cy);
        context.rotate(needle_rot*d2r);
        context.drawImage(img_alt5, -nw*0.5, -nh*0.85, width=nw, height=nh);
        context.restore();
    }

    return {
        init : init,
        draw : draw,
    }
}();
