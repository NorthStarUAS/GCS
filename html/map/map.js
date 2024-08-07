// global variables
var mymap;
var ownship;
var track;
var home;
var circle;
var active_route;
var active_wpt;
var dialog;

var drawnItems = new L.FeatureGroup();
var projects = {};

// map settings
var autopan = true;
var track_sec = 600;
var default_airspeed = 25;
var default_altitude = 200;
var maxalt = 400;

// hard coded configurations
var cycle = '20180104';
var vfr_template = 'http://vfrmap.com/' + cycle + '/tiles/vfrc/{z}/{y}/{x}.jpg';
var ifr_template = 'http://vfrmap.com/' + cycle + '/tiles/ifrlc/{z}/{y}/{x}.jpg';
var startLatLng = [44.9757, -93.2323];

// conversions
var ft2m = 0.3048;
var m2ft = 1.0 / ft2m;
var msq2acre = 0.000247105;
var msq2hect = 0.0001;
var mps2kt = 1.9438444924406046432;

menuitems = [
    { text: 'Circle Here', icon: 'icons/circle.png', callback: circleHere },
    { text: 'Postion Home Here', icon: 'icons/home.png', callback: moveHomeHere },
    { text: 'Land Aircraft', icon: 'icons/land.png', callback: land },
    { separator: true },
    { text: 'Set Airspeed', icon: 'icons/speed.png', callback: set_airspeed },
    { text: 'Set Altitude', icon: 'icons/altitude.jpg', callback: set_altitude },
    { separator: true },
    { text: 'Calibrate', icon: 'icons/calibrate.png', callback: calibrate },
    { text: 'Test Autopilot', icon: 'icons/preflight.png', callback: preflight },
    { separator: true },
    { text: 'Manage Projects', icon: 'icons/projects.png', callback: manageProjects },
    { separator: true },
    { text: 'Settings', icon: 'icons/settings.png', callback: updateSettings },
];

