// requires jquery

var annunciator = function() {

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

    function init() {
        // pass for now
    }

    function draw() {
        draw_gps();
        draw_ekf();
        draw_volts();
        draw_battery();
        draw_timer();
        draw_link_state();
        draw_auto();
        draw_wind();
        draw_temp();
        draw_callsign();
    }

    function draw_gps() {
        //var sats_div = $("#sats");
        var sats_div = $("#sats");
        var sats_inner = $("#sats #inner");
        if ( sats_div != null && json.annunciators.gps != null ) {
            if ( json.annunciators.gps.level == 3 ) {
                sats_div.attr("class", "error");
            } else if ( json.annunciators.gps.level == 2 ) {
                sats_div.attr("class", "warn");
            } else {
                sats_div.attr("class", "ok");
            }
            sats_inner.html(json.annunciators.gps.msg)
        }
    };

    function draw_ekf() {
        var ekf_div = $("#ekf");
        var ekf_inner = $("#ekf #inner");
        if ( ekf_div != null && json.annunciators.ekf != null ) {
            if ( json.annunciators.ekf.level == 3 ) {
                ekf_div.attr("class", "error");
            } else if ( json.annunciators.ekf.level == 2 ) {
                ekf_div.attr("class", "warn");
            } else {
                ekf_div.attr("class", "ok");
            }
            ekf_inner.html(json.annunciators.ekf.msg)
        }
    };

    function draw_volts() {
        var volts_div = $("#volts");
        var volts_inner = $("#volts #inner");
        if ( volts_div != null && json.sensors.power.main_vcc != null ) {
            var volts_per_cell = parseFloat(json.sensors.power.cell_vcc).toFixed(2);
            if ( volts_per_cell < 3.20 ) {
                volts_div.attr("class", "error");
            } else if ( volts_per_cell < 3.30 ) {
                volts_div.attr("class", "warn");
            } else {
                volts_div.attr("class", "ok");
            }
            volts_inner.html( volts_per_cell + "v" );
        }
    };

    function draw_battery() {
        var batt_div = $("#battery");
        var batt_inner = $("#battery #inner");
        if ( batt_div != null && json.annunciators.battery != null ) {
            if ( json.annunciators.battery.level == 3 ) {
                batt_div.attr("class", "error");
            } else if ( json.annunciators.battery.level == 2 ) {
                batt_div.attr("class", "warn");
            } else {
                batt_div.attr("class", "ok");
            }
            batt_inner.html(json.annunciators.battery.msg)
        }
    };

    function draw_timer() {
        var timer_div = $("#timer");
        var timer_inner = $("#timer #inner");
        if ( timer_div != null && json.annunciators.timer != null ) {
            timer_div.attr("class", "ok");
            timer_inner.html(json.annunciators.timer.msg)
        }
    };

    function draw_link_state() {
        var link_div = $("#link");
        var link_inner = $("#link #inner");
        if ( link_div != null ) {
            var state = json.comms.remote_link.link_state;
            if ( state == "ok" ) {
                link_div.attr("class", "ok");
                link_inner.html("Link");
                ann_lost_link = 0;
            } else {
                link_div.attr("class", "error");
                link_inner.html("Lost Link");
                ann_lost_link = 1;
            }
        }
    }

    function draw_auto() {
        var auto_div = $("#auto");
        var auto_inner = $("#auto #inner");
        if ( auto_div != null && json.switches.master_switch != null ) {
            var auto_switch = json.switches.master_switch;
            if ( auto_switch ) {
                auto_div.attr("class", "ok");
                auto_inner.html("Auto");
            } else {
                auto_div.attr("class", "warn");
                auto_inner.html("Manual");
            }
        }
    }

    function draw_wind() {
        var kt2mps = 0.514444;
        var mps2kt = 1.0 / kt2mps;
        var wind_div = $("#wind");
        var wind_inner = $("#wind #inner");
        if ( json.config.specs.vehicle_class == null || json.config.specs.vehicle_class == "surface" ) {
            return;
        }
        if ( wind_div != null && typeof json.sensors.airdata !== 'undefined' ) {
            var display_units = "??";
            var speed_scale = 1.0;
            if ( json.config.specs.display_units == "mps" ) {
                speed_scale = kt2mps;
                display_units = "ms";
            } else if ( json.config.specs.display_units == "kts" ) {
                speed_scale = 1.0;
                display_units = "kt";
            } else {
                // default to mps if not specified
                speed_scale = kt2mps;
                display_units = "ms";
            }
            var wind_deg = parseFloat(json.sensors.airdata.wind_dir_deg);
            var dir = Math.round(parseFloat(wind_deg * 0.1).toFixed(0) * 10.0);
            var speed = parseFloat(json.sensors.airdata.wind_speed_mps*mps2kt*speed_scale);
            var target_airspeed_kt = parseFloat(json.autopilot.targets.airspeed_kt);
            var ratio = 0.0;
            if ( target_airspeed_kt > 0.1 ) {
                ratio = speed / target_airspeed_kt;
            }
            if ( ratio < 0.5 ) {
                wind_div.attr("class", "ok");
            } else if ( ratio < 0.7 ) {
                wind_div.attr("class", "warn");
            } else {
                wind_div.attr("class", "error");
            }
            wind_inner.html(pad3(dir) + '@' + speed.toFixed(0) + display_units);
        }
    }

    function draw_temp() {
        var temp_div = $("#temp");
        var temp_inner = $("#temp #inner");
        if ( json.config.specs.vehicle_class == null || json.config.specs.vehicle_class == "surface" ) {
            return;
        }
        if ( temp_div != null && json.sensors.airdata.air_temp_C != null ) {
            var temp = parseFloat(json.sensors.airdata.air_temp_C).toFixed(0);
            if ( temp < -30 || temp > 50 ) {
                temp_div.attr("class", "error");
            } else if ( temp < -10 || temp > 35 ) {
                temp_div.attr("class", "warn");
            } else {
                temp_div.attr("class", "ok");
            }
            temp_inner.html( temp + 'C');
        }
    }

    function draw_callsign() {
        var callsign_div = $("#callsign");
        var callsign_inner = $("#callsign #inner");
        if ( callsign_div != null ) {
            var callsign = json.config.identity.call_sign;
            if ( callsign != null && callsign != "" ) {
                callsign_inner.html(callsign);
            } else {
                callsign_inner.html('callsign');
            }
        }
    }

    return {
        init: init,
        draw: draw,
    };
}();
