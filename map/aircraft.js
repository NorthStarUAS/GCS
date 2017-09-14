L.AircraftMarker = L.Marker.extend({
    initialize: function(options) {
        var iconUrl = this._modelIcons[options.model] || 'fg_generic_craft'
        options.icon = options.icon || L.icon({
            iconUrl: 'acicons/' + iconUrl + '.png',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20],
        })
        options.title = options.title || options.callsign + ' (' + options.model + ')'
        options.alt = options.alt || 'callsign: ' + options.callsign + ', model: ' + options.model
        L.Marker.prototype.initialize.call(this,L.latLng(0,0))
        L.Util.setOptions(this, options)
        this.heading = 0
    },
})

var aircraftIcon = L.icon({
    iconUrl: 'acicons/fg_generic_craft.png',
    iconSize:     [40, 40], // size of the icon
    iconAnchor:   [20, 20], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -20], // point from which the popup should open relative to the iconAnchor
});

var aircraftLabel = L.divIcon({
    className: 'fg-aircraft-label',
    iconSize:   null, // size of the icon
    iconAnchor: [-10, -10], // point of the icon which will correspond to marker's location
    html: 'callsign',
});
