var ws;
var link_connected = 0;
var update_rate = 200;
var json;

function link_init() {
    try {
        link_url = "ws://" + window.location.host + "/ws";
        console.log("Connecting to link_url : " + link_url);
	ws = new WebSocket(link_url);
        ws.onopen = function(msg) {
            console.debug('Connection successfully opened (readyState ' + this.readyState+')');
        };
        ws.onmessage = function(msg) {
            //write('Server says: '+msg.data);
            //alert('Server says: '+msg.data);
            //console.log(msg.data);
            json = JSON.parse( msg.data );
            //console.log(json.sensors.imu.p_rad_sec);
            var json_pretty = JSON.stringify(json, null, 3);
            var html = document.getElementById("aura_props");
            if ( html != null ) {
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
            //console.log(json_pretty);
            //console.log(json.sensors.imu[0].p_rad_sec);
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
	    connected = 1;
	    ws.send("get full_json\r\n");
	} else if ( ws.readyState == 3 ) {
	    // link closed or lost or couldn't originally be opened
	    connected = 0;
	    // alert( 'ready state = ' + ws.readyState );
	    link_init(link_url);
	}
    }
    catch(exception) {
	alert(exception);
    }
    setTimeout("link_update()", update_rate);
}

link_init()
link_update()
