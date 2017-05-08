# Aura Ground Station Interface

Provides a web based interface to the AuraUAS autopilot system.  The
front end web pages work in conjunction with a backend python server
(usually running on the same laptop) which connects the aircraft
telemetry with the gui.

## Aura Map

A top down map for real time flight tracking, path planning, etc.


## Aura Panel

An analog-style instrument panel that displays flight status in a
format that is intuitive to pilots.


## Aura Props

A text-based page that shows all the values available on the ground
station that are either directly received from the aircraft, or
derived from values received from the aircraft.  This is intended as a
debugging tool and possibly for advanced users who wish to monitor
values that are not represented in the other pages.

