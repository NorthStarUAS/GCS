function addSurveyMarker(layer, name) {
    var marker = L.marker(layer.getBounds().getCenter());
    // compute survey area
    var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    var acres = area * msq2acre;
    var hectare = area * msq2hect;
    var area_str = acres.toFixed(2) + ' acres (' + hectare.toFixed(2) + ' hectares)';
    var id = drawnItems.getLayerId( layer );
    var contents = "<p>" + name + "</p>" + "<p>" + area_str + "</p>" + "<button type=\"button\" id=\"new-survey-form-submit\" onclick=\"request_survey('" + id + "');\" style=\"font-size:100%; padding: 5px 20px;\">Survey Now ...</button>";
    marker.noSave = true;
    marker.bindPopup(contents);
    drawnItems.addLayer(marker);
}

function selectProject(key) {
    $("#project-name").val(key);
    $("#projects-form").hide();
    drawnItems.clearLayers();
    var areas = projects[key];
    for ( var i in areas ) {
        a = areas[i];
        console.log(i);
        console.log(a);
        ll = a.latlngs[0];
        pts = [];
        for ( var j in ll ) {
            pts.push( [ ll[j].lat, ll[j].lng ] );
        }
        p = L.polygon( pts, { color: '#f357a1' } );
        p.myName = a.name;
        drawnItems.addLayer( p );
        id = drawnItems.getLayerId( p );
        console.log(p);
        addSurveyMarker(p, a.name);
    }
}

function deleteProject(key) {
    if ( confirm('Delete project from server: "' + key + '"') ) {
        projects_delete(key);
    }
    $("#projects-form").hide();
}

function manageProjects(e) {
    modal = $("#projects-form");
    modal.show();
    user_latlng = e.latlng;
    projects_get();
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
        // build simplified version of drawn objects and register it
        // with the server
        var project = {};
        var name = $("#project-name").val();
        project["name"] = name;
        project["areas"] = [];
        console.log(name)
        var layers = drawnItems.getLayers();
        console.log(layers);
        for (var i = 0; i < layers.length; i++) {
            var l = layers[i];
            if ( l.noSave != null ) {
                // skip 'noSave' layers
            } else {
                console.log(l);
                console.log(l.myName);
                var ll = l.getLatLngs();
                console.log(ll);
                var area = {};
                area["name"] = l.myName;
                area["latlngs"] = l.getLatLngs();
                project["areas"].push(area);
            }
        }
        project_str = JSON.stringify(project);
        console.log(project_str);
        projects_update(project_str);
    });
}

function new_survey(layer) {
    modal = $("#new-survey-form");
    modal.show();
    // compute survey acres
    var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    var acres = area * msq2acre;
    var hectare = area * msq2hect;
    $("#new-survey-area").html(acres.toFixed(2) + ' acres (' + hectare.toFixed(2) + ' hectares)');
    // activate the "x"
    $("#new-survey-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#new-survey-form-submit").off("click");
    $("#new-survey-form-submit").click(function() {
        modal.hide();
        drawnItems.addLayer(layer);
        var id = drawnItems.getLayerId(layer);
        var name = $("#survey-name").val();
        layer.myName = name;
        console.log(layer.getBounds().getCenter());
        addSurveyMarker(layer, name);
    })
}

function request_survey(layer_id) {
    modal = $("#request-survey-form");
    modal.show();
    layer = drawnItems.getLayer(layer_id);
    $("#request-survey-name").html(layer.myName)
    // compute survey acres
    var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    var acres = area * msq2acre;
    var hectare = area * msq2hect;
    $("#request-survey-area").html(acres.toFixed(2) + ' acres (' + hectare.toFixed(2) + ' hectares)');
    // activate the "x"
    $("#request-survey-close").click(function() {
        modal.hide();
    })
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target.className == "modal") {
            modal.hide();
        }
    }
    $("#request-survey-form-submit").off("click");
    $("#request-survey-form-submit").click(function() {
        modal.hide();
        send_survey_area(layer_id);
    })
}

function send_survey_area(layer_id) {
    layer = drawnItems.getLayer(layer_id);
    console.log("send area:");
    console.log(layer);
    var alt = $("#survey-alt").val();
    var extend = $("#survey-extend").val();
    var flap = $("#survey-forward-overlap").val();
    var llap = $("#survey-side-overlap").val();
    var ffov = $("#survey-forward-fov").val();
    var lfov = $("#survey-lateral-fov").val();
    var start_string = "survey_start," + alt + "," + extend + "," + flap
        + "," + llap + "," + ffov + "," + lfov;
    link_send(start_string);
    var polygon = layer.getLatLngs();
    var area_string = "";
    for (var i = 0; i < polygon[0].length; i++) {
        if (area_string.length == 0) {
            area_string = "survey_cont";
        }
        wpt = polygon[0][i];
        area_string += ","
	    + parseFloat(wpt.lng).toFixed(8) + ','
	    + parseFloat(wpt.lat).toFixed(8);
        if ( area_string.length > 180 ) {
            link_send(area_string);
	    area_string = "";
        }
    }
    if ( area_string.length > 0 ) {
        link_send(area_string);
    }
    if ( layer.editing.latlngs.length > 0 ) {
	link_send("survey_end");
    }
}
