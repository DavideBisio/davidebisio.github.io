# Interactive day-to-day journey map

## Summary

Add a new, trip-level "journey map" to the trip page (`src/pages/travel/[trip]/index.astro`): a coarse-grained overview map showing the whole trip's travel route and waypoints, which highlights the current day's segment as the visitor scrolls the existing day-by-day timeline. This is a separate feature from the existing per-day activity maps (`TripMap.tsx`, driven by `day.gpx`) — that component and its data are untouched.

## Goals

- Render the whole trip's travel route + waypoints as a baseline overview map.
- Highlight the active day's route/waypoints as the visitor scrolls the timeline.
- Work on both desktop (sticky side-by-side column) and mobile (on-demand popup).
- Allow downloading the GPX for the currently active day.
- Use a simpler, low-detail basemap (main roads only, no topo/terrain clutter) — distinct from the existing per-day maps' OSM raster tiles.

## Non-goals

- Changing anything about the existing per-day activity maps, their data (`day.gpx`), or their component (`TripMap.tsx`).
- Live-updating the mobile popup while scrolling — it's a static snapshot of whichever day was active when opened.
- Automatic geocoding of place names; waypoint coordinates come from GPX `<wpt>` data the user supplies.
- A unit test framework — this repo has none today, and this feature doesn't introduce one.

## Data model

Add one new optional per-day frontmatter field to the `trips` collection schema (`src/content.config.ts`), alongside — not replacing — the existing `gpx`:

```yaml
days:
  - date: 2026-09-13
    ...
    route: "./2026-09-13-route.gpx" # optional, one file per day, relative to the trip folder
```

Schema addition:

```ts
route: z.string().optional(),
```

The referenced file is a normal GPX file, colocated flat in the trip folder like existing `.gpx` tracks:

- A single `<trk>` with the day's coarse travel path (e.g. the driving route between towns).
- Zero or more `<wpt lat="…" lon="…"><name>…</name></wpt>` entries for that day's waypoints (e.g. towns, camp spots, viewpoints).

Days without a `route` simply don't contribute a segment to the journey map. No changes are needed to existing trip content until routes/waypoints are authored for a trip.

### GPX parsing

`src/lib/gpx.ts` already parses `<trk>`/`<trkpt>` for the existing per-day maps via `parseGpx`. Add a sibling function:

```ts
export interface GpxWaypoint {
  name: string;
  lat: number;
  lon: number;
}

export function parseWaypoints(xml: string): GpxWaypoint[]
```

Implemented the same way as the rest of the file: a regex over `<wpt ...>...</wpt>` blocks, reusing the existing `LAT_RE`/`LON_RE` patterns against the tag's attributes and a `<name>` regex against its inner content. Skips (does not error on) a `<wpt>` with no `<name>`; a `<wpt>` with unparsable lat/lon is a build-time error, consistent with `parseGpx`'s existing posture of failing loud on malformed GPX.

## Component architecture

### `JourneyMap.tsx` (new)

A new React island, mounted once per trip page (not once per day, unlike the existing `TripMap`). Props: an array of per-day entries for every day that has a `route`:

```ts
interface JourneyDay {
  dayIndex: number;       // index into the full days[] array, for scroll-sync matching
  label: string;          // day title, for tooltips/labels
  points: [number, number][];
  waypoints: { name: string; lat: number; lon: number }[];
  gpxHref: string | null; // for the download link
}
```

Rendering:

- Every day's route is drawn as a thin, muted polyline (the "overview baseline"), all at once, `fitBounds` to the whole trip extent on mount.
- The currently active day's route is restyled bold/colored, its waypoints shown as circle markers with name tooltips; the map pans/fits to that day's bounds.
- Basemap: CARTO Voyager tiles (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`, with CARTO's required attribution alongside the OSM one) instead of the existing per-day maps' OSM raster tiles — keeps roads and labels visible while dropping terrain/land-use detail.
- A small control (or adjacent DOM element outside the map canvas) shows a "Download GPX" link for the active day, reusing the existing `import.meta.glob(...).../*.gpx', { query: '?url' })` pattern already used for per-day downloads in `index.astro`.

### Scroll-sync

Each existing timeline `<li>` in `index.astro` gets a `data-day-index={i}` attribute (the only change to the existing timeline markup). A small controller — implemented inside `JourneyMap` itself, since it's the only consumer — sets up an `IntersectionObserver` over all `[data-day-index]` elements on mount, and tracks the topmost currently-intersecting day as `activeDayIndex` in component state.

If the active day has no `route` (wasn't in the `JourneyDay[]` prop array), fall back to the nearest earlier day that does have one, to avoid the map blanking out or flickering between unrelated days while scrolling past route-less days.

### Desktop layout

In `index.astro`, wrap the existing `<ol>` timeline and the new `<JourneyMap client:load>` in a two-column CSS grid:

- Left column: the existing timeline, completely unchanged.
- Right column: `<JourneyMap>`, `position: sticky` with a `top` offset and `align-self: start`, so it stays pinned in the viewport while the left column scrolls.
- The whole two-column grid (and the map) is only rendered when at least one day has a `route`; trips with no journey-map data render exactly as today.

### Mobile layout

Below a breakpoint (Tailwind `lg:` or similar), the sticky right column is hidden. Instead:

- A floating button (fixed position, bottom-right, map icon) is shown whenever at least one day has a `route`.
- Tapping it opens a modal that lazily mounts `JourneyMap` in a "single day" mode: it renders only the day that was active (per the same `IntersectionObserver`-tracked state, which keeps running in the background even while the map itself isn't visible) at the moment the button was tapped — not the live overview-highlight interaction.
- The modal is dismissed via an X button or backdrop tap. Reopening it re-reads whatever the current active day is at that moment (a fresh static snapshot), not the previous popup's day.

## Error handling

- Malformed `<trk>`/`<wpt>` (unparsable lat/lon) in a `route` file: build-time error, thrown from `parseGpx`/`parseWaypoints`, same posture as the rest of the GPX pipeline today.
- A `route` file referenced in frontmatter but missing on disk: build-time error from the `fs.readFileSync` call, same as the existing `day.gpx` loading code in `index.astro`.
- A day with `route` but an empty `<trk>` (no points): rendered as zero-length route, contributes only its waypoints (if any) to the map; not an error.

## Testing / verification

This repo has no unit test framework; verification is manual, consistent with how the existing GPX import script and per-day maps were verified:

1. Add a `route` GPX (route + a couple of waypoints) to a couple of sardegna-trek days as test content.
2. `npm run build` — a malformed fixture would fail the build, which doubles as a basic correctness check for the parsing code.
3. `./run_preview.sh`, then manually check the trip page:
   - Desktop width: two-column layout, sticky map, scrolling the timeline visibly highlights the corresponding day's route/waypoints on the map, overview baseline stays visible for other days.
   - Mobile width: floating icon appears, tapping it shows a static snapshot of the currently-active day, closing and reopening reflects the (possibly new) active day.
   - Download link on the map matches the active day's `route` file.
4. Confirm a trip with no `route` data anywhere (e.g. re-check another trip, or sardegna-trek before test content is added) renders with no layout change from today.

## Migration

No existing trip has `route`/waypoint data yet. This ships as an additive, opt-in schema field — zero behavior change for existing content until `route` GPX files are authored and added to a trip's frontmatter (a follow-up content task, not part of this implementation).
