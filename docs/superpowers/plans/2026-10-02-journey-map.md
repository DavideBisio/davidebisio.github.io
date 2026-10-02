# Interactive Journey Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a trip-level journey map (full-trip overview + a scroll-synced single-day map) to the trip page, separate from the existing per-day activity maps.

**Architecture:** A new optional per-day `route` GPX field feeds a shared `JourneyDay[]` data shape. A generic `JourneyMap` Leaflet component renders either the full-trip overview (static, top of the Days section) or one day at a time (sticky column on desktop / popup on mobile, via `DayFocusMap` + a `useActiveDay` scrollspy hook). The existing per-day timeline gains `data-day-index` attributes and scroll-snap CSS but is otherwise untouched.

**Tech Stack:** Astro 7, React islands (`@astrojs/react`), Leaflet (already a dependency), Tailwind CSS v4 (CSS-first, no config file) — no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-30-journey-map-design.md`

## Global Constraints

- Do not modify `src/components/TripMap.tsx` or anything driven by the existing per-day `gpx:` field — that feature is untouched.
- The mobile popup is a static snapshot of whichever day was active when opened; it never live-updates while open.
- Waypoint coordinates come only from GPX `<wpt>` data the user supplies — no geocoding.
- This repo has no unit test framework and no `typescript`/`astro check` installed (verified: `npx tsc` isn't available locally) — verification is `npm run build` plus manual checks via `./run_preview.sh`, matching how `parseGpx`/`TripMap` were verified. Do not add a test framework or typecheck tooling as part of this work.
- A trip with no day has a `route`: the page must render pixel-identical to today — no overview map, no width change, no scroll-snap, no `data-day-index` attributes.
- New maps use CARTO Voyager tiles (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`), not the existing per-day maps' OSM raster tiles.
- Scroll-snap uses `proximity`, never `mandatory` (must not trap scroll position on long day content).
- The `wide`/`snapScroll` Layout changes must default to today's behavior (`false`) so every other page is unaffected.

## Review Focus

