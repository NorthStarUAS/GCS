var mymap;
var ownship;
var track;
var track_sec = 600;

function circleHere(e) {
}

function moveHomeHere(e) {
}

menuitems = [
    { text: 'Circle Here', icon: 'icons/circle.png', callback: circleHere },
    { text: 'Move Home Here', icon: 'icons/home.png', callback: moveHomeHere }
];

function map_init() {
    mymap = L.map('mapid',
                  {
                      contextmenu: true,
                      contextmenuItems: menuitems
                  }
                 );
    mymap.setView([51.505, -0.09], 15);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
	    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
	    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(mymap);
    
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
        
        // "Grid" : L.grid({
	//     redraw: 'moveend',
        //     coordStyle: 'DMS',
        // }),
    }

    mymap
        //.setView(new L.LatLng(lat,lng),zoom)
        .addLayer(baselayer["OpenStreetMap"]);

    L.control.layers(baselayer, overlays).addTo(mymap);

    // L.marker([51.5, -0.09]).addTo(mymap)
    //     .bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();
    
    // L.circle([51.508, -0.11], 500, {
    //     color: 'red',
    //     fillColor: '#f03',
    //     fillOpacity: 0.5
    // }).addTo(mymap).bindPopup("I am a circle.");
    
    // L.polygon([
    //     [51.509, -0.08],
    //     [51.503, -0.06],
    //     [51.51, -0.047]
    // ]).addTo(mymap).bindPopup("I am a polygon.");
    
    // Initialise the FeatureGroup to store editable layers
    var editableLayers = new L.FeatureGroup();
    mymap.addLayer(editableLayers);
    
    var drawPluginOptions = {
        position: 'topright',
        draw: {
            polyline: {
                shapeOptions: {
                    color: '#f357a1',
                    weight: 10
                }
            },
            polygon: {
                allowIntersection: false, // Restricts shapes to simple polygons
                drawError: {
                    color: '#e1e100', // Color the shape will turn when intersects
                    message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                },
                shapeOptions: {
                    color: '#bada55'
                }
            },
            circle: false, // Turns off this drawing tool
            rectangle: {
                shapeOptions: {
                    clickable: false
                }
            },
            marker: {
                // icon: new MyCustomMarker()
            }
        },
        edit: {
            featureGroup: editableLayers, //REQUIRED!!
            remove: false
        }
    };
    
   // Initialise the draw control and pass it the FeatureGroup of
    // editable layers
    var drawControl = new L.Control.Draw(drawPluginOptions);
    mymap.addControl(drawControl);
    
    mymap.on(L.Draw.Event.CREATED, function (e) {
        var type = e.layerType,
            layer = e.layer;
    
        if (type === 'marker') {
            layer.bindPopup('A popup!');
        }
    
        editableLayers.addLayer(layer);
    });
    
    ownship = L.marker([51.5, -0.09], {icon: aircraftIcon});
    ownship.addTo(mymap);

    ownship_label = L.marker([51.5, -0.09], {icon: aircraftLabel});
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
