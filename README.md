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
        *.gpx               # GPX tracks, colocated flat, referenced by filename
        *.jpg / *.png        # pictures, colocated flat, referenced by filename
  content.config.ts  # collection schemas: articles, trips
  data/cv.ts         # CV content: profile, experience, education, skills tree
  lib/                # articleSlug/tripSlug helpers, build-time GPX parsing
  components/         # Header, Footer, ArticleList, SkillsTree, TripMap, Lightbox
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

| Command              | Action                                                  |
| :-------------------- | :------------------------------------------------------- |
| `./setup.sh`           | One-time: install Linux-native Node, wire it into PATH   |
| `npm install`          | Install dependencies                                      |
| `./run_preview.sh`     | Start the dev server in the background (`localhost:4321`) |
| `./run_preview.sh stop`| Stop the background dev server                            |
| `npm run build`        | Build the site to `./dist/`, then render `dist/cv.pdf`     |
| `npm run preview`      | Preview the production build locally                        |

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
markdown file for the whole trip, plus any GPX tracks and pictures colocated
flat alongside it:

```text
src/content/trips/<trip-slug>/
  <trip-slug>.md
  2026-06-07-some-ride.gpx   # optional
  some-photo.jpg              # optional
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
    images:
      - "./some-photo.jpg" # optional, filename relative to this file
    gpx: "./2026-06-07-some-ride.gpx" # optional, filename relative to this file
---

Trip-level intro/overview markdown goes in the file body, same as an article.
```

When a day has `gpx`, its timeline entry parses the track at build time (no
parser shipped to the client) and renders a Leaflet map, distance/elevation/
duration stats, and a download link. When a day has `images`, small thumbnails
are shown inline and clicking one opens it full-size in a lightbox. Both are
optional per day and simply omitted when not set.

## Editing the CV

Edit `src/data/cv.ts`. The `/cv/` page and the downloadable PDF (`dist/cv.pdf`, generated at build time from that same page) both read from this file, so there's a single source of truth.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. Enable Pages once in the repo settings: **Settings → Pages → Source → GitHub Actions**.
