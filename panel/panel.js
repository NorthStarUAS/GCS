var d2r = Math.PI / 180;
var r2d = 180 / Math.PI;

var panel = function() {
    var canvas;
    var context;
    var hdgLayer, vsiLayer, tcLayer, vccLayer, mvLayer;
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
    var img_hdg2 = new Image();
    
    var instrument_config = {
        avionics_vcc : {draw: draw_vcc},
        asi : {draw: draw_asi},
        ati : {draw: draw_ati},
        alt : {draw: draw_alt},
        amp : {draw: draw_amp},
        tc : {draw: draw_tc},
        dg : {build: build_heading},
        vsi : {build: build_vsi},
        main_volts : {draw: draw_main_volts},
    };

    var layout_config = {
        horizontal : {
            instruments : [['avionics_vcc', 'asi', 'ati', 'alt'], ['amp', 'tc', 'dg', 'vsi']]
        },
        vertical : {
            instruments : [['avionics_vcc', 'amp'], ['asi', 'ati'], ['alt', 'tc'], ['dg', 'vsi']]
        },
        mini : {
            instruments : [['ati', '', '', '', '', '', '', '', '', 'dg'],
                           ['asi', '', '', '', '', '', '', '', '', 'alt'],
                           ['tc', '', '', '', '', '', '', '', '', 'vsi']]
        }
    };

    function resizeCanvas() {
        canvas.width = window.innerWidth - 30;
        canvas.height = window.innerHeight - 30;
        // redraw stuff
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
        img_hdg2.src = 'textures/hdg2.png';
        
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
	 	    } else {
                        draw_main_volts(pos_x, pos_y, size);
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
        var nw = Math.floor(img_asi3.width*scale*0.85)
        var nh = Math.floor(img_asi3.height*scale*0.85)
        context.translate(cx, cy);
        var vcc = json.sensors.APM2.board_vcc;
        if (vcc < 4.45) { vcc = 4.45; }
        if (vcc > 5.55) { vcc = 5.55; }
        var deg = (vcc - 5.0) * 150.0;
        context.rotate(deg*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh, width=nw, height=nh);
        context.restore();
        
        // volts needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale*0.85)
        var nh = Math.floor(img_asi3.height*scale*0.85)
        context.translate(cx, cy);
        var cell_volts = json.sensors.APM2.extern_cell_volt;
        if (cell_volts < 2.95) { cell_volts = 2.95; }
        if (cell_volts > 4.25) { cell_volts = 4.25; }
        var deg = ((3.6 - cell_volts) * 75.0 / 0.6) + 180.0;
        context.rotate(deg*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh, width=nw, height=nh);
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
        
        // bug
        context.save();
        var nw = Math.floor(img_hdg2.width*scale*0.85)
        var nh = Math.floor(img_hdg2.height*scale*0.85)
        context.translate(cx, cy);
        var deg = my_interp( json.autopilot.targets.airspeed_kt,
                             asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.drawImage(img_hdg2, -nw*0.5, -size*0.5*0.95, width=nw, height=nh);
        context.restore();

        // true airspeed needle
        context.save();
        context.strokeStyle = 'orange';
        context.lineWidth = 3;
        var nw = Math.floor(img_asi3.width*scale*0.85)
        var nh = Math.floor(img_asi3.height*scale*0.85)
        context.translate(cx, cy);
        var ps = json.filters.wind.pitot_scale_factor;
        var true_kt = json.velocity.airspeed_smoothed_kt * ps;
        var deg = my_interp( true_kt, asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.beginPath();
        context.moveTo(0, -size*0.1*0.85);
        context.lineTo(0, -size*0.5*0.85);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.5*0.85);
        context.lineTo(-size*0.03*0.85, -size*0.42*0.85);
        context.stroke();
        context.beginPath();
        context.moveTo(0, -size*0.5*0.85);
        context.lineTo(size*0.03*0.85, -size*0.42*0.85);
        context.stroke();
        context.restore();

        // airspeed needle
        context.save();
        var nw = Math.floor(img_asi3.width*scale*0.85)
        var nh = Math.floor(img_asi3.height*scale*0.85)
        context.translate(cx, cy);
        var deg = my_interp( json.velocity.airspeed_smoothed_kt,
                             asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh, width=nw, height=nh);
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
        
        // kollsman
        context.save();
        var nw = Math.floor(img_alt1.width*scale)
        var nh = Math.floor(img_alt1.height*scale)
        context.translate(cx, cy);
        context.drawImage(img_alt1, -nw*0.5, -nh*0.5, width=(size*0.75), height=(size*0.75));
        context.restore();

        // backplate
        context.drawImage(img_alt2, x, y, width=size, height=size);

        // bug
        context.save();
        var nw = Math.floor(img_hdg2.width*scale*0.85)
        var nh = Math.floor(img_hdg2.height*scale*0.85)
        context.translate(cx, cy);
        context.rotate((alt_ft*0.36)*d2r);
        context.drawImage(img_hdg2, -nw*0.5, -size*0.5*0.85, width=nw, height=nh);
        context.restore();

        // needle 10k ft
        context.save();
        var nw = Math.floor(img_alt3.width*scale*0.85)
        var nh = Math.floor(img_alt3.height*scale*0.85)
        context.translate(cx, cy);
        context.rotate((alt_ft*0.0036)*d2r);
        context.drawImage(img_alt3, -nw*0.5, -nh*0.5, width=nw, height=nh);
        context.restore();

        // needle 1k ft
        context.save();
        var nw = Math.floor(img_alt4.width*scale*0.85)
        var nh = Math.floor(img_alt4.height*scale*0.85)
        context.translate(cx, cy);
        context.rotate((alt_ft*0.036)*d2r);
        context.drawImage(img_alt4, -nw*0.5, -nh, width=nw, height=nh);
        context.restore();

        // needle 100 ft
        context.save();
        var nw = Math.floor(img_alt5.width*scale*0.85)
        var nh = Math.floor(img_alt5.height*scale*0.85)
        context.translate(cx, cy);
        context.rotate((alt_ft*0.36)*d2r);
        context.drawImage(img_alt5, -nw*0.5, -nh, width=nw, height=nh);
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
        var nw = Math.floor(img_asi3.width*scale*0.85)
        var nh = Math.floor(img_asi3.height*scale*0.85)
        context.translate(cx, cy);
        context.rotate((amps * 340 / 50.0) * d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh, width=nw, height=nh);
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

        // bezel
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
 
        // var tc4_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        // tc4_style.externalGraphic = url_prefix + "textures/tc4.png";
        // tc4_style.graphicWidth = size * 0.625;
        // tc4_style.graphicHeight = size * 0.171875;
        // tc4_style.graphicOpacity = opacity;
        // var tc4 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, tc4_style );
        // tc4.fid = "plane";
        // tcLayer.addFeatures(tc4);
        // tc4.move(pos);
    }

    function build_heading( x, y, size ) {
        hdgLayer.clear();

        var pos = new ol.geom.Point(x, y);

        var hdg1_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        hdg1_style.externalGraphic = url_prefix + "textures/hdg1.png";
        hdg1_style.graphicWidth = size;
        hdg1_style.graphicHeight = size;
        hdg1_style.graphicOpacity = opacity;
        var hdg1 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, hdg1_style );
        hdg1.fid = "rose";
        hdgLayer.addFeatures(hdg1);
        hdg1.move(pos);

        var hdgwv_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        hdgwv_style.graphicName = "pointer";
        hdgwv_style.pointRadius = size * 0.22;
        hdgwv_style.strokeColor = "lightblue";
        hdgwv_style.strokeWidth = 4;
        hdgwv_style.strokeOpacity = 0.9;
        hdgwv_style.fillColor = "lightblue";
        hdgwv_style.fillOpacity = 0.6;
        hdgwv_style.label = "WND";
        hdgwv_style.fontFamily = "Courier New, monospace";
        hdgwv_style.fontColor = "lightblue";
        hdgwv_style.fontWeight = "bold";
        hdgwv_style.labelAlign = "lm";
        hdgwv_style.labelXOffset = 20;
        hdgwv_style.labelYOffset = 20;
        var hdgwv = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, hdgwv_style );
        hdgwv.fid = "windvane";
        hdgLayer.addFeatures(hdgwv);
        hdgwv.move(pos);

        var hdggt_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        hdggt_style.graphicName = "pointer";
        hdggt_style.pointRadius = size * 0.32;
        hdggt_style.strokeColor = "orange";
        hdggt_style.strokeWidth = 4;
        hdggt_style.strokeOpacity = 0.9;
        hdggt_style.fillColor = "orange";
        hdggt_style.fillOpacity = 0.6;
        hdggt_style.label = "GND";
        hdggt_style.fontFamily = "Courier New, monospace";
        hdggt_style.fontColor = "orange";
        hdggt_style.fontWeight = "bold";
        hdggt_style.labelAlign = "rm";
        hdggt_style.labelXOffset = -20;
        hdggt_style.labelYOffset = 20;
        var hdggt = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, hdggt_style );
        hdggt.fid = "track";
        hdgLayer.addFeatures(hdggt);
        hdggt.move(pos);

        var hdg2_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        hdg2_style.externalGraphic = url_prefix + "textures/hdg2.png";
        hdg2_style.graphicWidth = size * 0.09375;
        hdg2_style.graphicHeight = size * 0.09375;
        hdg2_style.graphicYOffset = -hdg2_style.graphicHeight * 0.5
            - size * 0.37109375;
        hdg2_style.graphicOpacity = opacity;
        var hdg2 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, hdg2_style );
        hdg2.fid = "bug";
        hdgLayer.addFeatures(hdg2);
        hdg2.move(pos);

        var hdg3_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        hdg3_style.externalGraphic = url_prefix + "textures/hdg3.png";
        hdg3_style.graphicWidth = size;
        hdg3_style.graphicHeight = size;
        hdg3_style.graphicOpacity = opacity;
        var hdg3 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, hdg3_style );
        hdgLayer.addFeatures(hdg3);
        hdg3.move(pos);
    }

    function build_vsi( x, y, size ) {
        vsiLayer.clear();

        var pos = new ol.geom.Point(x, y);

        var vsi1_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        vsi1_style.externalGraphic = url_prefix + "textures/vsi1.png";
        vsi1_style.graphicWidth = size;
        vsi1_style.graphicHeight = size;
        vsi1_style.graphicOpacity = opacity;
        var vsi1 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, vsi1_style );
        vsiLayer.addFeatures(vsi1);
        vsi1.move(pos);

        var vsi2_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        vsi2_style.externalGraphic = url_prefix + "textures/alt5.png";
        vsi2_style.graphicWidth = size * 0.1171875;
        vsi2_style.graphicHeight = size * 0.4296875;
        vsi2_style.graphicYOffset = -vsi2_style.graphicHeight * 0.5
            - size * 0.1035;
        vsi2_style.graphicOpacity = opacity;
        var vsi2 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, vsi2_style );
        vsi2.fid = "needle";
        vsiLayer.addFeatures(vsi2);
        vsi2.move(pos);

        var vsi3_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        vsi3_style.externalGraphic = url_prefix + "textures/hdg2.png";
        vsi3_style.graphicWidth = size * 0.09375;
        vsi3_style.graphicHeight = size * 0.09375;
        vsi3_style.graphicYOffset = -vsi3_style.graphicHeight * 0.5
            - size * 0.37109375;
        vsi3_style.graphicOpacity = opacity;
        var pos3 = new ol.geom.Point(x, y);
        var vsi3 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, vsi3_style );
        vsi3.fid = "bug";
        vsiLayer.addFeatures(vsi3);
        vsi3.move(pos);
    }

    function draw_main_volts( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;
        context.drawImage(img_volts, x, y, width=size, height=size);
        context.save();
        var nw = Math.floor(img_asi3.width*scale*0.85)
        var nh = Math.floor(img_asi3.height*scale*0.85)
        context.translate(cx, cy);
        context.rotate(8*json.status.frame_time*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh, width=nw, height=nh);
        context.restore();
    }

    function update_json( data ) {
        var size = map.getSize();
        map.setCenter( new OpenLayers.LonLat( size.x * 0.5, size.y * 0.5 ) );

        update_hud_speed( data.airspeed, data.ap_speed, data.pitot_scale );
        update_hud_alt( data.alt_true, data.ap_altitude );

        update_ati( data.filter_phi, data.filter_theta );
        update_altimeter( data.alt_true, data.ap_altitude );
        update_heading( data.filter_psi, data.filter_track, data.ap_hdg, data.wind_deg, data.wind_kts, data.filter_speed );
        update_vsi( data.airdata_climb, data.ap_climb );
        update_tc( data.imu_ay, data.imu_az, data.imu_r );
        update_main_volts( data.main_volts );
    }

    function update_heading( hdg_deg, track_deg, bug_deg, wind_deg, wind_speed, track_speed ) {
	if (!instrument_config.dg['active'])
	    return;

        var rose = hdgLayer.getFeatureByFid("rose");
        rose.style.rotation = -hdg_deg;

        var offset = (hdg_deg - track_deg)*0;
        var bug = hdgLayer.getFeatureByFid("bug");
        bug.style.rotation = -parseFloat(hdg_deg) + parseFloat(bug_deg) + offset;

        var windvane = hdgLayer.getFeatureByFid("windvane");
        var vane_rot = -parseFloat(hdg_deg) + parseFloat(wind_deg) + 180;
        var vane_kt = parseFloat(wind_speed).toFixed(0);
        windvane.style.rotation = vane_rot;
        windvane.style.label = 'WS: ' + vane_kt + 'kt';

        var track = hdgLayer.getFeatureByFid("track");
        var track_rot = -parseFloat(hdg_deg) + parseFloat(track_deg);
        var track_kt = parseFloat(track_speed).toFixed(0);
        track.style.rotation = track_rot;
        track.style.label = 'GS: ' + track_kt + 'kt';

        hdgLayer.redraw();
    }

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

    var vsi_interpx = [ -2000,  -1500,  -1000, -500,  0, 500,  1000, 1500,  2000 ];
    var vsi_interpy = [ -173.5, -131.5, -82, -36, 0, 35, 81, 131, 173 ];
    function update_vsi( climb_fpm, target_fps ) {
	if (!instrument_config.vsi['active'])
	    return;

        var needle = vsiLayer.getFeatureByFid("needle");
        needle.style.rotation
            = my_interp(climb_fpm, vsi_interpx, vsi_interpy) - 90;

        var bug = vsiLayer.getFeatureByFid("bug");
        bug.style.rotation
            = my_interp(target_fps*60, vsi_interpx, vsi_interpy) - 90;

        vsiLayer.redraw();
    }

    var filt_rot = 0;
    function update_tc( ay, az, r ) {
	if (!instrument_config.tc['active'])
	    return;

        var tc = ay / az;
        var ball = tcLayer.getFeatureByFid("ball");
        var ypx = Math.abs(tc) * 13 * 0;
        var xpx = tc * -108;

        var bx = ball.basex + ball.mysize * (xpx / 512);
        var by = ball.basey + ball.mysize * (ypx / 512);

        var pos = new ol.geom.Point(bx, by);
        ball.move(pos);

        var plane = tcLayer.getFeatureByFid("plane");
        var rot = r;
        if ( rot < -2.5 ) { rot = -2.5; }
        if ( rot > 2.5 ) { rot = 2.5; }
        filt_rot = 0.9 * filt_rot + 0.1 * rot;
        plane.style.rotation = filt_rot * 10;

        tcLayer.redraw();
    }

    var min_volts = 9.0;
    var filt_volts = min_volts;
    function update_main_volts( volts ) {
        if (!instrument_config.main_volts['active'])
	    return;

        filt_volts = 0.9 * filt_volts + 0.1 * volts;

        var needle = mvLayer.getFeatureByFid("needle");
        needle.style.rotation = (filt_volts-min_volts) * 340.0 / (25.2-min_volts)
        mvLayer.redraw();
    }

    return {
        init : init,
        draw : draw,
        update_json : update_json
    }
}();
