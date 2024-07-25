var ws;
var update_rate = 100;
var json;
var projects;

function link_init() {
    try {
        link_url = "ws://" + window.location.host + "/ws";
        console.log("Connecting to link_url : " + link_url);
	ws = new WebSocket(link_url);
        ws.onopen = function(msg) {
            console.debug('Connection successfully opened (readyState ' + this.readyState+')');
        };
        ws.onmessage = function(msg) {
            // console.log(msg.data);
            tmp_json = JSON.parse( msg.data );
            if ( tmp_json.main_magic != null ) {
                json = tmp_json;
            } else if ( tmp_json.projects_magic != null ) {
                projects = tmp_json;
                updateProjects();
            }
            var html = document.getElementById("aura_props");
            if ( html != null ) {
                var json_pretty = JSON.stringify(json, null, 3);
                html.innerHTML = json_pretty;
            }
            if ( typeof panel != 'undefined' ) {
                panel.draw();
            }
            if ( typeof annunciator != 'undefined' ) {
                annunciator.draw();
            }
            if ( typeof mymap != 'undefined' ) {
                map_update();
            }
            // console.log(json.sensors.imu[0].p_rad_sec);
        };
        ws.onclose = function(msg) {
            //alert('Closing... The connection is going throught the closing handshake (readyState '+this.readyState+')');
            if ( this.readyState == 2 ) {
                //write('Closing... The connection is going throught the closing handshake (readyState '+this.readyState+')');
            } else if ( this.readyState == 3 ) {
                // write('Connection closed... The connection has been closed or could not be opened (readyState '+this.readyState+')');
            } else {
                // write('Connection closed... (unhandled readyState '+this.readyState+')');
	    }
        };
        ws.onerror = function(event) {
            //terminal.innerHTML = '<li style="color: red;">'+event.data+'</li>'+terminal.innerHTML;
	    //alert( event );
        };
    }
    catch(exception) {
        alert(exception);
    }
}

function link_update() {
    try {
	if ( ws.readyState == 1 ) {
	    ws.send("get full_json\r\n");
	} else if ( ws.readyState == 3 ) {
	    // link closed or lost or couldn't originally be opened
	    // alert( 'ready state = ' + ws.readyState );
	    link_init(link_url);
	}
    }
    catch(exception) {
	alert(exception);
    }
    setTimeout("link_update()", update_rate);
}

function link_send( message ) {
    console.log('send ' + message);
    ws.send('send ' + message);
}

function projects_get() {
    ws.send('projects_get all')
}

function projects_update( message ) {
    ws.send('projects_update ' + message)
}

function projects_delete( key ) {
    ws.send('projects_delete ' + key)
}

link_init();
link_update();
