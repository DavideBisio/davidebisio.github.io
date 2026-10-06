---
title: "My hiking and MTB planning strategy"
description: "The tools I chain together to plan multi-day hikes and mountain bike routes, from first idea to live navigation."
pubDate: 2026-10-06
category: hobby
tags: ["hiking", "mtb", "route-planning", "gps"]
draft: true
---

Draft. TODO intro: why planning matters, what kind of trips this workflow is for (multi-day hiking, bikepacking, day MTB rides).

## The flow at a glance

Think of it as a funnel:

**inspire → corridor → fine routing → validate → logistics → export and field test**

| Stage | Tool |
|---|---|
| Inspire | Google search, Wikiloc, Komoot |
| Corridor and fine routing | CalTopo |
| Elevation profile, device maps, extra routing | Basecamp |
| Validate terrain | Google Earth |
| Field navigation (primary) | Garmin watch / Garmin Edge |
| Field navigation (backup) | Mapy.cz on the phone |

One rule keeps the chain clean: keep **one master GPX** (the CalTopo map) and treat everything else as an export or a view. Every GPX round trip risks changing waypoint names, track simplification or elevation data.

## The tools I use

### 1. Google search / Wikiloc / Komoot: ideas and a baseline

- Find existing tracks and inspiration
- Use them as a baseline, not a final route
- Worth adding: the Strava global heatmap (hiking or MTB filter) and Trailforks for MTB, to see where people actually go and what is really rideable

### 2. CalTopo: fine-grain track planning

- Good for routing
- Find water sources on the map
- Find escape routes towards nearby roads or villages
- Slope-angle shading helps for steep ground and MTB
- Output: track and waypoints

### 3. Basecamp: elevation profile, device maps, and routing

Basecamp does three jobs for me:

- **Elevation profile:** set the elevation profile on the GPX file
- **Garmin Edge maps:** install and update the OpenMTBMap maps on my Garmin Edge
- **Routing:** I like its routing on OpenStreetMap data, for bike and also for car

TODO: describe exactly how I use each of these.

**Desktop alternatives with comparable features.** If Basecamp stops being maintained or I move away from it, the closest desktop replacement is **QMapShack** (open source, Windows, macOS and Linux):

- Reads Garmin IMG maps such as OpenMTBMap
- Edits tracks and shows elevation profiles, with DEM support
- Routes on OSM data via external engines such as BRouter (bike) or similar

Other options: **GPXSee** (viewer only, lightweight) and **gpx.studio** (browser-based GPX editing and elevation replacement).

Note on OpenMTBMap: the maps are also distributed as a `gmapsupp.img` file that can be copied straight to the device's `Garmin` folder, so Basecamp is a convenience for installing and browsing the maps on the computer rather than a hard requirement.
TODO: verify this against the current OpenMTBMap instructions before publishing.

### 4. Google Earth: 3D terrain overview

- Good for finding rough sections and getting the overall ground picture
- Estimate camping spots
- Check how recent the imagery is
- Output: waypoints

### 5. Garmin watch / Edge: live tracking

- Track overlay while on the move
- Edge carries the OpenMTBMap maps for MTB navigation

### 6. Mapy.cz: mobile consultation of the track

- Offline maps
- Live routing capabilities
- Doubles as a backup to the Garmin

## Putting it together

TODO: describe the workflow end to end: order of the steps, which file moves where, GPX formats.

A possible order:

1. Collect ideas and baseline tracks (Google, Wikiloc, Komoot, heatmaps).
2. Route the real line in CalTopo. Add water, escape points and camp candidates as waypoints.
3. Export the GPX, then fix the elevation profile and check the routing in Basecamp.
4. Check the hard sections and camp spots in Google Earth. Add waypoints.
5. Run the validation checklist below.
6. Load the track on the Garmin and on Mapy.cz. Update the Edge maps if needed.

## Validation and logistics checklist

- **Terrain reality check:** does the line exist on the ground? Check heatmaps and recent imagery.
- **Conditions:** season, snow cover, weather window, and whether the water sources are seasonal.
- **Legality and access:** wild camping rules, protected areas, land access, hunting seasons.
- **Numbers:** distance, ascent and estimated time per stage. Naismith's rule for hiking, a realistic average speed for MTB.
- **Camps:** a camp A and a camp B for each stage.
- **Resupply:** where and when.
- **Escape routes:** at least one per stage, written down as waypoints.

## Field safety and redundancy

- Share the route, escape points and expected check-in times with someone.
- Keep a second offline map (Mapy.cz).
- Plan battery and power-bank capacity. Consider a satellite messenger on remote routes.
- Test-load the GPX on the watch and phone before leaving. Check that the track overlay, waypoints and offline maps all work.

## Lessons learned

TODO: mistakes, tips, what I would change.
