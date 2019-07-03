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
        draw_battery();
        draw_timer();
        draw_link_state();
        draw_auto();
        draw_wind();
        draw_temp();
        draw_callsign();
    }
    
    function draw_sats() {
        //var sats_div = $("#sats");
        var sats_div = $("#sats");
        var sats_inner = $("#sats #inner");
        if ( sats_div != null && json.sensors.gps[0].satellites != null ) {
            sats = parseInt(json.sensors.gps[0].satellites);
            if ( isNaN(sats) ) {
                sats = 0;
            }
            if ( sats <= 4 ) {
                sats_div.attr("class", "error");
            } else if ( sats <= 6 ) {
                sats_div.attr("class", "warn");
            } else {
                sats_div.attr("class", "ok");
            }
            sats_inner.html(sats + " sats");
        }
    };

    function draw_ekf() {
        var ekf_div = $("#ekf");
        var ekf_inner = $("#ekf #inner");
        if ( ekf_div != null && json.filters.filter[0].timestamp != null ) {
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
        if ( batt_div != null && json.sensors.power.total_mah != null ) {
            var mah = parseFloat(json.sensors.power.total_mah).toFixed(0);
            var battery_total = parseFloat(json.config.specs.battery_mah)
            var remaining = battery_total - mah
            var battery_percent = ((remaining / battery_total) * 100).toFixed(0)
            if ( battery_percent < 0 ) {
                battery_percent = 0;
            }
            if ( battery_percent < 15 ) {
                batt_div.attr("class", "error");
            } else if ( battery_percent < 25 ) {
                batt_div.attr("class", "warn");
            } else {
                batt_div.attr("class", "ok");
            }
            batt_inner.html(battery_percent + "% batt");
        }
    };
    
    function draw_timer() {
        var timer_div = $("#timer");
        var timer_inner = $("#timer #inner");
        if ( timer_div != null && json.status.flight_timer != null ) {
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
            timer_inner.html(timer_str);
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
        if ( auto_div != null && json.autopilot.master_switch != null ) {
            var auto_switch = json.autopilot.master_switch;
            if ( auto_switch == "True" ) {
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
        var wind_div = $("#wind");
        var wind_inner = $("#wind #inner");
        if ( wind_div != null && json.filters.wind.wind_dir_deg != null ) {
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
            var wind_deg = parseFloat(json.filters.wind.wind_dir_deg);
            var dir = Math.round(parseFloat(wind_deg * 0.1).toFixed(0) * 10.0);
            var speed = parseFloat(json.filters.wind.wind_speed_kt*speed_scale);
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
        if ( temp_div != null && json.sensors.airdata[0] != null ) {
            var temp = parseFloat(json.sensors.airdata[0].temp_C).toFixed(0);
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
