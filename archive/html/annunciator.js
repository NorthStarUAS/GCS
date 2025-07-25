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
        // draw_volts();
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
        if ( sats_div != null && json.status.annunciators.gps != null ) {
            var level = parseInt(json.status.annunciators.gps.substring(0, 1));
            var msg = json.status.annunciators.gps.substring(2);
            if ( level == 3 ) {
                sats_div.attr("class", "error");
            } else if ( level == 2 ) {
                sats_div.attr("class", "warn");
            } else {
                sats_div.attr("class", "ok");
            }
            sats_inner.html(msg)
        }
    };

    function draw_ekf() {
        var ekf_div = $("#ekf");
        var ekf_inner = $("#ekf #inner");
        if ( ekf_div != null && json.status.annunciators.ekf != null ) {
            var level = parseInt(json.status.annunciators.ekf.substring(0, 1));
            var msg = json.status.annunciators.ekf.substring(2);
            if ( level == 3 ) {
                ekf_div.attr("class", "error");
            } else if ( level == 2 ) {
                ekf_div.attr("class", "warn");
            } else {
                ekf_div.attr("class", "ok");
            }
            ekf_inner.html(msg)
        }
    };

    function draw_volts_old() {
        var volts_div = $("#volts");
        var volts_inner = $("#volts #inner");
        if ( volts_div != null && json.sensors.power.main_vcc != null ) {
            var level = parseInt(json.status.annunciators.power.substring(0, 1));
            var msg = json.status.annunciators.power.substring(2);
            if ( level == 3 ) {
                volts_div.attr("class", "error");
            } else if ( level == 2 ) {
                volts_div.attr("class", "warn");
            } else {
                volts_div.attr("class", "ok");
            }
            volts_inner.html(msg);
        }
    };

    function draw_battery() {
        var batt_div = $("#battery");
        var batt_inner = $("#battery #inner");
        if ( batt_div != null && json.status.annunciators.battery != null ) {
            var level = parseInt(json.status.annunciators.battery.substring(0, 1));
            var msg = json.status.annunciators.battery.substring(2);
            if ( level == 3 ) {
                batt_div.attr("class", "error");
            } else if ( level == 2 ) {
                batt_div.attr("class", "warn");
            } else {
                batt_div.attr("class", "ok");
            }
            batt_inner.html(msg)
        }
    };

    function draw_timer() {
        var timer_div = $("#timer");
        var timer_inner = $("#timer #inner");
        if ( timer_div != null && json.status.annunciators.timer != null ) {
            var msg = json.status.annunciators.timer.substring(2);
            timer_div.attr("class", "ok");
            timer_inner.html(msg)
        }
    };

    function draw_link_state() {
        var link_div = $("#link");
        var link_inner = $("#link #inner");
        if ( link_div != null && json.status.annunciators.link != null ) {
            var level = parseInt(json.status.annunciators.link.substring(0, 1));
            var msg = json.status.annunciators.link.substring(2);
            if ( level == 1 ) {
                link_div.attr("class", "ok");
            } else {
                link_div.attr("class", "error");
            }
            link_inner.html(msg);
        }
    }

    function draw_auto() {
        var auto_div = $("#auto");
        var auto_inner = $("#auto #inner");
        if ( auto_div != null && json.status.annunciators.auto != null ) {
            var level = parseInt(json.status.annunciators.auto.substring(0, 1));
            var msg = json.status.annunciators.auto.substring(2);
            if ( level == 1 ) {
                auto_div.attr("class", "ok");
            } else {
                auto_div.attr("class", "warn");
            }
            auto_inner.html(msg);
        }
    }

    function draw_wind() {
        var wind_div = $("#wind");
        var wind_inner = $("#wind #inner");
        if ( wind_div != null && json.status.annunciators.wind != null ) {
            var level = parseInt(json.status.annunciators.wind.substring(0, 1));
            var msg = json.status.annunciators.wind.substring(2);
            if ( level == 3 ) {
                wind_div.attr("class", "error");
            } else if ( level == 2 ) {
                wind_div.attr("class", "warn");
            } else {
                wind_div.attr("class", "ok");
            }
            wind_inner.html(msg)
        }
    }

    function draw_temp() {
        var temp_div = $("#temp");
        var temp_inner = $("#temp #inner");
        if ( temp_div != null && json.status.annunciators.temp != null ) {
            var level = parseInt(json.status.annunciators.temp.substring(0, 1));
            var msg = json.status.annunciators.temp.substring(2);
            if ( level == 3 ) {
                temp_div.attr("class", "error");
            } else if ( level == 2 ) {
                temp_div.attr("class", "warn");
            } else {
                temp_div.attr("class", "ok");
            }
            temp_inner.html(msg);
        }
    }

    function draw_callsign() {
        var callsign_div = $("#callsign");
        var callsign_inner = $("#callsign #inner");
        if ( callsign_div != null ) {
            var callsign = json.config.identity.call_sign + ": " + json.mission.task;
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
