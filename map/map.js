var mymap;
var ownship;
var track;
var home;
var circle;
// var circle_center;
var active_route;
var active_wpt;
var dialog;

var drawnItems;

// map settings
var autopan = true;
var track_sec = 600;
var default_airspeed = 25;
var default_altitude = 200;
var maxalt = 400;

// hard coded configurations
var startLatLng = [44.9757, -93.2323];

// conversions
var ft2m = 0.3048;
var m2ft = 1.0 / ft2m;

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

        "VFRMap.com Sectionals (US)" : new L.TileLayer('http://vfrmap.com/20140918/tiles/vfrc/{z}/{y}/{x}.jpg', {
            maxZoom : 12,
            minZoom : 3,
            attribution : '&copy; <a target="_blank" href="http://vfrmap.com">VFRMap.com</a>',
            tms : true,
            opacity : 0.5,
            bounds : L.latLngBounds(L.latLng(16.0, -179.0), L.latLng(72.0, -60.0)),
        }),

        "VFRMap.com - Low IFR (US)" : new L.TileLayer('http://vfrmap.com/20140918/tiles/ifrlc/{z}/{y}/{x}.jpg', {
            maxZoom : 12,
            minZoom : 5,
            attribution : '&copy; <a target="_blank" href="http://vfrmap.com">VFRMap.com</a>',
            tms : true,
            opacity : 0.5,
            bounds : L.latLngBounds(L.latLng(16.0, -179.0), L.latLng(72.0, -60.0)),
        }),
    }

    mymap.addLayer(baselayer["OpenStreetMap"]);

    L.control.layers(baselayer, overlays).addTo(mymap);

    // Initialise the FeatureGroup to store editable layers
    drawnItems = new L.FeatureGroup();
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
        var type = e.layerType,
            layer = e.layer;
    
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
            var route = layer.editing.latlngs[0][0];
            console.log(layer.editing);
            console.log(layer.editing.latlngs[0][0]);
            if ( route.length != 4 ) {
                alert("Only 4-sided survey areas are currently supported, this polygon has " + route.length + " sides.");
            } else {
                survey(layer);
            }
            // console.log(layer.editing);
            // console.log(layer.editing.latlngs[0]);
            // console.log(layer._getMeasurementString()); // doesn't work
            // var result = confirm("Send survey area to aircraft?");
            // if ( result == true ) {
                // send survey area
            // }
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
    
    ownship = L.marker(startLatLng, {icon: aircraftIcon});
    ownship.addTo(mymap);

    ownship_label = L.marker(startLatLng, {icon: aircraftLabel});
    ownship_label.addTo(mymap);

    track = L.polyline([], {
        color: 'red',
        opacity: 0.5
    });
    track.addTo(mymap);

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
    // circle_center = L.circleMarker(startLatLng, {
    //     color: 'blue',
    //     opacity: 0.5,
    //     radius: 7,
    // });
    // circle_center.addTo(mymap);

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

};


map_update = function() {
    if ( json.filters.filter[0].latitude_deg == null ) {
        return;
    }
    
    var newLatLng = new L.LatLng(json.filters.filter[0].latitude_deg,
                                 json.filters.filter[0].longitude_deg);
    ownship.setLatLng(newLatLng);
    if (L.DomUtil.TRANSFORM) {
        ownship._icon.style[L.DomUtil.TRANSFORM] += ' rotate('
            + json.filters.filter[0].heading_deg + 'deg)';
        ownship._icon.style["transform-origin"] = "50% 50%";
    }
    ownship_label.setLatLng(newLatLng);

    var alt_ft = json.filters.filter[0].altitude_m / 0.3048;
    var alt_disp = Math.round(alt_ft/10) * 10;
    var vel_disp = Math.round(json.velocity.airspeed_smoothed_kt);
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

    home.setLatLng( [json.task.home.latitude_deg,
                     json.task.home.longitude_deg] );

    circle.setLatLng( [json.task.circle.latitude_deg,
                       json.task.circle.longitude_deg] );
    var r = json.task.circle.radius_m;
    if ( r > 1.0 ) {
        circle.setRadius(r);
    }
    // circle_center.setLatLng( [json.task.circle.latitude_deg,
    //                           json.task.circle.longitude_deg] );

    if ( json.task.route.active.route_size > 0 ) {
        var wpts = [];
        for ( var i = 0; i < json.task.route.active.route_size; i++ ) {
            wpts.push( [json.task.route.active.wpt[i].latitude_deg,
                        json.task.route.active.wpt[i].longitude_deg] );
        }
        wpts.push( [json.task.route.active.wpt[0].latitude_deg,
                    json.task.route.active.wpt[0].longitude_deg] );
        active_route.setLatLngs(wpts);
    }
    
    if ( json.task.current_task_id == 'circle' ) {
        active_wpt.setLatLng( [json.task.circle.latitude_deg,
                               json.task.circle.longitude_deg] );
    } else if ( json.task.current_task_id == 'route' ) {
        i = json.task.route.target_waypoint_idx;
        if ( i < json.task.route.active.wpt.length ) {
            active_wpt.setLatLng( [json.task.route.active.wpt[i].latitude_deg,
                                   json.task.route.active.wpt[i].longitude_deg] );
        }
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
            link_send('set,/task/circle/direction,' + dir);
        }
        var radius = $("#circle-radius").val();
        if ( parseFloat(radius) > 10 ) {
            link_send('set,/task/circle/radius_m,' + radius);
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
        link_send('task,calibrate');
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

function manageProjects(e) {
    modal = $("#projects-form");
    modal.show();
    user_latlng = e.latlng;
    // activate the "x"
    $("#projects-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#projects-form-submit").off("click");
    $("#projects-form-submit").click(function() {
        modal.hide();
    });
}

function survey(layer) {
    modal = $("#survey-form");
    modal.show();
    // activate the "x"
    $("#survey-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#survey-form-submit").off("click");
    $("#survey-form-submit").click(function() {
        modal.hide();
        drawnItems.addLayer(layer);
        var id = drawnItems.getLayerId(layer);
        var name = $("#survey-name").val();
        console.log(layer.getBounds().getCenter());
        var marker = L.marker(layer.getBounds().getCenter()).addTo(mymap);
        var contents = "<p>" + name + "</p>" + "<button type=\"button\" id=\"survey-form-submit\" onclick=\"send_area('" + id + "');\" style=\"font-size:100%; padding: 5px 20px;\">Survey Now ...</button>";
        marker.bindPopup(contents);
        // link_send('task,preflight,' + sec);
        console.log('drawn items:');
        console.log(drawnItems);
    })
}

function send_area(layer_id) {
    layer = drawnItems.getLayer(layer_id);
    console.log("send area:");
    console.log(layer);
    var area = layer.editing.latlngs[0][0];
    var area_string = "area";
    for (var i = 0; i < area.length; i++) {
        wpt = area[i];
        area_string += ","
	    + parseFloat(wpt.lng).toFixed(8) + ','
	    + parseFloat(wpt.lat).toFixed(8) + ',';
        if ( area_string.length > 180 ) {
            link_send(area_string);
	    area_string = "area_cont";
        }
    }
    if ( area_string.length > 0 ) {
        link_send(area_string);
    }
    if ( layer.editing.latlngs.length > 0 ) {
	link_send("area_end");
    }
}
