# Interactive day-to-day journey map

## Summary

Add a new, trip-level "journey map" to the trip page (`src/pages/travel/[trip]/index.astro`): a static full-trip overview map at the top of the Days section, plus a single-day map that follows the visitor's scroll through the day-by-day timeline — snapped one day at a time — showing only the currently active day's route and waypoints. This is a separate feature from the existing per-day activity maps (`TripMap.tsx`, driven by `day.gpx`) — that component and its data are untouched.

## Goals

- Render a static overview map, showing every day's travel route + waypoints together, at the top of the Days section.
- As the visitor scrolls the day timeline, show the single active day's route/waypoints on a second, scroll-synced map (sticky column on desktop, popup on mobile) — not blended with the other days.
- Make the timeline scroll snap to one day at a time, so each day is brought fully into focus as the visitor scrolls.
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

A single React component, parameterized by a `mode` prop, used in two places on the trip page:

```ts
interface JourneyDay {
  dayIndex: number;       // index into the full days[] array, for scroll-sync matching
  label: string;          // day title, for tooltips/labels
  points: [number, number][];
  waypoints: { name: string; lat: number; lon: number }[];
  gpxHref: string | null; // for the download link
}

interface JourneyMapProps {
  days: JourneyDay[];
  mode: 'overview' | 'single-day';
  activeDayIndex?: number; // required when mode === 'single-day'
}
```

Rendering:

- `mode="overview"`: draws every day's route + waypoints together (uniform styling, no highlighting), `fitBounds` to the whole trip extent once on mount. Static — no scroll interaction, no re-renders after mount.
- `mode="single-day"`: draws only `days[activeDayIndex]`'s route and waypoints, `fitBounds`/pans to that one day's extent. Re-renders (re-fits, redraws) whenever `activeDayIndex` changes.
- Basemap (both modes): CARTO Voyager tiles (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`, with CARTO's required attribution alongside the OSM one) instead of the existing per-day maps' OSM raster tiles — keeps roads and labels visible while dropping terrain/land-use detail.
- `mode="single-day"` additionally shows a "Download GPX" link/control for the active day, reusing the existing `import.meta.glob(...).../*.gpx', { query: '?url' })` pattern already used for per-day downloads in `index.astro`.

### Scroll-sync

Each existing timeline `<li>` in `index.astro` gets a `data-day-index={i}` attribute (the only structural change to the existing timeline markup). A small controller — a `useActiveDay(dayIndices)` hook, since both the sticky desktop map and the mobile trigger button need the current active day — sets up an `IntersectionObserver` over all `[data-day-index]` elements on mount, and tracks the topmost currently-intersecting day as `activeDayIndex`.

If the active day has no `route` (wasn't in the `JourneyDay[]` prop array), fall back to the nearest earlier day that does have one, to avoid the single-day map blanking out or flickering between unrelated days while scrolling past route-less days.

### Scroll snapping

The timeline scrolls one day at a time instead of free-scrolling: each day `<li>` gets Tailwind's `snap-start`, and the page's scrolling root gets `snap-y snap-proximity` (CSS `scroll-snap-type: y proximity`), scoped to the trip page only via a `<style is:global>` block targeting `html` inside `index.astro` (not a change to the shared `Layout.astro`, so other pages are unaffected). `proximity` (not `mandatory`) is used so long-content days don't trap the scroll position — the browser still gently settles on the nearest day boundary when scroll momentum stops near one, without blocking free scrolling through tall content in between.

### Full-trip overview placement

The `mode="overview"` map renders once, full-width, at the top of the Days section (immediately below the "Days" heading, above the two-column grid described next) — this is the "full trip description" moved to the top, rather than being something only pieced together implicitly while scrolling.

### Desktop layout

Below the overview map, `index.astro` wraps the existing `<ol>` timeline and a `<JourneyMap mode="single-day" client:load>` in a two-column CSS grid:

- Left column: the existing timeline, completely unchanged (plus the new `data-day-index` attributes and scroll-snap classes).
- Right column: the single-day `<JourneyMap>`, `position: sticky` with a `top` offset and `align-self: start`, so it stays pinned in the viewport while the left column scrolls.
- The trip page's `<main>` is wrapped at `max-w-3xl` today (`Layout.astro`), too narrow for a real two-column layout. `Layout.astro` gets a new optional `wide` boolean prop (default `false`, preserving today's width everywhere else); the trip page passes `wide` only when at least one day has a `route`.
- The whole journey-map section (overview map + two-column grid) is only rendered when at least one day has a `route`; trips with no journey-map data render exactly as today, at the existing width.

### Mobile layout

Below a breakpoint (Tailwind `lg:` or similar), the sticky right column is hidden (the overview map at the top still renders, full-width, on mobile too). Instead of the sticky single-day map:

- A floating button (fixed position, bottom-right, map icon) is shown whenever at least one day has a `route`.
- Tapping it opens a modal that lazily mounts `<JourneyMap mode="single-day">` for whichever day `useActiveDay` currently reports (the hook keeps running in the background via the same `IntersectionObserver`, independent of whether the sticky column is visible) at the moment the button was tapped.
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
   - The overview map renders at the top of the Days section, full-width, showing every route/waypoint together.
   - Desktop width: two-column layout below it, sticky single-day map, scrolling the timeline snaps one day at a time and the map swaps to show only the active day's route/waypoints.
   - Mobile width: floating icon appears, tapping it shows a static snapshot of the currently-active day, closing and reopening reflects the (possibly new) active day.
   - Download link on the map matches the active day's `route` file.
4. Confirm a trip with no `route` data anywhere (e.g. re-check another trip, or sardegna-trek before test content is added) renders with no layout change from today (narrow width, no overview map, no scroll-snap).

## Migration

No existing trip has `route`/waypoint data yet. This ships as an additive, opt-in schema field — zero behavior change for existing content until `route` GPX files are authored and added to a trip's frontmatter (a follow-up content task, not part of this implementation).