- A `route` day's original index (`days` array position, used for `data-day-index` and `IntersectionObserver` matching) must never be confused with its position in the filtered `journeyDays` array — mixing these up silently highlights the wrong day. `JourneyDay.dayIndex` must always carry the *original* index; Task 2 and Task 4 pin this down explicitly.
- A `<wpt>` with no `lat`/`lon` attributes at all (not just unparsable ones) must throw, not silently produce `NaN` coordinates that Leaflet would plot at `(NaN, NaN)` — covered by Task 1's negative check.
- A `route` file with an empty `<trk>` (zero `<trkpt>`) but one or more `<wpt>` must still render (markers only, no crash from `fitBounds([])`) — covered by Task 1 (fixture) and Task 6 (visual check).
- `useActiveDay` must not throw when zero `[data-day-index]` elements exist in the DOM yet (e.g. hook mounts before the timeline's first paint, or a trip somehow has no days) — covered by Task 5's early-return guard.
- The mobile floating button and popup must never render when `journeyDays` is empty, even if `DayFocusMap` were accidentally mounted on a non-journey trip — covered by Task 5's `days.length === 0` guard.

---

## Task 1: Waypoint parsing, schema field, and fixture data

**Files:**
- Modify: `src/lib/gpx.ts` — add `GpxWaypoint` interface and `parseWaypoints`
- Modify: `src/content.config.ts` — add `route` field to the day schema
- Create: `src/content/trips/sardegna-trek/2026-09-12-route.gpx`
- Create: `src/content/trips/sardegna-trek/2026-09-13-route.gpx`
- Create: `src/content/trips/sardegna-trek/2026-09-14-route.gpx` (empty-track edge case: waypoint only, no `<trkpt>`)

**Interfaces:**
- Produces: `export interface GpxWaypoint { name: string; lat: number; lon: number }` and `export function parseWaypoints(xml: string): GpxWaypoint[]` from `src/lib/gpx.ts`.
- Produces: optional `route?: string` field on each day in the `trips` collection schema.

- [ ] **Step 1: Add `parseWaypoints` to `src/lib/gpx.ts`**

Add after the existing `NAME_RE` constant and before `haversineKm`:

```ts
export interface GpxWaypoint {
  name: string;
  lat: number;
  lon: number;
}

const WPT_RE = /<wpt\b([^>]*?)>([\s\S]*?)<\/wpt>/g;
const WPT_NAME_RE = /<name>([^<]*)<\/name>/;
```

Add at the end of the file, after `parseGpx`:

```ts
/** Parses `<wpt>` entries (named waypoints) from raw GPX XML. Skips a `<wpt>`
 * with no `<name>`; throws on one with unparsable lat/lon, consistent with
 * parseGpx's build-time-fail posture for malformed GPX. */
export function parseWaypoints(xml: string): GpxWaypoint[] {
  const waypoints: GpxWaypoint[] = [];
  let match: RegExpExecArray | null;

  WPT_RE.lastIndex = 0;
  while ((match = WPT_RE.exec(xml)) !== null) {
    const attrs = match[1];
    const inner = match[2];
    const nameMatch = WPT_NAME_RE.exec(inner);
    if (!nameMatch) continue;

    const latMatch = LAT_RE.exec(attrs);
    const lonMatch = LON_RE.exec(attrs);
    if (!latMatch || !lonMatch) {
      throw new Error(`<wpt> "${nameMatch[1].trim()}" is missing a parsable lat/lon`);
    }

    waypoints.push({
      name: nameMatch[1].trim(),
      lat: Number.parseFloat(latMatch[1]),
      lon: Number.parseFloat(lonMatch[1]),
    });
  }

  return waypoints;
}
```

- [ ] **Step 2: Verify `parseWaypoints` against real fixture content and a negative case**

Fixture files don't exist yet, so verify with inline XML first. Run:

```bash
cd /home/dbisio/prj/davidebisio.github.io
node --experimental-strip-types -e '
import { parseWaypoints } from "./src/lib/gpx.ts";

const ok = `<gpx><wpt lat="40.2861" lon="9.4039"><name>Oliena</name></wpt></gpx>`;
console.log(JSON.stringify(parseWaypoints(ok)));

const noName = `<gpx><wpt lat="1" lon="2"></wpt></gpx>`;
console.log("no-name count:", parseWaypoints(noName).length);

try {
  parseWaypoints(`<gpx><wpt><name>Bad</name></wpt></gpx>`);
  console.log("FAIL: expected throw for missing lat/lon");
} catch (e) {
  console.log("OK, threw:", e.message);
}
'
```

Expected output: the Oliena waypoint as JSON, `no-name count: 0`, and `OK, threw: <wpt> "Bad" is missing a parsable lat/lon`.

- [ ] **Step 3: Add the `route` field to the trips schema**

In `src/content.config.ts`, in the day object schema, right after the `gpx` line:

```ts
            // Filenames of colocated .gpx files (relative to the trip folder), e.g. ["./ride.gpx"].
            gpx: z.array(z.string()).default([]),
            // Optional per-day travel route + waypoints for the trip-level journey map
            // (relative to the trip folder) — separate from the activity gpx above.
            route: z.string().optional(),
```

- [ ] **Step 4: Add the three fixture GPX files**

`src/content/trips/sardegna-trek/2026-09-12-route.gpx`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="journey-map-fixture" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Drive towards Oliena</name>
    <trkseg>
      <trkpt lat="40.7784" lon="9.6803"><time>2026-09-12T09:30:00Z</time></trkpt>
      <trkpt lat="40.4581" lon="9.6773"><time>2026-09-12T11:15:00Z</time></trkpt>
      <trkpt lat="40.2861" lon="9.4039"><time>2026-09-12T13:00:00Z</time></trkpt>
    </trkseg>
  </trk>
  <wpt lat="40.7784" lon="9.6803"><name>San Teodoro</name></wpt>
  <wpt lat="40.4581" lon="9.6773"><name>Marina di Orosei</name></wpt>
  <wpt lat="40.2861" lon="9.4039"><name>Oliena</name></wpt>
</gpx>
```

`src/content/trips/sardegna-trek/2026-09-13-route.gpx`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="journey-map-fixture" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Hiking to Punta Corrasi</name>
    <trkseg>
      <trkpt lat="40.2861" lon="9.4039"><time>2026-09-13T06:30:00Z</time></trkpt>
      <trkpt lat="40.3050" lon="9.4100"><time>2026-09-13T08:00:00Z</time></trkpt>
      <trkpt lat="40.3200" lon="9.4250"><time>2026-09-13T10:00:00Z</time></trkpt>
    </trkseg>
  </trk>
  <wpt lat="40.3200" lon="9.4250"><name>Punta Corrasi</name></wpt>
</gpx>
```

`src/content/trips/sardegna-trek/2026-09-14-route.gpx` (edge case: no `<trkpt>`, waypoint only):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="journey-map-fixture" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Hiking to Punta Cusidore</name>
    <trkseg></trkseg>
  </trk>
  <wpt lat="40.3100" lon="9.4400"><name>Punta Cusidore</name></wpt>
</gpx>
```

- [ ] **Step 5: Verify the fixtures parse correctly**

```bash
cd /home/dbisio/prj/davidebisio.github.io
node --experimental-strip-types -e '
import { readFileSync } from "node:fs";
import { parseGpx, parseWaypoints } from "./src/lib/gpx.ts";

for (const f of ["2026-09-12", "2026-09-13", "2026-09-14"]) {
  const xml = readFileSync(`./src/content/trips/sardegna-trek/${f}-route.gpx`, "utf-8");
  const track = parseGpx(xml);
  const wpts = parseWaypoints(xml);
  console.log(f, "points:", track.points.length, "waypoints:", wpts.map((w) => w.name));
}
'
```

Expected: `2026-09-12 points: 3 waypoints: [ "San Teodoro", "Marina di Orosei", "Oliena" ]`, `2026-09-13 points: 3 waypoints: [ "Punta Corrasi" ]`, `2026-09-14 points: 0 waypoints: [ "Punta Cusidore" ]`.

- [ ] **Step 6: Build check**

```bash
cd /home/dbisio/prj/davidebisio.github.io && npm run build
```

Expected: succeeds (the new schema field is optional and unreferenced so far; the fixture files aren't referenced by any frontmatter yet).

- [ ] **Step 7: Commit**

```bash
git add src/lib/gpx.ts src/content.config.ts src/content/trips/sardegna-trek/2026-09-12-route.gpx src/content/trips/sardegna-trek/2026-09-13-route.gpx src/content/trips/sardegna-trek/2026-09-14-route.gpx
git commit -m "Add waypoint parsing, route schema field, and journey-map fixtures

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Arkc4JgSpJEjrH6U9c8ae5"
```

---

## Task 2: Wire route/waypoint data loading into the trip page

**Files:**
- Create: `src/lib/journey.ts`
- Modify: `src/pages/travel/[trip]/index.astro`
- Modify: `src/content/trips/sardegna-trek/sardegna-trek.md` — add `route:` to the 2026-09-12, 2026-09-13, 2026-09-14 days

**Interfaces:**
- Consumes: `parseGpx`, `parseWaypoints` from `../../../lib/gpx` (Task 1); `TripDay` from `../../../lib/trips`.
- Produces: `export interface JourneyDay { dayIndex: number; label: string; points: [number, number][]; waypoints: { name: string; lat: number; lon: number }[]; gpxHref: string | null }` from `src/lib/journey.ts`; a `journeyDays: JourneyDay[]` array computed in `index.astro`'s frontmatter, consumed by Task 3/4/5.

- [ ] **Step 1: Create the shared `JourneyDay` type**

`src/lib/journey.ts`:

```ts
/** One day's data for the trip-level journey map — distinct from the
 * existing per-day activity GpxTrack: dayIndex is the index into the full
 * `days[]` array (not the filtered journey-days list), so it stays valid
 * for matching against the timeline's `data-day-index` attributes. */
export interface JourneyDay {
  dayIndex: number;
  label: string;
  points: [number, number][];
  waypoints: { name: string; lat: number; lon: number }[];
  gpxHref: string | null;
}
```

- [ ] **Step 2: Add `loadRoute` and `journeyDays` to `index.astro`**

Add the import, alongside the existing ones at the top of the frontmatter:

```ts
import { parseGpx, parseWaypoints } from '../../../lib/gpx';
import type { JourneyDay } from '../../../lib/journey';
```

(`parseGpx` is already imported — just add `parseWaypoints` to that same import line and add the new type import below it.)

Add after the existing `loadTracks` function:

```ts
async function loadRoute(day: TripDay, dayIndex: number): Promise<JourneyDay | null> {
  if (!day.route || !trip.filePath) return null;
  const tripDir = path.posix.dirname(trip.filePath);
  const routeRelPath = path.posix.join(tripDir, day.route.replace(/^\.\//, ''));
  const xml = fs.readFileSync(path.join(process.cwd(), routeRelPath), 'utf-8');
  const track = parseGpx(xml);
  return {
    dayIndex,
    label: day.title,
    points: track.points.map((p) => [p.lat, p.lon] as [number, number]),
    waypoints: parseWaypoints(xml),
    gpxHref: gpxUrls[`/${routeRelPath}`] ?? null,
  };
}
```

Add after the existing `const dayExtras = await Promise.all(...)` block:

```ts
const journeyDays = (await Promise.all(days.map((day, i) => loadRoute(day, i)))).filter(
  (d): d is JourneyDay => d !== null,
);
```

- [ ] **Step 3: Reference the fixtures in `sardegna-trek.md`**

Add a `route:` line to the three days' frontmatter (right after each day's `gpx:` block where present, or after `activities:` otherwise):

```yaml
  - date: 2026-09-12
    title: "Drive towards Oliena + detours"
    places: ["San Teodoro", "Marina di Orosei", "Oliena"]
    activities: ["Cortes Apertas Oliena"]
    route: "./2026-09-12-route.gpx"
    notes: |
```

```yaml
  - date: 2026-09-13
    title: "Punta Corrasi hike"
    places: ["Oliena", "Punta Corrasi"]
    activities: ["Hiking to Punta Corrasi"]
    gpx:
      - "./hiking-to-punta-corrasi.gpx"
    route: "./2026-09-13-route.gpx"
    notes: |
```

```yaml
  - date: 2026-09-14
    title: "Punta Cusidore hike"
    places: ["Oliena", "Punta Cusidore", "Orgoi", "Su Golgone"]
    activities: ["Hiking to Punta Cusidore"]
    gpx:
      - "./hiking-to-punta-cusidore.gpx"
    route: "./2026-09-14-route.gpx"
    notes: |
```

- [ ] **Step 4: Temporarily verify the data shape, then remove the scaffold**

Add a temporary debug line right after the `<Content />` block in the template:

```astro
<pre class="text-xs">{JSON.stringify(journeyDays, null, 2)}</pre>
```

Run `./run_preview.sh`, open the sardegna-trek trip page, and confirm three entries with `dayIndex` 1, 2, 3 (0-indexed position of 09-12/09-13/09-14 in the sorted `days` array), correct `label`s, 3/3/0 points respectively, and the expected waypoint names. Then delete the `<pre>` debug line.

- [ ] **Step 5: Build check**

```bash
cd /home/dbisio/prj/davidebisio.github.io && npm run build
```

Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/journey.ts src/pages/travel/[trip]/index.astro src/content/trips/sardegna-trek/sardegna-trek.md
git commit -m "Load per-day route/waypoint data for the journey map

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Arkc4JgSpJEjrH6U9c8ae5"
```

---

## Task 3: `JourneyMap` component + full-trip overview map

**Files:**
- Create: `src/components/JourneyMap.tsx`
- Modify: `src/pages/travel/[trip]/index.astro`

**Interfaces:**
- Consumes: `JourneyDay` from `../lib/journey` (Task 2).
- Produces: `export default function JourneyMap(props: { days: JourneyDay[]; mode: 'overview' | 'single-day'; activeDayIndex?: number })`, used directly here for the overview and later (Task 5) via `DayFocusMap` for single-day mode.

- [ ] **Step 1: Create `src/components/JourneyMap.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { JourneyDay } from '../lib/journey';

interface Props {
  days: JourneyDay[];
  mode: 'overview' | 'single-day';
  activeDayIndex?: number;
}

const VOYAGER_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const VOYAGER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function JourneyMap({ days, mode, activeDayIndex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const visibleDays = mode === 'overview' ? days : days.filter((d) => d.dayIndex === activeDayIndex);

  useEffect(() => {
    if (!containerRef.current || visibleDays.length === 0) return;
    let cancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current);
      mapRef.current = map;

      L.tileLayer(VOYAGER_TILE_URL, { attribution: VOYAGER_ATTRIBUTION, maxZoom: 19 }).addTo(map);

      const bounds: [number, number][] = [];
      for (const day of visibleDays) {
        if (day.points.length > 0) {
          L.polyline(day.points, {
            color: '#0284c7',
            weight: mode === 'overview' ? 2 : 4,
            opacity: mode === 'overview' ? 0.6 : 0.9,
          }).addTo(map);
          bounds.push(...day.points);
        }
        for (const wpt of day.waypoints) {
          L.circleMarker([wpt.lat, wpt.lon], {
            radius: 5,
            color: '#dc2626',
            fillColor: '#dc2626',
            fillOpacity: 1,
          })
            .addTo(map)
            .bindTooltip(wpt.name);
          bounds.push([wpt.lat, wpt.lon]);
        }
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [16, 16] });
      } else {
        map.setView([0, 0], 2);
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mode, activeDayIndex, days]);

  if (visibleDays.length === 0) return null;

  const singleDay = mode === 'single-day' ? visibleDays[0] : null;

  return (
    <div>
      <div ref={containerRef} className="h-80 w-full rounded-lg border border-slate-200 dark:border-slate-800" />
      {singleDay && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="font-medium">{singleDay.label}</span>
          {singleDay.gpxHref && (
            <a href={singleDay.gpxHref} download className="font-medium text-sky-600 dark:text-sky-400">
              Download GPX
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount the overview map in `index.astro`**

Add the import:

```ts
import JourneyMap from '../../../components/JourneyMap.tsx';
```

Insert right after the `{days.length > 0 && <h2 ...>Days</h2>}` line and before the `<ol>`:

```astro
{journeyDays.length > 0 && (
  <div class="mb-8">
    <JourneyMap client:visible days={journeyDays} mode="overview" />
  </div>
)}
```

- [ ] **Step 3: Visual verification**

```bash
./run_preview.sh
```

Open the sardegna-trek trip page. Confirm: a map renders above the day timeline showing all three fixture days' routes together (thin blue lines) plus their waypoints (red dots with name tooltips on hover), using the CARTO Voyager basemap (visibly flatter/simpler than the OSM tiles on the per-day maps further down the page), fitted to the combined extent.

- [ ] **Step 4: Commit**

```bash
git add src/components/JourneyMap.tsx "src/pages/travel/[trip]/index.astro"
git commit -m "Add JourneyMap component and mount the full-trip overview map

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Arkc4JgSpJEjrH6U9c8ae5"
```

---

## Task 4: Page width, scroll-snap, and the two-column grid shell

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/pages/travel/[trip]/index.astro`

**Interfaces:**
- Produces: `Layout` gains optional props `wide?: boolean` and `snapScroll?: boolean` (both default `false`); `Header`/`Footer` gain optional `wide?: boolean` (default `false`).

- [ ] **Step 1: Add `wide`/`snapScroll` to `Layout.astro`**

```astro
interface Props {
  title: string;
  description?: string;
  wide?: boolean;
  snapScroll?: boolean;
}

const { title, description = 'Personal site of Davide Bisio.', wide = false, snapScroll = false } = Astro.props;
```

Change the `<html>` and `<body>`/`<main>` lines:

```astro
<html lang="en" class:list={[snapScroll && 'snap-y snap-proximity']}>
```

```astro
  <body class="flex min-h-screen flex-col">
    <Header wide={wide} />
    <main class:list={['mx-auto w-full flex-1 px-4 py-10', wide ? 'max-w-6xl' : 'max-w-3xl']}>
      <slot />
    </main>
    <Footer wide={wide} />
  </body>
```

- [ ] **Step 2: Add `wide` to `Header.astro`**

```astro
interface Props {
  wide?: boolean;
}
const { wide = false } = Astro.props;
const navItems = [
```

```astro
  <nav class:list={['mx-auto flex items-center justify-between px-4 py-4', wide ? 'max-w-6xl' : 'max-w-3xl']}>
```

- [ ] **Step 3: Add `wide` to `Footer.astro`**

```astro
interface Props {
  wide?: boolean;
}
const { wide = false } = Astro.props;
const year = new Date().getFullYear();
```

```astro
  <div class:list={['mx-auto flex flex-wrap items-center justify-between gap-4 px-4', wide ? 'max-w-6xl' : 'max-w-3xl']}>
```

- [ ] **Step 4: Pass `wide`/`snapScroll` from the trip page, add the grid shell and day attributes**

In `index.astro`, after `const journeyDays = ...`, add:

```ts
const hasJourney = journeyDays.length > 0;
```

Change the `<Layout>` opening tag:

```astro
<Layout title={trip.data.title} description={trip.data.description} wide={hasJourney} snapScroll={hasJourney}>
```

In `index.astro` (currently lines 95–176), three separate, surgical changes — leave every other line of the `<ol>`/`days.map` block exactly as it is today:

1. Change the opening `<ol ...>` tag (currently its own line, right before `{`):

```astro
    <ol class="relative space-y-10 border-l border-slate-200 pl-6 dark:border-slate-800">
```

Wrap it with a new grid `<div>` — i.e. insert one line before it:

```astro
  <div class:list={['gap-8', hasJourney && 'lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start']}>
    <ol class="relative space-y-10 border-l border-slate-200 pl-6 dark:border-slate-800">
```

2. Change only the day `<li>` opening tag, from:

```astro
          <li class="relative">
```

to:

```astro
          <li
            class:list={['relative', hasJourney && 'snap-start']}
            data-day-index={hasJourney ? i : undefined}
          >
```

Every line inside the `<li>` (the dot span, `<time>`, `<h3>`, places, activities, notes, photos, tracks) stays exactly as it is today — only this opening tag changes.

3. After the closing `</ol>` (and its enclosing `}` from the `days.map` expression), close the new grid `<div>` and add the sticky placeholder as its second child:

```astro
    </ol>

    {hasJourney && (
      <div class="lg:sticky lg:top-6">
        <div class="hidden h-80 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400 lg:flex dark:border-slate-700">
          Map placeholder (Task 5 replaces this with DayFocusMap)
        </div>
      </div>
    )}
  </div>
```

- [ ] **Step 5: Visual verification**

```bash
./run_preview.sh
```

Open the sardegna-trek trip page at a desktop width: confirm the page content is now wider (header/footer/main all widen together), a dashed placeholder box appears sticky in a right column as you scroll, and scrolling the timeline now gently settles ("snaps") near the top of each day instead of free-scrolling. Then open `/` and `/articles/` (or `/cv/`) and confirm they're unchanged — same narrow width, no snapping.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Layout.astro src/components/Header.astro src/components/Footer.astro "src/pages/travel/[trip]/index.astro"
git commit -m "Add wide/snapScroll layout support and the journey-map grid shell

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Arkc4JgSpJEjrH6U9c8ae5"
```

---

## Task 5: Scrollspy hook + `DayFocusMap` (sticky desktop panel, mobile popup)

**Files:**
- Create: `src/components/useActiveDay.ts`
- Create: `src/components/DayFocusMap.tsx`
- Modify: `src/pages/travel/[trip]/index.astro`

**Interfaces:**
- Consumes: `JourneyMap` (Task 3), `JourneyDay` (Task 2), `journeyDays` (Task 2).
- Produces: `export function useActiveDay(): number | null`; `export default function DayFocusMap(props: { days: JourneyDay[] })`.

- [ ] **Step 1: Create `src/components/useActiveDay.ts`**

```ts
import { useEffect, useState } from 'react';

/** Tracks which day's timeline entry (by its `data-day-index` attribute) is
 * currently crossing a thin band near the top of the viewport, scrollspy-style.
 * Returns null if no day is currently in that band, or no `[data-day-index]`
 * elements exist in the DOM yet. */
export function useActiveDay(): number | null {
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-day-index]'));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        const index = Number(topMost.target.getAttribute('data-day-index'));
        setActiveDayIndex(Number.isNaN(index) ? null : index);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return activeDayIndex;
}
```

- [ ] **Step 2: Create `src/components/DayFocusMap.tsx`**

```tsx
import { useState } from 'react';
import JourneyMap from './JourneyMap';
import { useActiveDay } from './useActiveDay';
import type { JourneyDay } from '../lib/journey';

interface Props {
  days: JourneyDay[];
}

function resolveActiveDay(days: JourneyDay[], activeDayIndex: number | null): JourneyDay | null {
  if (days.length === 0) return null;
  if (activeDayIndex === null) return days[0];
  let candidate: JourneyDay | null = null;
  for (const day of days) {
    if (day.dayIndex <= activeDayIndex) candidate = day;
  }
  return candidate ?? days[0];
}

export default function DayFocusMap({ days }: Props) {
  const activeDayIndex = useActiveDay();
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [snapshotDayIndex, setSnapshotDayIndex] = useState<number | null>(null);

  if (days.length === 0) return null;

  const activeDay = resolveActiveDay(days, activeDayIndex);
  if (!activeDay) return null;

  return (
    <>
      <div className="hidden lg:block">
        <JourneyMap days={days} mode="single-day" activeDayIndex={activeDay.dayIndex} />
      </div>

      <button
        type="button"
        onClick={() => {
          setSnapshotDayIndex(activeDay.dayIndex);
          setPopupOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg lg:hidden"
        aria-label="Show day map"
      >
        🗺
      </button>

      {isPopupOpen && snapshotDayIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 lg:hidden"
          onClick={() => setPopupOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-4 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{days.find((d) => d.dayIndex === snapshotDayIndex)?.label}</p>
              <button type="button" onClick={() => setPopupOpen(false)} aria-label="Close" className="text-xl leading-none">
                &times;
              </button>
            </div>
            <JourneyMap days={days} mode="single-day" activeDayIndex={snapshotDayIndex} />
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Replace the Task 4 placeholder in `index.astro`**

Add the import:

```ts
import DayFocusMap from '../../../components/DayFocusMap.tsx';
```

Replace the placeholder `<div>` added in Task 4 with:

```astro
    {hasJourney && (
      <div class="lg:sticky lg:top-6">
        <DayFocusMap client:load days={journeyDays} />
      </div>
    )}
```

- [ ] **Step 4: Visual verification**

```bash
./run_preview.sh
```

Desktop width: confirm the sticky right column now shows a single-day map (not the overview), and scrolling the timeline through the 09-12/09-13/09-14 days swaps the map to each day's route/waypoints in turn, with a "Download GPX" link that matches the active day's route file. Resize to mobile width: confirm the sticky column disappears, a round map-icon button appears bottom-right, and tapping it opens a popup showing the day that was active when you tapped it; scroll the page behind a closed popup to a different day, reopen the popup, and confirm it now shows the new day (not a live update while it was open).

- [ ] **Step 5: Commit**

```bash
git add src/components/useActiveDay.ts src/components/DayFocusMap.tsx "src/pages/travel/[trip]/index.astro"
git commit -m "Add scrollspy hook and DayFocusMap sticky/popup single-day map

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Arkc4JgSpJEjrH6U9c8ae5"
```

---

## Task 6: Full verification pass against the spec checklist

**Files:** none (verification only; fix forward in the relevant file if something fails)

- [ ] **Step 1: Full build**

```bash
cd /home/dbisio/prj/davidebisio.github.io && npm run build
```

Expected: succeeds, including `dist/cv.pdf` generation (unrelated but part of the build script) unaffected.

- [ ] **Step 2: Run through the spec's testing checklist**

```bash
./run_preview.sh
```

- Overview map renders at the top of the Days section, full-width, showing all three fixture days' routes/waypoints together.
- Desktop: two-column grid below it; scrolling snaps one day at a time; the sticky map swaps to show only the active day.
- Mobile: floating icon appears; tapping shows a static snapshot; closing and reopening after scrolling reflects the new active day.
- The empty-track fixture day (2026-09-14, waypoint only) shows correctly on both the overview and single-day map with no console errors (open devtools, confirm no uncaught exceptions when that day is active).
- Download link next to the single-day map matches that day's `./2026-09-1X-route.gpx` file (compare the link's filename).

- [ ] **Step 3: Regression-check a trip with no `route` data**

Temporarily check out another trip page (or view sardegna-trek before Task 1's frontmatter changes via `git show HEAD~5:...` is unnecessary — instead, pick any other existing trip under `src/content/trips/` with no `route` field, or if sardegna-trek is the only trip, temporarily comment out the three `route:` lines, reload, and confirm: no overview map, no width change, no scroll-snap, no floating button — then restore the three lines).

- [ ] **Step 4: Fix forward**

If any check in Steps 2–3 fails, fix it in the task file responsible (don't add new files for this task) and re-run the relevant check. Commit the fix with a message describing what was wrong, e.g.:

```bash
git add -A
git commit -m "Fix <specific issue found during journey map verification>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Arkc4JgSpJEjrH6U9c8ae5"
```

If everything passes, no commit is needed for this task.
