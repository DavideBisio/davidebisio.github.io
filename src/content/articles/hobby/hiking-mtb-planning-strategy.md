---
title: "My hiking and MTB planning strategy"
description: "The tools I chain together to plan multi-day hikes and mountain bike routes, from first idea to live navigation."
pubDate: 2026-10-06
category: hobby
tags: ["hiking", "mtb", "route-planning", "gps"]
draft: true
---

A good route is rarely found in one place. The track that looks perfect on a map can turn out to be a washed-out path, a closed gate, or a climb with no water for 30 km. Over time I've settled on a chain of tools where each one does the job it's best at, and the output of one feeds the next.

This is the workflow I use for multi-day hikes and for mountain bike rides. The tools are the same for both, but what I look for is different. For hiking I care most about water, camp spots and exposure. For MTB I care about surface, technical sections and whether the trail is actually rideable.

This isn't the only way to do it, and it keeps changing. Below: the tools, what I use each one for, how they fit together, and the checks I run before leaving.

TODO: add a short personal hook (a trip where planning saved or failed me).

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

Note on OpenMTBMap: Basecamp is not strictly required to get the maps onto a device. OpenMTBMap also offers a prebuilt `gmapsupp.img` ("Premium Gmapsupp.img", for direct use on Garmin units) that you copy into the device's `Garmin` folder (some models want a `Map` folder instead). The trade-offs, per the OpenMTBMap tutorials:

- Sending maps through Basecamp (or MapSource) is the way to get address search on the device.
- On newer devices it is better to send each map separately and rename the `gmapsupp.img`, because maps sent together through Basecamp cannot be individually deactivated.
- Most new Garmin devices cannot read the Unicode map variants, so use the non-Unicode ones.

TODO: check which of these applies to my Edge model.

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

Here is the order I follow, with what each step produces and where the file goes next.

1. **Collect ideas and a baseline.** Search Google, Wikiloc and Komoot for existing routes in the area. Look at the Strava heatmap or Trailforks to see where people actually go. Output: a rough corridor and a few reference tracks. Nothing is final yet.
2. **Route the real line in CalTopo.** Draw the track with CalTopo's routing, using the baseline as a guide. Along the way, mark water sources, escape routes towards roads or villages, and candidate camp spots as waypoints. This map becomes the master, and every later change goes back into it.
3. **Export the GPX and process it in Basecamp.** Open the exported GPX, fix the elevation profile, and use Basecamp's OSM routing to double-check or patch sections, for example road links or car access to the trailhead. If I need new OpenMTBMap maps on the Edge, I install or update them here.
4. **Validate the terrain in Google Earth.** Load the GPX and fly the route in 3D. Look for rough or exposed sections, how steep the climbs really are, and whether the camp candidates look flat and sheltered. Add or move waypoints, and carry any change back into the CalTopo master.
5. **Run the checklist.** Conditions, legality, stage numbers, camps, resupply and escape routes (see below). If something fails, go back to step 2 and re-route.
6. **Export and load the devices.** Send the final GPX to the Garmin (watch or Edge) for the track overlay and live tracking, and to Mapy.cz on the phone with the offline map downloaded. The Garmin is primary and Mapy.cz is the backup.
7. **Field-test the files before leaving.** Open the track on each device and check the overlay, the waypoints and the offline maps.

Two habits keep this from getting messy. First, always edit the master in CalTopo and re-export, instead of patching a copy that has already been through two other tools. Second, name the waypoints clearly (water, escape, camp A, camp B) so they stay readable on a small watch screen.

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
