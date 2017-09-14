function map_init() {
    var mymap = L.map('mapid').setView([51.505, -0.09], 13);
      
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
}
