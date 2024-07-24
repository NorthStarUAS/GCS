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
        if ( link_div != null && json.annunciators.link != null ) {
            if ( json.annunciators.link.level == 1 ) {
                link_div.attr("class", "ok");
            } else {
                link_div.attr("class", "error");
            }
            link_inner.html(json.annunciators.link.msg);
        }
    }

    function draw_auto() {
        var auto_div = $("#auto");
        var auto_inner = $("#auto #inner");
        if ( auto_div != null && json.annunciators.auto != null ) {
            if ( json.annunciators.auto.level == 1 ) {
                auto_div.attr("class", "ok");
            } else {
                auto_div.attr("class", "warn");
            }
            auto_inner.html(json.annunciators.auto.msg);
        }
    }

    function draw_wind() {
        var wind_div = $("#wind");
        var wind_inner = $("#wind #inner");
        if ( wind_div != null && json.annunciators.wind != null ) {
            if ( json.annunciators.wind.level == 3 ) {
                wind_div.attr("class", "error");
            } else if ( json.annunciators.wind.level == 2 ) {
                wind_div.attr("class", "warn");
            } else {
                wind_div.attr("class", "ok");
            }
            wind_inner.html(json.annunciators.wind.msg)
        }
    }

    function draw_temp() {
        var temp_div = $("#temp");
        var temp_inner = $("#temp #inner");
        if ( temp_div != null && json.annunciators.temp != null ) {
            if ( json.annunciators.temp.level == 3 ) {
                temp_div.attr("class", "error");
            } else if ( json.annunciators.temp.level == 2 ) {
                temp_div.attr("class", "warn");
            } else {
                temp_div.attr("class", "ok");
            }
            temp_inner.html( json.annunciators.temp.msg );
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
