var d2r = Math.PI / 180;
var r2d = 180 / Math.PI;
var mps2kt = 1.9438444924406046432;

var panel = function() {
    var canvas;
    var context;
    var options;
    var opacity = 1;

    var img_volts = new Image();
    var img_res3_asi = new Image();
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
    var img_amp = new Image();
    var img_tc1 = new Image();
    var img_tc2 = new Image();
    var img_tc3 = new Image();
    var img_tc4 = new Image();
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
        tc : {draw: draw_tc},
        dg : {draw: draw_dg},
        vsi : {draw: draw_vsi},
    };

    var layout_config = {
        horizontal : {
            instruments : [['vcc', 'asi', 'ati', 'alt'],
                           ['amp', 'tc', 'dg', 'vsi']]
        },
        vertical : {
            instruments : [['vcc', 'amp'],
                           ['asi', 'ati'],
                           ['alt', 'tc'],
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
        img_res3_asi.src = 'textures/res3-asi.png';
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
        img_amp.src = 'textures/amps.png';
        img_tc1.src = 'textures/tc1.png';
        img_tc2.src = 'textures/tc2.png';
        img_tc3.src = 'textures/tc3.png';
        img_tc4.src = 'textures/tc4.png';
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
        var vcc = json.sensors.APM2.board_vcc;
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
        var cell_volts = json.sensors.APM2.extern_cell_volt;
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
        
        // background
        context.drawImage(img_res3_asi, x, y, width=size, height=size);

        // 'true' label
        context.save()
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "orange";
        context.textAlign = "center";
        context.fillText("(TRUE)", cx, cy + size*0.25);
        context.restore();
        
        // bug
        context.save();
        var nw = Math.floor(img_hdg2.width*scale)
        var nh = Math.floor(img_hdg2.height*scale)
        context.translate(cx, cy);
        var deg = my_interp( json.autopilot.targets.airspeed_kt,
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
        var true_kt = json.velocity.airspeed_smoothed_kt * ps;
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
        var deg = my_interp( json.velocity.airspeed_smoothed_kt,
                             asi_interpx, asi_interpy);
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

        var alt_ft = json.position.combined.altitude_true_m / 0.3048;
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

        var amps = json.sensors.extern_amps;
        
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
        var ay = json.sensors.imu[0].ay_mps_sec;
        var az = json.sensors.imu[0].az_mps_sec;
        var tc = ay / az;
        var xpos = tc * -500 * scale;
        context.save();
        var nw = Math.floor(img_tc2.width*scale)
        var nh = Math.floor(img_tc2.height*scale)
        context.translate(cx, cy);
        context.drawImage(img_tc2, -nw*0.5 + xpos, -nh*0.5+(84*scale), width=nw, height=nh);
        context.restore();

        // face plate
        context.drawImage(img_tc3, x, y, width=size, height=size);
        
        // plane (turn rate)
        r = json.sensors.imu[0].r_rad_sec * r2d;
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

    function draw_dg( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;

        var heading = json.filters.filter[0].heading_deg;
        var groundtrack = json.filters.filter[0].groundtrack_deg;
        var ap_hdg = json.autopilot.targets.groundtrack_deg
        var wind_deg = json.filters.wind.wind_dir_deg;
        
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
        var wind_kt = parseFloat(json.filters.wind.wind_speed_kt).toFixed(0);
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
        var track_rot = -parseFloat(heading) + parseFloat(groundtrack);
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
        var track_mps = parseFloat(json.filters.filter[0].speed_ms);
        var track_kt = (track_mps * mps2kt).toFixed(0);
        var px = Math.round(size * 0.06);
        context.font = px + "px Courier New, monospace";
        context.fillStyle = "orange";
        context.textAlign = "center";
        context.fillText("GS:" + track_kt, cx - size*0.14, cy - size*0.06);
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
    function draw_vsi( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;
        
        // face plate
        context.drawImage(img_vsi1, x, y, width=size, height=size);

        var climb_fpm = json.velocity.pressure_vertical_speed_fps * 60;
        var needle_rot = my_interp(climb_fpm, vsi_interpx, vsi_interpy) - 90;
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
