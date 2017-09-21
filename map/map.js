var mymap;
var ownship;
var track;
var track_sec = 600;
var dialog;

var startLatLng = [44.9757, -93.2323];

function moveHomeHere(e) {
    console.log('move home here');
    dialog.dialog('open');
}

menuitems = [
    { text: 'Circle Here', icon: 'icons/circle.png', callback: circleHere },
    { text: 'Move Home Here', icon: 'icons/home.png', callback: moveHomeHere }
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
    var drawnItems = new L.FeatureGroup();
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
            // console.log(layer.editing);
            // console.log(layer.editing.latlngs[0]);
            // console.log(layer._getMeasurementString()); // doesn't work
            var result = confirm("Send this line route to aircraft?");
            if ( result == true ) {
                // send route
            }
        } else if ( type == 'polygon' ) {
            // console.log(layer.editing);
            // console.log(layer.editing.latlngs[0]);
            // console.log(layer._getMeasurementString()); // doesn't work
            var result = confirm("Send survey area to aircraft?");
            if ( result == true ) {
                // send survey area
            }
        }
    
        drawnItems.addLayer(layer);
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
    if ( !visible ) {
        mymap.panTo(ownship.getLatLng());
    }
    
    track.addLatLng(newLatLng);
    var points = track.getLatLngs();
    var track_history = (1000/update_rate) * track_sec;
    if ( points.length > track_history ) {
        points.splice(0, points.length - track_history);
    }
};

var model;                      // shared among all modal dialog boxes

var circle_latlng;
function circleHere(e) {
    //modal = document.getElementById("circle-form");
    //modal.style.display = "block";
    modal = $("#circle-form");
    console.log(modal);
    modal.show();
    //modal.css("display", "block");
    circle_latlng = e.latlng;
    
    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];
    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.hide();
    }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#circle-dir-submit").off("click");
    $("#circle-dir-submit").click(function() {
        console.log( circle_latlng );
        console.log( $("input[name='circle-dir']:checked").val() );
        console.log( $("#circle-radius").val() );
        //textFieldContent = $("#my-text-field").val()
        //doSomethingWithTheText( textFieldContent )
        modal.hide();
        var dir = $("input[name='circle-dir']:checked").val();
        if ( dir ) {
            link_send('set,/task/circle/direction,' + dir);
        }
        var radius = $("#circle-radius").val();
        if ( parseFloat(radius) > 10 ) {
            link_send('set,/task/circle/radius_m,' + radius);
        }
        link_send('task,circle,' + circle_latlng.lng + ',' + circle_latlng.lat);
    })
}


