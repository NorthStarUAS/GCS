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
        draw_sats();
        draw_ekf();
        draw_volts();
        draw_mah();
        draw_timer();
        draw_link_state();
        draw_auto();
        draw_wind();
        draw_temp();
        draw_callsign();
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

    function draw_ekf() {
        var ekf_div = $("#ekf");
        if ( ekf_div != null ) {
            var gyro_warn = 0.5 * Math.PI / 180.0;
            var gyro_error = 1.0 * Math.PI / 180.0;
            var accel_warn = 0.5;
            var accel_error = 1.0;
            var p_bias = parseFloat(json.filters.filter[0].p_bias);
            var q_bias = parseFloat(json.filters.filter[0].q_bias);
            var r_bias = parseFloat(json.filters.filter[0].r_bias);
            var ax_bias = parseFloat(json.filters.filter[0].ax_bias);
            var ay_bias = parseFloat(json.filters.filter[0].ay_bias);
            var az_bias = parseFloat(json.filters.filter[0].az_bias);
            var imu_time = parseFloat(json.sensors.imu[0].timestamp);
            var filter_time = parseFloat(json.filters.filter[0].timestamp);
            if ( Math.abs(p_bias) >= gyro_error ||
                 Math.abs(q_bias) >= gyro_error ||
                 Math.abs(r_bias) >= gyro_error ||
                 Math.abs(ax_bias) >= accel_error ||
                 Math.abs(ay_bias) >= accel_error ||
                 Math.abs(az_bias) >= accel_error ) {
                ekf_div.attr("class", "error");
            } else if ( Math.abs(p_bias) >= gyro_warn ||
                        Math.abs(q_bias) >= gyro_warn ||
                        Math.abs(r_bias) >= gyro_warn ||
                        Math.abs(ax_bias) >= accel_warn ||
                        Math.abs(ay_bias) >= accel_warn ||
                        Math.abs(az_bias) >= accel_warn ) {
                ekf_div.attr("class", "warn");
            } else {
                ekf_div.attr("class", "ok");
            }
        }
    };

    function draw_volts() {
        var volts_div = $("#volts");
        if ( volts_div != null ) {
            var volts_per_cell = parseFloat(json.sensors.APM2.extern_volt).toFixed(2);
            if ( volts_per_cell < 3.20 ) {
                volts_div.attr("class", "error");
            } else if ( volts_per_cell < 3.30 ) {
                volts_div.attr("class", "warn");
            } else {
                volts_div.attr("class", "ok");
            }
            volts_div.html( volts_per_cell + "v" );
        }
    };
    function draw_mah() {
        var mah_div = $("#mah");
        if ( mah_div != null ) {
            var mah = parseFloat(json.sensors.APM2.extern_current_mah).toFixed(0);
            mah_div.attr("class", "ok");
            mah_div.html(mah + "mah");
        }
    };
    
    function draw_timer() {
        var timer_div = $("#timer");
        if ( timer_div != null ) {
            var secs = parseFloat(json.status.flight_timer).toFixed(0);
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
        }
    };
    
    function draw_link_state() {
        var link_div = $("#link");
        if ( link_div != null ) {
            var state = json.comms.remote_link.link_state;
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
    }
    
    function draw_auto() {
        var auto_div = $("#auto");
        if ( auto_div != null ) {
            var auto_switch = parseFloat(json.sensors.pilot_input[0].channel[7]);
            if ( auto_switch > 0.0 ) {
                auto_div.attr("class", "ok");
                auto_div.html("Auto");
            } else {
                auto_div.attr("class", "warn");
                auto_div.html("Manual");
            }
        }
    }

    function draw_wind() {
        var wind_div = $("#wind");
        if ( wind_div != null ) {
            var wind_deg = parseFloat(json.filters.wind.wind_dir_deg);
            var dir = Math.round(parseFloat(wind_deg * 0.1).toFixed(0) * 10.0);
            var speed = parseFloat(json.filters.wind.wind_speed_kt);
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
            wind_div.html(pad3(dir) + '@' + speed.toFixed(0) + 'kt');
        }
    }

    function draw_temp() {
        var temp_div = $("#temp");
        if ( temp_div != null ) {
            var temp = parseFloat(json.sensors.airdata[0].temp_degC).toFixed(0);
            if ( temp < -30 || temp > 50 ) {
                temp_div.attr("class", "error");
            } else if ( temp < -10 || temp > 35 ) {
                temp_div.attr("class", "warn");
            } else {
                temp_div.attr("class", "ok");
            }
            temp_div.html( temp + 'C');
        }
    }
    
    function draw_callsign() {
        var callsign_div = $("#callsign");
        if ( callsign_div != null ) {
            var callsign = json.config.identity.call_sign;
            if ( callsign != null && callsign != "" ) {
                callsign_div.html(callsign);
            }
        }
    }
    
    return {
        init: init,
        draw: draw,
    };
}();
