# davidebisio.github.io

Personal site built with [Astro](https://astro.build), deployed to GitHub Pages.

## Structure

```text
src/
  content/
    articles/
      hobby/          # hobby articles (.md or .mdx)
      professional/   # professional articles (.md or .mdx)
    trips/
      <trip-slug>/
        <trip-slug>.md     # one file for the whole trip: overview + all days
        gpx/                # GPX tracks, auto-matched to a day (see "Adding a trip")
        jpg/                # pictures, auto-matched to a day by EXIF date taken
  content.config.ts  # collection schemas: articles, trips
  data/cv.ts         # CV content: profile, experience, education, skills tree
  lib/                # articleSlug/tripSlug helpers, build-time GPX parsing
  components/         # Header, Footer, ArticleList, SkillsTree, Lightbox, JourneyMap, DayFocusMap, useActiveDay
  layouts/            # Layout, ArticleLayout
  pages/
    index.astro
    cv/index.astro
    articles/index.astro          # professional articles
    interests/index.astro         # hobby articles
    articles/[...slug].astro      # /articles/<slug>/ (also serves /interests/<slug>/)
    travel/index.astro            # travel timeline (one entry per trip)
    travel/[trip]/index.astro     # trip overview + a timeline of that trip's days, inline
```

## Setup (WSL)

The project's `node`/`npm` need to be Linux-native — the Windows binaries that
are on `PATH` by default in WSL can't build native modules against files on
the Linux filesystem. Run once:

```bash
./setup.sh
```

This installs Node into `~/.local/opt` (no sudo) and adds it to `PATH` via
`~/.bashrc`. Open a new terminal (or `source ~/.bashrc`) afterwards, then
`npm install`.

## Commands

| Command                              | Action                                                     |
| :------------------------------------ | :----------------------------------------------------------- |
| `./setup.sh`                          | One-time (WSL): install Linux-native Node, wire it into PATH |
| `npm install`                         | Install dependencies                                          |
| `npm run dev`                         | Start the dev server in the foreground (`localhost:4321`)    |
| `npm run build`                       | Build the site to `./dist/`, then render `dist/cv.pdf`        |
| `npm run preview`                     | Preview the production build locally                          |
| `npm run import-gpx -- <trip-slug>`   | Import raw Garmin `activity_*.gpx` exports into a trip         |

The `astro` CLI itself (`astro dev --background`/`stop`/`status`/`logs`, for
running the dev server in the background) isn't on `PATH` by default — it's a
local dependency in `node_modules/.bin`. Reach it either with `npx astro ...`
from anywhere, or with `./run_preview.sh [start|stop|status|logs]`, a thin
wrapper that also fixes `PATH` for the WSL Node from `setup.sh` above.

## Adding an article

Add a `.md` or `.mdx` file under `src/content/articles/hobby/` or `src/content/articles/professional/` with frontmatter:

```yaml
---
title: "Article title"
description: "One-sentence summary."
pubDate: 2026-01-01
category: hobby # or professional
tags: ["optional", "tags"]
---
```

## Adding a trip

Create a folder under `src/content/trips/<trip-slug>/` with one comprehensive
markdown file for the whole trip, plus `gpx/` and `jpg/` subfolders for
tracks and pictures. Nothing in `gpx/` or `jpg/` is referenced from the
markdown — both are scanned and matched to a day automatically at build time:

```text
src/content/trips/<trip-slug>/
  <trip-slug>.md
  gpx/
    <trip-slug>-route.gpx    # optional: combined driving routes + waypoints
    some-hike.gpx             # optional: one file per day's activity
  jpg/
    some-photo.jpg             # optional
```

`<trip-slug>.md` frontmatter — trip metadata plus a `days` array (each day is
rendered as one entry in that trip's timeline, in page order sorted by date):

```yaml
---
title: "Trip title"
description: "One-sentence summary."
startDate: 2026-06-06
endDate: 2026-06-07
location: "Town"
country: "Country" # optional
tags: ["optional", "tags"]
days:
  - date: 2026-06-06
    title: "Day title"
    places: ["Place A", "Place B"] # optional
    activities: ["Hike", "Ride"] # optional
    notes: |
      Free-form prose for the day. Blank lines start a new paragraph.
---

Trip-level intro/overview markdown goes in the file body, same as an article.
```

### How `gpx/` and `jpg/` are matched to a day

- **`gpx/<trip-slug>-route.gpx`** (filename ending in `-route.gpx`) is treated
  as one combined file holding every day's driving route as a separately
  named `<trk>` (`"Route DD/MM/YYYY"`) plus a shared set of `<wpt>`
  waypoints, for the trip-level journey map. There's at most one of these.
- **Every other file in `gpx/`** is a single day's activity track (a hike,
  run, etc.), matched to its day by the date on its own GPX points — not by
  filename — so it can be named anything. A day with no matching file simply
  has no activity track; a day can have more than one.
- **Every file in `jpg/`** is matched to a day by its EXIF "date taken"
  (`DateTimeOriginal`/`CreateDate`), not the file's modify date — which for
  Lightroom-exported files reflects export time, not capture time. A photo
  with neither tag is skipped with a build warning.

When a day has a matching track, its timeline entry parses it at build time
(no parser shipped to the client) and renders distance/elevation/duration
stats, a "Download activity GPX" link, and — if the combined route file has
an entry for that day — a "Download route GPX" link. There's no per-day
inline map: a single Leaflet map (`DayFocusMap`) stays synced to whichever
day is scrolled to the top of the viewport — sticky alongside the timeline on
desktop, behind a floating button that opens it as a popup on narrower
screens. When a day has matching photos, small thumbnails are shown inline
and clicking one opens it full-size in a lightbox.

### Importing GPX tracks from Garmin Connect

Export each day's activity from Garmin Connect (default filename
`activity_<id>.gpx`) and drop the raw files into the trip's folder (next to
`<trip-slug>.md`, not inside `gpx/`), then run:

```bash
npm run import-gpx -- <trip-slug>
```

For each raw file, `scripts/import-gpx-tracks.mjs`:

- Reads its `<metadata><time>` to find which trip day it belongs to, matched
  by date against that day's `date` in the trip's frontmatter.
- Picks the matching entry from that day's `activities` — when a day lists
  more activities than it has GPX files, it prefers whichever activity text
  reads as a tracked activity (hike/run/ride/walk/ski/swim/...) — purely to
  name the output file; the day match itself is always by date.
- Renames the file in kebab case after that activity text and sets
  `<trk><name>` to the same text.
- Strips Garmin-specific extras — heart rate, cadence, the Connect link,
  `<desc>`/`<type>` — down to a plain GPX 1.1 file with only position,
  elevation, and time.
- Writes the cleaned file into `gpx/` and deletes the raw file. No frontmatter
  edit is needed — the site matches it back to the same day by date at build
  time.

It refuses to guess and exits with an error, before touching any file, when a
day has more GPX files than activities, no activities at all, or an ambiguous
match (more than one activity reads as tracked but only one file to assign).
Running it again with no raw `activity_*.gpx` files left is a no-op, so it's
safe to re-run.

## Editing the CV

Edit `src/data/cv.ts`. The `/cv/` page and the downloadable PDF (`dist/cv.pdf`, generated at build time from that same page) both read from this file, so there's a single source of truth.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. Enable Pages once in the repo settings: **Settings → Pages → Source → GitHub Actions**.
