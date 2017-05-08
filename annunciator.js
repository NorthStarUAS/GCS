// requires jquery

var annunciator = function() {
    var ann_power_disp = 0;
    var ann_wx_disp = 0;

    function pad2(number) {
        return (number < 10 ? '0' : '') + number;
    }
    
    function pad3(number) {
        if ( number < 10 ) {
            return '00' + number;
        } else if ( number < 100 ) {
            return '0' + number;
        } else {
            return number;
        }
    }

    function cycleData() {
        ann_power_disp = (ann_power_disp + 1) % 4;
        ann_wx_disp = !ann_wx_disp;
    }

    function init() {
        setInterval(cycleData, 3000);
    }
    
    function draw() {
        draw_sats();
        draw_power();
        draw_timer();
        draw_link_state();
    }
    
    function draw_sats() {
        var sats_div = $("#sats");
        if ( sats_div != null ) {
            sats = parseInt(json.sensors.gps[0].satellites);
            if ( sats <= 4 ) {
                sats_div.attr("class", "error");
            } else if ( sats <= 6 ) {
                sats_div.attr("class", "warn");
            } else {
                sats_div.attr("class", "ok");
            }
            sats_div.html(sats + " sats");
        }
    };

    function draw_power() {
        var power_div = $("#power");
        if ( power_div != null ) {
            var vcc = parseFloat(json.sensors.APM2.board_vcc).toFixed(2);
            var volts_per_cell = parseFloat(json.sensors.APM2.extern_cell_volt).toFixed(2);
            var amps = parseFloat(json.sensors.APM2.extern_amps).toFixed(2);
            var mah = parseFloat(json.sensors.APM2.extern_current_mah).toFixed(0);
            if ( ann_power_disp == 0 ) {
                if ( vcc < 4.3 || vcc > 5.7 ) {
                    power_div.attr("class", "error");
                } else if ( vcc < 4.5 || vcc > 5.5  ) {
                    power_div.attr("class", "warn");
                } else {
                    power_div.attr("class", "ok");
                }
                power_div.html(vcc + "v av");
            } else if ( ann_power_disp == 1 ) {
                power_div.attr("class", "ok");
                power_div.html(mah + "mah");
            } else if ( ann_power_disp == 2 ) {
                power_div.attr("class", "ok");
                power_div.html(amps + "a");
            } else if ( ann_power_disp == 3 ) {
                if ( volts_per_cell < 3.20 ) {
                    power_div.attr("class", "error");
                } else if ( volts_per_cell < 3.30 ) {
                    power_div.attr("class", "warn");
                } else {
                    power_div.attr("class", "ok");
                }
                power_div.html( volts_per_cell + "v ex" );
            }
        }
    };
    
    function draw_timer() {
        var secs = parseFloat(json.status.flight_timer).toFixed(0);
        var timer_div = $("#timer");
        timer_div.attr("class", "ok");
        var hours = Math.floor(secs / 3600);
        var rem = secs - (hours * 3600);
        var mins = Math.floor(rem / 60);
        var rem = rem - (mins * 60);
        var timer_str = "";
        if ( secs < 3600 ) {
            timer_str = mins + ":" + pad2(rem);
        } else {
            timer_str = hours + ":" + pad2(mins) + ":" + pad2(rem);
        }
        timer_div.html(timer_str);
    };
    
    function draw_link_state() {
        var state = json.comms.remote_link.link_state;
        var link_div = $("#link");
        if ( state == "ok" ) {
            link_div.attr("class", "ok");
            link_div.html("Link");
            ann_lost_link = 0;
        } else {
            link_div.attr("class", "error");
            link_div.html("Lost Link");
            ann_lost_link = 1;
        }
    }

    return {
        init: init,
        draw: draw,
    };
}();
