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
        asi : {draw: draw_asi},
        ati : {draw: draw_ati},
        alt : {draw: draw_alt},
        amp : {draw: draw_amp},
        power : {draw: draw_power2},
        // tc : {draw: draw_tc},
        status : {draw: draw_status},
        dg : {draw: draw_dg},
        vsi : {draw: draw_vsi},
    };

    var layout_config = {
        horizontal : {
            instruments : [['vcc', 'asi', 'ati', 'alt'],
                           ['power', 'status', 'dg', 'vsi']]
        },
        vertical : {
            instruments : [['vcc', 'power'],
                           ['asi', 'ati'],
                           ['alt', 'status'],
                           ['dg', 'vsi']]
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
        context.restore(); 

        // yellow arc
        context.beginPath();
        context.arc(cx, cy, size*0.422, caution_rad, max_rad)
        context.strokeStyle = 'yellow';
        context.lineWidth = 15;
        context.stroke();
        context.restore();
        
        // red arc
        context.beginPath();
        context.arc(cx, cy, size*0.430, max_rad, die_rad)
        context.strokeStyle = 'red';
        context.lineWidth = 10;
        context.stroke();
        context.restore();
        
        // tics
        context.drawImage(img_aura_asi2, x, y, width=size, height=size);

        // units label
        context.save()
        var px = Math.round(size * 0.07);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(display_units.toUpperCase(), cx, cy + size*0.13);
        context.restore();
        
        // 'true' label
        context.save()
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "orange";
        context.textAlign = "center";
        context.fillText("(TRUE)", cx, cy + size*0.21);
        context.restore();
        
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
        var ps = json.filters.wind.pitot_scale_factor;
        var true_kt = json.velocity.airspeed_smoothed_kt*speed_scale * ps;
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
            speed = json.velocity.airspeed_smoothed_kt;
        } else {
            speed = json.filters.filter[0].groundspeed_kt;
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

        var roll = json.filters.filter[0].roll_deg;
        var pitch = json.filters.filter[0].pitch_deg;
        
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
        var alt_ft = json.filters.filter[0].altitude_m / 0.3048;
        var ground_ft = json.position.altitude_ground_m / 0.3048;
        var target_ft = json.autopilot.targets.altitude_msl_ft;

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
        context.strokeStyle = 'red';
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
        radius = Math.min(Math.max(width-1,1),Math.max(height-1,1),radius);
        var rectX = x;
        var rectY = y;
        var rectWidth = width;
        var rectHeight = height;
        var cornerRadius = radius;

        context.lineJoin = "round";
        context.lineWidth = cornerRadius;
        context.strokeRect(rectX+(cornerRadius/2), rectY+(cornerRadius/2), rectWidth-cornerRadius, rectHeight-cornerRadius);
        context.fillRect(rectX+(cornerRadius/2), rectY+(cornerRadius/2), rectWidth-cornerRadius, rectHeight-cornerRadius);
        //context.stroke();
        //context.fill();
    }

    function draw_bar(x, y, w, h, px, val, text1, text2, minv, maxv, tics, reds, yellows, greens) {
        context.save();
        context.lineWidth = h;
        var range = maxv - minv;
        context.strokeStyle = 'red';
        for ( var i = 0; i < reds.length; i++ ) {
            var x1 = ((reds[i][0] - minv) / range) * w;
            var x2 = ((reds[i][1] - minv) / range) * w;
            context.beginPath();
            context.moveTo(x+x1, y + Math.round(h*0.5));
            context.lineTo(x+x2, y + Math.round(h*0.5));
            context.stroke();
        }
        context.strokeStyle = 'yellow';
        for ( var i = 0; i < yellows.length; i++ ) {
            var x1 = ((yellows[i][0] - minv) / range) * w;
            var x2 = ((yellows[i][1] - minv) / range) * w;
            context.beginPath();
            context.moveTo(x+x1, y + Math.round(h*0.5));
            context.lineTo(x+x2, y + Math.round(h*0.5));
            context.stroke();
        }
        context.strokeStyle = '#0C0';
        for ( var i = 0; i < greens.length; i++ ) {
            var x1 = ((greens[i][0] - minv) / range) * w;
            var x2 = ((greens[i][1] - minv) / range) * w;
            context.beginPath();
            context.moveTo(x+x1, y + Math.round(h*0.5));
            context.lineTo(x+x2, y + Math.round(h*0.5));
            context.stroke();
        }
        context.strokeStyle = "black";
        context.lineWidth = 1;
        for ( var xt = minv+tics; xt < maxv; xt += tics ) {
            var x1 = ((xt - minv) / range) * w;
            context.beginPath();
            context.moveTo(x+x1, y);
            context.lineTo(x+x1, y + Math.round(h*0.5));
            context.stroke();
        }
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "left";
        context.fillText(text1, x, y + Math.round(2.2*h));
        context.textAlign = "right";
        context.fillText(text2, x + w, y + Math.round(2.2*h));
        context.beginPath();
        var x1 = ((val - minv) / range) * w
        var y1 = Math.round(h*0.5);
        context.lineWidth = 1;
        context.strokeStyle = 'black';
        context.fillStyle = 'white';
        context.moveTo(x+x1, y + y1);
        context.lineTo(x+x1-y1, y+y1-y1*Math.sqrt(3));
        context.lineTo(x+x1+y1, y+y1-y1*Math.sqrt(3));
        context.stroke();
        context.fill();
        context.restore();
    }
    
    function draw_power2( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var pad = Math.round(size * 0.02);
        var r = Math.round(size * 0.5);
        var px =  Math.round(size * 0.06);
        context.save();
        context.strokeStyle = '#202020';
        context.fillStyle = '#202020';
        myroundRect2(x+pad, y+pad, size-2*pad, size-2*pad, r);
        context.restore();

        var y1 = Math.round(size*0.18);
        var vcc = json.sensors.power.avionics_vcc;
        var val_text = (vcc).toFixed(2) + "V";
        draw_bar(x + 4*pad, y + y1, size - 8*pad, Math.round(size * 0.05),
                 px, vcc, "Avionics Voltage", val_text,
                 4.5, 5.5, 0.1,
                 [[4.5,4.8], [5.3,5.5]], [[4.8,4.9], [5.2,5.3]], [[4.9,5.2]]);
        
        y1 += Math.round(size*0.18);
        var cell_volts = json.sensors.power.cell_vcc;
        var val_text = (cell_volts).toFixed(2) + "V";
        draw_bar(x + 4*pad, y + y1, size - 8*pad, Math.round(size * 0.05),
                 px, cell_volts, "Per Cell Voltage", val_text,
                 3.0, 4.2, 0.1,
                 [[3.0,3.3]], [[3.3,3.5]], [[3.5,4.2]]);
        
        var mah = parseFloat(json.sensors.power.total_mah).toFixed(0);
        var battery_total = parseFloat(json.config.specs.battery_mah)
        var remaining = battery_total - mah
        // var battery_percent = ((remaining / battery_total) * 100).toFixed(0)
        var battery_percent = parseFloat(json.sensors.power.battery_perc)*100
        if ( battery_percent < 0 ) {
            battery_percent = 0;
        }
        y1 += Math.round(size*0.18);
        var val_text = (battery_percent).toFixed(0) + "%";
        draw_bar(x + 4*pad, y + y1, size - 8*pad, Math.round(size * 0.05),
                 px, battery_percent, "Battery Capacity", val_text,
                 0.0, 100, 10,
                 [[0,10]], [[10,25]], [[25,100]]);

        y1 += Math.round(size*0.18);
        var watts = json.sensors.power.main_watts;
        var val_text = (watts).toFixed(0) + "W";
        draw_bar(x + 4*pad, y + y1, size - 8*pad, Math.round(size * 0.05),
                 px, cell_volts, "Current Draw", val_text,
                 0, 500, 100,
                 [[350,500]], [[200,350]], [[0,200]]);
        
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
    
    function draw_status( x, y, size ) {
        var px;
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;
        
        // background
        //context.drawImage(img_aura_asi1, x, y, width=size, height=size);
        var pad = Math.floor(size * 0.02);
        var r = Math.floor(size * 0.5);
        context.save();
        context.strokeStyle = '#202020';
        context.fillStyle = '#202020';
        myroundRect2(x+pad, y+pad, size-2*pad, size-2*pad, r);
        context.restore();
        
        
        // 'true' label
        context.save()
        px = Math.round(size * 0.07);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText("STATUS", cx, cy - size*0.35);
        context.restore();

        alerts = [];
        warns = [];
        oks = [];
        var text;

        // EKF messages
        
        var pos_cov = parseFloat(json.filters.filter[0].max_pos_cov)*3;
        if ( json.filters.filter[0].status < 2 ) {
            pos_cov = 99.99;
        }
        text = "Pos Acc: " + pos_cov.toFixed(2) + " m";
        add_status_message(text, pos_cov, 2.0, 3.5, 5.0)

        var vel_cov = parseFloat(json.filters.filter[0].max_vel_cov)*3;
        if ( json.filters.filter[0].status < 2 ) {
            vel_cov = 99.99;
        }
        text = "Vel Acc: " + vel_cov.toFixed(2) + " m/s";
        add_status_message(text, vel_cov, 0.1, 0.2, 0.30);

        var att_cov = parseFloat(json.filters.filter[0].max_att_cov)*3 * 180.0 / Math.PI;
        if ( json.filters.filter[0].status < 2 ) {
            att_cov = 99.99;
        }            
        text = "Att Acc: " + att_cov.toFixed(2) + " deg";
        add_status_message(text, att_cov, 0.1, 0.5, 1.0);

        var ax_bias = parseFloat(json.filters.filter[0].ax_bias);
        var ay_bias = parseFloat(json.filters.filter[0].ay_bias);
        var az_bias = parseFloat(json.filters.filter[0].az_bias);
        var accel_bias = ax_bias;
        if ( ay_bias > accel_bias ) { accel_bias = ay_bias; }
        if ( az_bias > accel_bias ) { accel_bias = az_bias; }
        if ( json.filters.filter[0].status < 2 ) {
            accel_bias = 99.99;
        }            
        text = "Accel Bias: " + accel_bias.toFixed(2) + " m/s^2";
        add_status_message(text, accel_bias, 0.1, 0.5, 1.0);

        var p_bias = parseFloat(json.filters.filter[0].p_bias) * r2d;
        var q_bias = parseFloat(json.filters.filter[0].q_bias) * r2d;
        var r_bias = parseFloat(json.filters.filter[0].r_bias) * r2d;
        var gyro_bias = p_bias;
        if ( q_bias > gyro_bias ) { gyro_bias = p_bias; }
        if ( r_bias > gyro_bias ) { gyro_bias = q_bias; }
        var gyro_bias_deg = gyro_bias*180/Math.PI;
        if ( json.filters.filter[0].status < 2 ) {
            gyro_bias_deg = 99.99;
        }
        text = "Gyro Bias: " + gyro_bias_deg.toFixed(2) + " dps";
        add_status_message(text, gyro_bias_deg, 0.1, 0.5, 1.0);

        var imu_temp = parseFloat(json.sensors.imu[0].temp_C);
        text = "IMU Temp: " + (imu_temp).toFixed(0) + "C";
        add_status_message(text, imu_temp, 30, 40, 50);
        
        // Other system stuff
        
        var load_avg = parseFloat(json.status.system_load_avg);
        text = "Load Avg: " + (load_avg).toFixed(2);
        add_status_message(text, load_avg, 0.01, 1.8, 2.0);

        var fmu_timer = parseInt(json.status.fmu_timer_misses);
        text = "FMU Timer Err: " + fmu_timer
        add_status_message(text, fmu_timer, 1, 10, 25);

        var air_err = parseInt(json.sensors.airdata[0].error_count);
        text = "Airdata Err: " + air_err;
        add_status_message(text, air_err, 1, 10, 25);

        // GPS messages
        
        var gps_sats = parseInt(json.sensors.gps[0].satellites);
        text = "GPS sats: " + gps_sats;
        add_status_message_inv(text, gps_sats, 10, 7, 5);
        
        var gps_pdop = parseFloat(json.sensors.gps[0].pdop);
        text = "GPS pdop: " + (gps_pdop).toFixed(2);
        add_status_message(text, gps_pdop, 1.5, 3.0, 5.0);

        // Power messages
        
        var av_vcc = parseFloat(json.sensors.power.avionics_vcc);
        var av_error = Math.abs(5.0 - av_vcc);
        text = "Avionics: " + (av_vcc).toFixed(2) + " v";
        add_status_message(text, av_error, 0.025, 0.1, 0.2);
        
        var cell_vcc = parseFloat(json.sensors.power.cell_vcc);
        text = "Batt Cell: " + (cell_vcc).toFixed(2) + " v";
        add_status_message_inv(text, cell_vcc, 3.7, 3.6, 3.5);

        if ( json.status.in_flight == "True" ) {
            var throttle = parseFloat(json.actuators.throttle);
            text = "Throttle: " + (throttle*100).toFixed() + "%";
            add_status_message(text, throttle, 0.6, 0.75, 0.9);
        }

        // Wind
        
        if ( json.status.in_flight == "True" ) {
            var wind_kt = parseFloat(json.filters.wind.wind_speed_kt);
            var target_airspeed_kt = parseFloat(json.autopilot.targets.airspeed_kt);
            text = "Wind: " + wind_kt.toFixed(0) + " kt";
            var ratio = 0.0;
            if ( target_airspeed_kt > 0.1 ) {
                ratio = wind_kt / target_airspeed_kt;
            }
            add_status_message(text, ratio, 0.3, 0.5, 0.7);
        }

        var pos = -0.25;
        
        context.save()
        px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.textAlign = "left";
	context.shadowOffsetX = 2;
	context.shadowOffsetY = 2;
	context.shadowBlur = 3;
	context.shadowColor = "rgba(255, 255, 255, 0.5)";
        
        // draw alerts
        context.fillStyle = "red";
        for ( var i = 0; i < alerts.length; i++ ) {
            context.fillText(alerts[i], cx - size * 0.35, cy + size*pos);
            pos += 0.07;
        }
        
        // draw alerts
        context.fillStyle = "yellow";
        for ( var i = 0; i < warns.length; i++ ) {
            context.fillText(warns[i], cx - size * 0.35, cy + size*pos);
            pos += 0.07;
        }
        
        // draw oks
        context.fillStyle = '#0C0';
        for ( var i = 0; i < oks.length; i++ ) {
            context.fillText(oks[i], cx - size * 0.35, cy + size*pos);
            pos += 0.07;
        }
        
        context.restore();
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
        if ( json.sensors.imu[0] != null ) {
            var ay = json.sensors.imu[0].ay_mps_sec;
            var az = json.sensors.imu[0].az_mps_sec;
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
        if ( json.sensors.imu[0] != null ) {
            r = json.sensors.imu[0].r_rad_sec * r2d;
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

        var heading = json.filters.filter[0].heading_deg;
        var groundspeed_ms = parseFloat(json.filters.filter[0].groundspeed_ms);
        if ( groundspeed_ms > 0.25 ) {
            groundtrack_deg = json.filters.filter[0].groundtrack_deg;
        }
        var ap_hdg = json.autopilot.targets.groundtrack_deg
        var wind_deg = json.filters.wind.wind_dir_deg;
        
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
        context.save()
        var wind_kt = 0;
        if ( json.filters.wind.wind_speed_kt != null ) {
            wind_kt = parseFloat(json.filters.wind.wind_speed_kt*speed_scale).toFixed(0);
        }
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "lightblue";
        context.textAlign = "center";
        context.fillText("WND:" + wind_kt, cx + size*0.14, cy - size*0.06);
        context.restore();
 
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
        context.save()
        var track_mps = parseFloat(json.filters.filter[0].groundspeed_ms);
        var track_speed = (track_mps * mps2kt * speed_scale).toFixed(0);
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "orange";
        context.textAlign = "center";
        context.fillText("GS:" + track_speed, cx - size*0.14, cy - size*0.06);
        context.restore();
        
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
