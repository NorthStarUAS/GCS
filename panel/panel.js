var d2r = Math.PI / 180;

var panel = function() {
    var canvas;
    var context;
    var asiLayer, atiLayer, altLayer, hdgLayer, vsiLayer, tcLayer, vccLayer, mvLayer;
    var options;
    var opacity = 1;

    var img_main_volts = new Image();
    var img_res3_asi = new Image();
    var img_asi3 = new Image();
    var img_hdg2 = new Image();
    
    var instrument_config = {
        asi : {draw: draw_asi},
        att : {build: build_ati},
        alt : {build: build_altimeter},
        tc : {build: build_tc},
        dg : {build: build_heading},
        vsi : {build: build_vsi},
        avionics_vcc : {build: build_vcc},
        amp : {build: build_amp},
        main_volts : {draw: draw_main_volts},
    };

    var layout_config = {
        horizontal : {
            instruments : [['avionics_vcc', 'asi', 'att', 'alt'], ['amp', 'tc', 'dg', 'vsi']]
        },
        vertical : {
            instruments : [['avionics_vcc', 'amp'], ['asi', 'att'], ['alt', 'tc'], ['dg', 'vsi']]
        },
        mini : {
            instruments : [['att', '', '', '', '', '', '', '', '', 'dg'],
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

        img_res3_asi.src = 'textures/res3-asi.png';
        img_main_volts.src = 'textures/volts.png';
        img_asi3.src = 'textures/asi3.png';
        img_hdg2.src = 'textures/hdg2.png';
        
        console.log('finished scheduling texture loads');
        
        // asiLayer = new ol.layer.Vector( "Airspeed Indicator", {displayInLayerSwitcher: false});
        // map.addLayer(asiLayer);

        // atiLayer = new ol.layer.Vector( "Attitude Indicator", {displayInLayerSwitcher: false});
        // map.addLayer(atiLayer);

        // altLayer = new ol.layer.Vector( "Altimeter", {displayInLayerSwitcher: false});
        // map.addLayer(altLayer);

        // hdgLayer = new ol.layer.Vector( "Directional Gyro", {displayInLayerSwitcher: false});
        // map.addLayer(hdgLayer);

        // vsiLayer = new ol.layer.Vector( "Vertical Speed Indicator", {displayInLayerSwitcher: false});
        // map.addLayer(vsiLayer);

        // tcLayer = new ol.layer.Vector( "Turn Coordinator", {displayInLayerSwitcher: false});
        // map.addLayer(tcLayer);

        // vccLayer = new ol.source.Vector( "Avionics VCC", {displayInLayerSwitcher: false});
        // map.addLayer(vccLayer);

        // ampLayer = new ol.layer.Vector( "Amperes", {displayInLayerSwitcher: false});
        // map.addLayer(ampLayer);

        // mvLayer = new ol.layer.Vector( "Main Volts", {displayInLayerSwitcher: false});
        // map.addLayer(mvLayer);
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

    var asi_interpx = [ 0, 80,  160 ];
    var asi_interpy = [ 0, 340, 680 ];
    function draw_asi( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;
        
        // background
        context.drawImage(img_res3_asi, x, y, width=size, height=size);
        img = img_res3_asi;
        console.log(scale, img.width, img.height,
                    Math.floor(img.width*scale),
                    Math.floor(img.height*scale));
        
        // bug
        context.save();
        var nw = Math.floor(img_hdg2.width*scale*0.85)
        var nh = Math.floor(img_hdg2.height*scale*0.85)
        context.translate(cx, cy);
        var deg = my_interp( json.autopilot.targets.airspeed_kt,
                             asi_interpx, asi_interpy);
        context.rotate(deg*d2r);
        context.drawImage(img_hdg2, -nw*0.5, -size*0.5, width=nw, height=nh);
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

    function build_ati( x, y, size ) {
        atiLayer.clear();

        var pos = new ol.geom.Point(x, y);

        var ati1_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        ati1_style.externalGraphic = url_prefix + "textures/ati1.png";
        ati1_style.graphicWidth = size * 0.75;
        ati1_style.graphicHeight = size * 0.75;
        ati1_style.graphicOpacity = opacity;
        var ati1 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, ati1_style );
        ati1.fid = "backplate";
        atiLayer.addFeatures(ati1);
        ati1.move(pos);

        var ati2_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        ati2_style.externalGraphic = url_prefix + "textures/ati2.png";
        ati2_style.graphicWidth = size * 0.765625;
        ati2_style.graphicHeight = size * 0.5;
        ati2_style.graphicOpacity = opacity;
        var ati2 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, ati2_style );
        ati2.fid = "pitch";
        ati2.mysize = size;
        ati2.basex = x;
        ati2.basey = y;
        atiLayer.addFeatures(ati2);
        ati2.move(pos);

        var ati3_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        ati3_style.externalGraphic = url_prefix + "textures/ati3.png";
        ati3_style.graphicWidth = size * 0.90625;
        ati3_style.graphicHeight = size * 0.90625;
        ati3_style.graphicOpacity = opacity;
        var ati3 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, ati3_style );
        ati3.fid = "roll";
        atiLayer.addFeatures(ati3);
        ati3.move(pos);

        var ati4_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        ati4_style.externalGraphic = url_prefix + "textures/ati4.png";
        ati4_style.graphicWidth = size * 0.515625;
        ati4_style.graphicHeight = size * 0.33984375;
        ati4_style.graphicOpacity = opacity;
        ati4_style.graphicYOffset = -ati4_style.graphicHeight * 0.5
            + size * 0.15234375;
        var ati4 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, ati4_style );
        ati4.fid = "bird";
        atiLayer.addFeatures(ati4);
        var pos4 = new ol.geom.Point(x, y);
        ati4.move(pos);

        var ati5_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        ati5_style.externalGraphic = url_prefix + "textures/ati5.png";
        ati5_style.graphicWidth = size;
        ati5_style.graphicHeight = size;
        ati5_style.graphicOpacity = opacity;
        var ati5 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, ati5_style );
        atiLayer.addFeatures(ati5);
        var pos5 = new ol.geom.Point(x, y);
        ati5.move(pos);
    }

    function build_altimeter( x, y, size ) {
        altLayer.clear();

        var pos = new ol.geom.Point(x, y);

        var alt1_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        alt1_style.externalGraphic = url_prefix + "textures/alt1.png";
        alt1_style.graphicWidth = size * 0.75;
        alt1_style.graphicHeight = size * 0.75;
        alt1_style.graphicOpacity = opacity;
        var alt1 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, alt1_style );
        altLayer.addFeatures(alt1);
        alt1.move(pos);

        var alt2_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        alt2_style.externalGraphic = url_prefix + "textures/alt2.png";
        alt2_style.graphicWidth = size;
        alt2_style.graphicHeight = size;
        alt2_style.graphicOpacity = opacity;
        var alt2 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, alt2_style );
        altLayer.addFeatures(alt2);
        alt2.move(pos);

        var alt3_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        alt3_style.externalGraphic = url_prefix + "textures/alt3.png";
        alt3_style.graphicWidth = size * 0.4375;
        alt3_style.graphicHeight = size * 0.5;
        alt3_style.graphicOpacity = opacity;
        var alt3 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, alt3_style );
        alt3.fid = "needle 10k";
        altLayer.addFeatures(alt3);
        alt3.move(pos);

        var alt4_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        alt4_style.externalGraphic = url_prefix + "textures/alt4.png";
        alt4_style.graphicWidth = size * 0.1171875;
        alt4_style.graphicHeight = size * 0.4296875;
        alt4_style.graphicYOffset = -alt4_style.graphicHeight * 0.5
            - size * 0.0625;
        alt4_style.graphicOpacity = opacity;
        var alt4 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, alt4_style );
        alt4.fid = "needle 1k";
        altLayer.addFeatures(alt4);
        alt4.move(pos);

        var alt5_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        alt5_style.externalGraphic = url_prefix + "textures/alt5.png";
        alt5_style.graphicWidth = size * 0.1171875;
        alt5_style.graphicHeight = size * 0.4296875;
        alt5_style.graphicYOffset = -alt5_style.graphicHeight * 0.5
            - size * 0.1035;
        alt5_style.graphicOpacity = opacity;
        var alt5 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, alt5_style );
        alt5.fid = "needle";
        altLayer.addFeatures(alt5);
        alt5.move(pos);

        var alt6_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        alt6_style.externalGraphic = url_prefix + "textures/hdg2.png";
        alt6_style.graphicWidth = size * 0.09375;
        alt6_style.graphicHeight = size * 0.09375;
        alt6_style.graphicYOffset = -alt6_style.graphicHeight * 0.5
            - size * 0.37109375;
        alt6_style.graphicOpacity = opacity;
        var alt6 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, alt6_style );
        alt6.fid = "bug";
        altLayer.addFeatures(alt6);
        var pos6 = new ol.geom.Point(x, y);
        alt6.move(pos6);
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

    function build_tc( x, y, size ) {
        tcLayer.clear();

        var pos = new ol.geom.Point(x, y);

        var tc1_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        tc1_style.externalGraphic = url_prefix + "textures/tc1.png";
        tc1_style.graphicWidth = size * 0.59375;
        tc1_style.graphicHeight = size * 0.15625;
        tc1_style.graphicYOffset = -tc1_style.graphicHeight * 0.5
            + size * 0.15234375;
        tc1_style.graphicOpacity = opacity;
        var tc1 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, tc1_style );
        tcLayer.addFeatures(tc1);
        tc1.move(pos);
        
        var tc2_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        tc2_style.externalGraphic = url_prefix + "textures/tc2.png";
        tc2_style.graphicWidth = size * 0.125;
        tc2_style.graphicHeight = size * 0.15625;
        tc2_style.graphicYOffset = -tc2_style.graphicHeight * 0.5
            + size * 0.1640625;
        tc2_style.graphicOpacity = opacity;
        var tc2 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, tc2_style );
        tc2.fid = "ball";
        tc2.mysize = size;
        tc2.basex = x;
        tc2.basey = y;
        tcLayer.addFeatures(tc2);
        tc2.move(pos);

        var tc3_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        tc3_style.externalGraphic = url_prefix + "textures/tc3.png";
        tc3_style.graphicWidth = size;
        tc3_style.graphicHeight = size;
        tc3_style.graphicOpacity = opacity;
        var tc3 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, tc3_style );
        tcLayer.addFeatures(tc3);
        tc3.move(pos);

        var tc4_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        tc4_style.externalGraphic = url_prefix + "textures/tc4.png";
        tc4_style.graphicWidth = size * 0.625;
        tc4_style.graphicHeight = size * 0.171875;
        tc4_style.graphicOpacity = opacity;
        var tc4 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, tc4_style );
        tc4.fid = "plane";
        tcLayer.addFeatures(tc4);
        tc4.move(pos);
    }

    function build_vcc( x, y, size ) {
        vccLayer.clear();

        var pos = new ol.geom.Point(x, y);

        //var vcc1_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        var vcc1_style = ol.style.Style({
        });
        vcc1_style.externalGraphic = url_prefix + "textures/volts.png";
        vcc1_style.graphicWidth = size;
        vcc1_style.graphicHeight = size;
        vcc1_style.graphicOpacity = opacity;
        var vcc1 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, vcc1_style );
        vccLayer.addFeatures(vcc1);
        vcc1.move(pos);

        var vcc3_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        vcc3_style.externalGraphic = url_prefix + "textures/asi3.png";
        vcc3_style.graphicWidth = size * 0.109375;
        vcc3_style.graphicHeight = size * 0.53125;
        vcc3_style.graphicYOffset = -vcc3_style.graphicHeight * 0.5
	    - size * 0.111328125;
        vcc3_style.graphicOpacity = opacity;
        var vcc3 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, vcc3_style );
        vcc3.fid = "needle1";
        vccLayer.addFeatures(vcc3);
        vcc3.move(pos);

        var vcc4_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        vcc4_style.externalGraphic = url_prefix + "textures/asi3.png";
        vcc4_style.graphicWidth = size * 0.109375;
        vcc4_style.graphicHeight = size * 0.53125;
        vcc4_style.graphicYOffset = -vcc4_style.graphicHeight * 0.5
	    - size * 0.111328125;
        vcc4_style.graphicOpacity = opacity;
        var vcc4 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, vcc4_style );
        vcc4.fid = "needle2";
        vccLayer.addFeatures(vcc4);
        vcc4.move(pos);
    }

    function build_amp( x, y, size ) {
        ampLayer.clear();

        var pos = new ol.geom.Point(x, y);

        var amp1_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        amp1_style.externalGraphic = url_prefix + "textures/amps.png";
        amp1_style.graphicWidth = size;
        amp1_style.graphicHeight = size;
        amp1_style.graphicOpacity = opacity;
        var amp1 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, amp1_style );
        ampLayer.addFeatures(amp1);
        amp1.move(pos);

        var amp3_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        amp3_style.externalGraphic = url_prefix + "textures/asi3.png";
        amp3_style.graphicWidth = size * 0.109375;
        amp3_style.graphicHeight = size * 0.53125;
        amp3_style.graphicYOffset = -amp3_style.graphicHeight * 0.5
	    - size * 0.111328125;
        amp3_style.graphicOpacity = opacity;
        var amp3 = new OpenLayers.Feature.Vector( new ol.geom.Point(0,0), null, amp3_style );
        amp3.fid = "needle";
        ampLayer.addFeatures(amp3);
        amp3.move(pos);
    }

    function draw_main_volts( x, y, size ) {
        var cx = x + size*0.5;
        var cy = y + size*0.5;
        var scale = size/512;
        context.drawImage(img_main_volts, x, y, width=size, height=size);
        context.save();
        var nw = Math.floor(img_asi3.width*scale*0.85)
        var nh = Math.floor(img_asi3.height*scale*0.85)
        context.translate(cx, cy);
        context.rotate(8*json.status.frame_time*d2r);
        context.drawImage(img_asi3, -nw*0.5, -nh, width=nw, height=nh);
        context.restore();
    }

    function update1( tokens ) {
        var size = map.getSize();
        map.setCenter( new OpenLayers.LonLat( size.x * 0.5, size.y * 0.5 ) );

        update_hud_speed( tokens[4], tokens[22], tokens[23] );
        update_hud_alt( tokens[3], tokens[21] );

        update_asi( tokens[4], tokens[22], tokens[23] );
        update_ati( tokens[19], tokens[20] );
        update_altimeter( tokens[3], tokens[21] );
        update_heading( tokens[5], tokens[6], tokens[13], tokens[8], tokens[9], tokens[7] );
        update_vsi( tokens[14], tokens[15] );
        update_tc( tokens[16], tokens[17], tokens[18] );
    }

    function update_json( data ) {
        var size = map.getSize();
        map.setCenter( new OpenLayers.LonLat( size.x * 0.5, size.y * 0.5 ) );

        update_hud_speed( data.airspeed, data.ap_speed, data.pitot_scale );
        update_hud_alt( data.alt_true, data.ap_altitude );

        update_asi( data.airspeed, data.ap_speed, data.pitot_scale );
        update_ati( data.filter_phi, data.filter_theta );
        update_altimeter( data.alt_true, data.ap_altitude );
        update_heading( data.filter_psi, data.filter_track, data.ap_hdg, data.wind_deg, data.wind_kts, data.filter_speed );
        update_vsi( data.airdata_climb, data.ap_climb );
        update_tc( data.imu_ay, data.imu_az, data.imu_r );
        update_vcc( data.avionics_vcc, data.main_volts, data.cell_volts );
        update_amps( data.main_amps );
        update_main_volts( data.main_volts );
    }

    var asi_interpx = [ 0, 80,  160 ];
    var asi_interpy = [ 0, 340, 680 ];
    var filt_airspeed = 0.0;
    function update_asi( airspeed, target_airspeed, true_scale_est ) {
        if (!instrument_config.asi['active'])
	    return;

        filt_airspeed = 0.8 * filt_airspeed + 0.2 * airspeed;
        var needle = asiLayer.getFeatureByFid("needle");
        needle.style.rotation = my_interp( filt_airspeed, asi_interpx, asi_interpy);

        var true_speed = asiLayer.getFeatureByFid("true kt");
        var true_est = filt_airspeed * true_scale_est;
        var true_rot = my_interp( true_est, asi_interpx, asi_interpy );
        var true_kt = parseFloat(true_est).toFixed(0);
        true_speed.style.rotation = true_rot;
        //true_speed.style.label = 'TR: ' + true_kt + 'kt';
        //true_speed.style.label = 'TR: ' + true_kt + 'kt';

        var bug = asiLayer.getFeatureByFid("bug");
        bug.style.rotation = my_interp( target_airspeed,
				        asi_interpx, asi_interpy );

        asiLayer.redraw();
    }

    function update_ati( roll_deg, pitch_deg ) {
	if (!instrument_config.att['active'])
	    return;

        var backplate = atiLayer.getFeatureByFid("backplate");
        backplate.style.rotation = -roll_deg;

        var pitch = atiLayer.getFeatureByFid("pitch");
        pitch.style.rotation = -roll_deg;
        var p = pitch_deg;
        if ( p < -20 ) { p = -20; }
        if ( p > 20 ) { p = 20; }
        var ypx = p * 4.5;
        var px = pitch.basex;
        var py = pitch.basey + pitch.mysize * (ypx / 512);
        var pos = new ol.geom.Point(px, py);
        pitch.move(pos);

        var roll = atiLayer.getFeatureByFid("roll");
        roll.style.rotation = -roll_deg;

        atiLayer.redraw();
    }

    function update_altimeter( alt_m, target_alt ) {
	if (!instrument_config.alt['active'])
	    return;

        var alt_ft = alt_m / 0.3048;

	var alt_px = -3683 + (alt_ft * 2.5606) + "px";
	$("#alt_tape").css("background-position-y", alt_px);
	$("#actual_alt").text(Math.round(alt_ft));

        var needle = altLayer.getFeatureByFid("needle");
        needle.style.rotation = alt_ft * 0.36;

        var needle1k = altLayer.getFeatureByFid("needle 1k");
        needle1k.style.rotation = alt_ft * 0.036;

        var needle10k = altLayer.getFeatureByFid("needle 10k");
        needle10k.style.rotation = alt_ft * 0.0036;

        var bug = altLayer.getFeatureByFid("bug");
        bug.style.rotation = target_alt * 0.36

        altLayer.redraw();
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

    var battery_cells = 1;
    function update_vcc( vcc, main_volts, cell_volts ) {
        if (!instrument_config.avionics_vcc['active'])
	    return;

        var needle1 = vccLayer.getFeatureByFid("needle1");
        needle1.style.rotation = (vcc - 5.0) * 150.0;

        var battery_cells = main_volts / cell_volts;
        var volts_per_cell = cell_volts
        if ( volts_per_cell < 2.9 ) {
	    volts_per_cell = 2.9;
        }
        if ( volts_per_cell > 4.3 ) {
	    volts_per_cell = 4.3;
        }
        var needle2 = vccLayer.getFeatureByFid("needle2");
        needle2.style.rotation = ((3.6-volts_per_cell) * 75.0 / 0.6) + 180.0;

        vccLayer.redraw();
    }

    //var filt_amps = 0.0;
    function update_amps( amps ) {
        if (!instrument_config.amp['active'])
	    return;

        //filt_amps = 0.8 * filt_amps + 0.2 * amps;

        var needle = ampLayer.getFeatureByFid("needle");
        needle.style.rotation = amps * 340.0 / 50.0;
        ampLayer.redraw();
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
        update1 : update1,
        update_json : update_json
    }
}();