function map_init() {
    mymap = L.map('mapid',
                   { contextmenu: true,
                     contextmenuItems: menuitems
                   }
                 );
    mymap.setView(startLatLng, 16);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
	    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
	    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(mymap);

    // API key for bing. Please get your own at: http://bingmapsportal.com/
    var apiKey = "AmT3B1o5RmNfyBsZ634rbefWuNbsHJsgTcyGWILtBrU74iDpQwikazUVu9TT8ZTL";

    var baselayer = {
        "OpenStreetMap": new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            minZoom: 0,
            maxZoom: 18,
            attribution: 'Map data &copy; <a target="_blank" href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        }),
        "Carto Light": new L.TileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            minZoom: 0,
            maxZoom: 18,
            attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
        }),
        "Carto Dark": new L.TileLayer('http://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            minZoom: 0,
            maxZoom: 18,
            attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
        }),
        "Bing": L.tileLayer.bing({
            bingMapsKey: apiKey,
            imagerySet: 'AerialWithLabels',
            attribution: 'bing'
        }),
    }

    var overlays = {
        "Terrain": new L.TileLayer('http://c.tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png', {
            minZoom: 0,
            maxZoom: 18,
            attribution: 'Map data &copy; <a target="_blank" href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        }),

        "OpenAIP":  new L.TileLayer("http://{s}.tile.maps.openaip.net/geowebcache/service/tms/1.0.0/openaip_basemap@EPSG%3A900913@png/{z}/{x}/{y}.png", {
            maxZoom: 14,
            minZoom: 5,
            tms: true,
            detectRetina: true,
            subdomains: '12',
            format: 'image/png',
            transparent: true
        }),

        "VFRMap.com Sectionals (US)" : new L.TileLayer(vfr_template, {
            maxZoom : 12,
            minZoom : 3,
            attribution : '&copy; <a target="_blank" href="http://vfrmap.com">VFRMap.com</a>',
            tms : true,
            opacity : 0.7,
            bounds : L.latLngBounds(L.latLng(16.0, -179.0), L.latLng(72.0, -60.0)),
        }),

        "VFRMap.com - Low IFR (US)" : new L.TileLayer(ifr_template, {
            maxZoom : 12,
            minZoom : 5,
            attribution : '&copy; <a target="_blank" href="http://vfrmap.com">VFRMap.com</a>',
            tms : true,
            opacity : 0.7,
            bounds : L.latLngBounds(L.latLng(16.0, -179.0), L.latLng(72.0, -60.0)),
        }),
    }

    mymap.addLayer(baselayer["OpenStreetMap"]);

    L.control.layers(baselayer, overlays).addTo(mymap);

    // Initialise the FeatureGroup to store editable layers
    mymap.addLayer(drawnItems);

    var drawPluginOptions = {
        position: 'topleft',
        draw: {
            /*polyline: {
                showLength: true,
                shapeOptions: {
                    color: '#f357a1',
                    weight: 10
                }
            },*/
            polygon: {
                allowIntersection: false, // Restricts shapes to simple polygons
                showArea: true,
                drawError: {
                    color: '#e1e100', // Color the shape will turn when intersects
                    message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                },
                shapeOptions: {
                    color: '#f357a1'
                }
            },
            circle: false, // Turns off this drawing tool
            rectangle: false,
            marker: {
                // icon: new MyCustomMarker()
            },
            circlemarker: false,
        },
        edit: {
            featureGroup: drawnItems, //REQUIRED!!
            //remove: false
        }
    };

    // Initialise the draw control and pass it the FeatureGroup of
    // editable layers
    var drawControl = new L.Control.Draw(drawPluginOptions);
    mymap.addControl(drawControl);

    mymap.on(L.Draw.Event.CREATED, function (e) {
        var type = e.layerType;
        var layer = e.layer;

        if ( type == 'marker' ) {
            var msg = prompt('Enter a brief note:');
            layer.bindPopup(msg);
        } else if ( type == 'polyline' ) {
            console.log(layer.editing);
            // console.log(layer.editing.latlngs[0]);
            // console.log(layer._getMeasurementString()); // doesn't work
            var result = confirm("Send this line route to aircraft?");
            if ( result == true ) {
                // send route
                var route = layer.editing.latlngs[0];
                var route_string = "route";
                for (var i = 0; i < route.length; i++) {
                    wpt = route[i];
                    route_string += ",1,"
		        + parseFloat(wpt.lng).toFixed(8) + ','
		        + parseFloat(wpt.lat).toFixed(8) + ',-';
                    if ( route_string.length > 180 ) {
                        link_send(route_string);
	                route_string = "route_cont";
                    }
                }
                if ( route_string.length > 0 ) {
                    link_send(route_string);
                }
                if ( layer.editing.latlngs.length > 0 ) {
	            link_send("route_end");
                }
            }
        } else if ( type == 'polygon' ) {
            var route = layer.getLatLngs();
            console.log(route);
            console.log(route.length);
            console.log(route[0].length);
            //console.log(layer.editing);
            //console.log(layer.editing.latlngs[0][0]);
            if ( route.length != 1 || route[0].length < 3 ) {
                alert("Survey areas must include at least 3 points, this polygon has " + route[0].length + " points.");
            } else {
                new_survey(layer);
            }
        }
    });
    mymap.on(L.Draw.Event.EDITED, function (e) {
        console.log('edited callback called');
        var layers = e.layers;
        layers.eachLayer(function (layer) {
            if ( layer instanceof L.Marker ) {
                // Do marker specific actions here
            } else if ( layer instanceof L.Polyline ) {
                if ( layer.options.fill ) {
                    // filled polygon == survey area
                    var result = confirm("Send amended survey area to aircraft?");
                    if ( result == true ) {
                        // send survey area
                        console.log(layer);
                    }
                } else {
                    // non-filled polygon == linear route
                    var result = confirm("Send amended route to aircraft?");
                    if ( result == true ) {
                        // send route
                        console.log(layer);
                    }
                }
            }
        });
    });

    home = L.circleMarker(startLatLng, {
        color: 'black',
        radius: 14,
    });
    home.addTo(mymap);

    circle = L.circle(startLatLng, {
        color: 'blue',
        fill: false,
        opacity: 0.5,
        radius: 100,
    });
    circle.addTo(mymap);

    active_route = L.polyline({
        color: 'blue',
        opacity: 0.5,
    });
    active_route.addTo(mymap);

    active_wpt = L.circleMarker(startLatLng, {
        color: 'blue',
        opacity: 0.5,
        radius: 7,
    });
    active_wpt.addTo(mymap);

    track = L.polyline([], {
        color: 'red',
        opacity: 0.5
    });
    track.addTo(mymap);

    ownship = L.marker(startLatLng, {icon: aircraftIcon});
    ownship.addTo(mymap);

    ownship_label = L.marker(startLatLng, {icon: aircraftLabel});
    ownship_label.addTo(mymap);
};


map_update = function() {
    if ( json.filters.nav.latitude_deg != null ) {
        var newLatLng = new L.LatLng(json.filters.nav.latitude_deg,
                                     json.filters.nav.longitude_deg);
        ownship.setLatLng(newLatLng);
        if (L.DomUtil.TRANSFORM) {
            ownship._icon.style[L.DomUtil.TRANSFORM] += ' rotate('
                + json.filters.nav.yaw_deg + 'deg)';
            ownship._icon.style["transform-origin"] = "50% 50%";
        }
        ownship_label.setLatLng(newLatLng);

        var alt_ft = json.filters.nav.altitude_m / 0.3048;
        var alt_disp = Math.round(alt_ft/10) * 10;
        var vel = 0.0;
        var vel_disp = 0.0;
        if ( json.config.specs.vehicle_class != null && json.config.specs.vehicle_class != "surface" ) {
            vel = json.sensors.airdata.airspeed_filt_mps*mps2kt;
        } else {
            vel = json.filters.nav.groundspeed_kt;
        }
        if ( vel < 10.0 ) {
            vel_disp = parseFloat(vel).toFixed(1);
        } else {
            vel_disp = parseFloat(vel).toFixed(0);
        }

        var html = '<div>' + json.config.identity.call_sign + '</div>'
            + '<div>' + alt_disp + ' ft</div>'
            + '<div>' + vel_disp + ' kts</div>';
        ownship_label._icon.innerHTML = html;
        var visible = mymap.getBounds().contains(ownship.getLatLng());
        if ( !visible && autopan ) {
            mymap.panTo(ownship.getLatLng());
        }

        track.addLatLng(newLatLng);
        var points = track.getLatLngs();
        var track_history = (1000/update_rate) * track_sec;
        if ( points.length > track_history ) {
            points.splice(0, points.length - track_history);
        }

        if ( json.task.home.latitude_deg != null ) {
            home.setLatLng( [json.task.home.latitude_deg,
                             json.task.home.longitude_deg] );
        }

        if ( json.task.circle.active.latitude_deg != null ) {
            circle.setLatLng( [json.task.circle.active.latitude_deg,
                               json.task.circle.active.longitude_deg] );
            var r = json.task.circle.active.radius_m;
            if ( r > 1.0 ) {
                circle.setRadius(r);
            }
            circle.setStyle( { color: 'blue', opacity: 0.5 } );
        }

        if ( json.task.current_task_id == 'circle' || json.task.current_task_id == 'land' ) {
            active_wpt.setLatLng( [json.task.circle.active.latitude_deg,
                                   json.task.circle.active.longitude_deg] );
        } else if ( json.task.current_task_id == 'route' ) {
            i = json.task.route.target_waypoint_idx;
            if ( i < json.task.route.active.wpt.length ) {
                active_wpt.setLatLng( [json.task.route.active.wpt[i].latitude_deg,
                                       json.task.route.active.wpt[i].longitude_deg] );
            }
        }
    }

    var route_size = json.task.route.active.route_size;
    if ( route_size > 0 ) {
        var wpts = [];
        var array_size = route_size;
        if ( json.task.route.active.wpt.length < array_size ) {
            array_size = json.task.route.active.wpt.length;
        }
        for ( var i = 0; i < array_size; i++ ) {
            var lat = json.task.route.active.wpt[i].latitude_deg;
            var lon = json.task.route.active.wpt[i].longitude_deg;
            if ( Math.abs(lat) > 0.001 && Math.abs(lon) > 0.001 ) {
                wpts.push( [lat, lon] );
            }
        }
        // wpts.push( [json.task.route.active.wpt[0].latitude_deg,
        //             json.task.route.active.wpt[0].longitude_deg] );
        active_route.setLatLngs(wpts);
        active_route.setStyle( { color: 'blue', opacity: 0.5 } );
    }
};

var model;                      // shared among all modal dialog boxes

var user_latlng;
function circleHere(e) {
    modal = $("#circle-form");
    modal.show();
    user_latlng = e.latlng;
    // activate the "x"
    $("#circle-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#circle-form-submit").off("click");
    $("#circle-form-submit").click(function() {
        console.log( user_latlng );
        console.log( $("input[name='circle-dir']:checked").val() );
        console.log( $("#circle-radius").val() );
        modal.hide();
        var dir = $("input[name='circle-dir']:checked").val().toLowerCase();
        if ( dir ) {
            link_send('set,/task/circle/standby/direction,' + dir);
        }
        var radius = $("#circle-radius").val();
        if ( parseFloat(radius) > 10 ) {
            link_send('set,/task/circle/standby/radius_m,' + radius);
        }
        link_send('task,circle,' + user_latlng.lng + ',' + user_latlng.lat);
    })
}


function moveHomeHere(e) {
    modal = $("#home-form");
    modal.show();
    user_latlng = e.latlng;
    // activate the "x"
    $("#home-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#home-form-submit").off("click");
    $("#home-form-submit").click(function() {
        console.log( user_latlng );
        modal.hide();
        var az = parseFloat($("#home-azimuth").val()) % 360.0;
        link_send('home,' + user_latlng.lng + ',' + user_latlng.lat + ',0,' + az);
    })
}

function calibrate(e) {
    modal = $("#calibrate-form");
    modal.show();
    // activate the "x"
    $("#calibrate-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#calibrate-form-submit").off("click");
    $("#calibrate-form-submit").click(function() {
        modal.hide();
        link_send('task,calib_home');
    })
    $("#calibrate-reset-ekf").off("click");
    $("#calibrate-reset-ekf").click(function() {
        modal.hide();
        link_send('set,/filters/command,reset');
        link_send('set,/sensors/rcfmu/command,reset_ekf');
        link_send('set,/sensors/Aura4/command,reset_ekf');
    })
    $("#calibrate-zero-gyros").off("click");
    $("#calibrate-zero-gyros").click(function() {
        modal.hide();
        link_send('set,/sensors/rcfmu/command,zero_gyros');
        link_send('set,/sensors/Aura4/command,zero_gyros');
    })
}

function preflight(e) {
    modal = $("#preflight-form");
    modal.show();
    // activate the "x"
    $("#preflight-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#preflight-form-submit").off("click");
    $("#preflight-form-submit").click(function() {
        modal.hide();
        var sec = $("#preflight-duration").val();
        link_send('task,preflight,' + sec);
    })
}

function land(e) {
    modal = $("#land-form");
    modal.show();
    // activate the "x"
    $("#land-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#land-form-submit").off("click");
    $("#land-form-submit").click(function() {
        modal.hide();
        var dir = $("input[name='land-dir']:checked").val().toLowerCase();
        if ( dir ) {
            link_send('set,/task/land/direction,' + dir);
        }
        var radius = $("#land-radius").val();
        if ( parseFloat(radius) > 10 ) {
            link_send('set,/task/land/turn_radius_m,' + radius);
        }
        var gs = $("#land-glideslope").val();
        link_send('set,/task/land/glideslope_deg,' + gs);
        var airspeed = $("#land-airspeed").val();
        link_send('set,/task/land/approach_speed_kt,' + airspeed);
        var extend = $("#land-extend").val();
        link_send('set,/task/land/extend_final_leg_m,' + extend);
        var flare_pitch = $("#land-flare-pitch").val();
        link_send('set,/task/land/flare_pitch_deg,' + flare_pitch);
        var flare_sec = $("#land-flare-sec").val();
        link_send('set,/task/land/flare_seconds,' + flare_sec);
        var lat = $("#land-lat-offset").val();
        link_send('set,/task/land/lateral_offset_m,' + lat);
        var alt = $("#land-alt-bias").val();
        link_send('set,/task/land/alitutude_bias_ft,' + alt);

        var hdg = $("#land-runway-hdg").val();
        link_send('task,land,' + hdg);
    })
}

function set_airspeed(e) {
    modal = $("#airspeed-form");
    modal.show();
    // activate the "x"
    $("#airspeed-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    var value = $("#airspeed-target");
    var slider = $("#airspeed-slider");
    var target_airspeed = json.autopilot.targets.airspeed_kt;
    value.html(target_airspeed);
    slider[0].min = json.config.autopilot.TECS.min_kt;
    slider[0].max = json.config.autopilot.TECS.max_kt;
    slider.val(target_airspeed);
    slider.on('input change', function() {
        value.html(this.value);
    });
    $("#airspeed-form-submit").off("click");
    $("#airspeed-form-submit").click(function() {
        modal.hide();
        var airspeed = $("#airspeed-slider").val();
        link_send('set,/autopilot/targets/airspeed_kt,' + airspeed);
    })
}

function set_altitude(e) {
    modal = $("#altitude-form");
    modal.show();
    // activate the "x"
    $("#altitude-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#altitude-ground").html((json.position.altitude_ground_m * m2ft).toFixed(0));
    // estimate onboard agl
    var ground = json.position.altitude_ground_m * m2ft;
    var agl = json.autopilot.targets.altitude_msl_ft - ground;
    var msl = ground + agl;
    // snap to nearest 25'
    agl = parseFloat(agl / 25).toFixed(0) * 25;
    var label_agl = $("#altitude-target-agl");
    var label_msl = $("#altitude-target-msl");
    var slider = $("#altitude-slider");
    slider[0].max = maxalt;
    label_agl.html(agl);
    label_msl.html(msl);
    slider.val(agl);
    slider.on('input change', function() {
        label_agl.html(this.value);
        var msl = (parseFloat(this.value) + ground).toFixed(0);
        label_msl.html(msl);
    });
    $("#altitude-form-submit").off("click");
    $("#altitude-form-submit").click(function() {
        modal.hide();
        var altitude = $("#altitude-slider").val();
        link_send('set,/autopilot/targets/altitude_agl_ft,' + altitude);
    })
}


function updateSettings(e) {
    modal = $("#settings-form");
    modal.show();
    user_latlng = e.latlng;
    // activate the "x"
    $("#settings-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#settings-form-submit").off("click");
    $("#settings-form-submit").click(function() {
        modal.hide();
        autopan = $("#settings-autopan").is(':checked');
        maxalt = $("#settings-maxalt").val();
        track_sec = $("#settings-track-sec").val();
    });
}

function updateProjects() {
    var list = $("#existing-projects-list");
    var html = ""
    var keys = Object.keys(projects);
    console.log('keys ' + keys);
    for ( var i in keys ) {
        var key = keys[i];
        if ( key == 'projects_magic' ) {
            // skip
        } else {
            var areas = projects[key];
            html += '<p>';
            html += "<button type=\"button\" id=\"select-project-button\" onclick=\"selectProject('" + key + "');\" style=\"font-size:100%; padding: 5px 20px;\">Select <b>" + key + "</b></button>"
            html += " ";
            html += "<button type=\"button\" id=\"delete-project-button\" onclick=\"deleteProject('" + key + "');\" style=\"font-size:100%; padding: 5px 20px;\">Delete <b>" + key + "</b></button>"
            html += ' (' + areas.length + ' area';
            if ( areas.length != 1 ) {
                html += 's';
            }
            html += ') ';
            html += '</p>';
            console.log('  key ' + keys[i] + ' len ' + areas.length);
        }
    }
    list.html(html);
}
