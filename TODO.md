# TODO

## Travel log

Add a "Travel log" section with a scrollable timeline of trips.

- Timeline view listing travels; clicking a trip opens a subsection for that trip.
- Within a trip, a day-by-day log including:
  - Places visited
  - Activities
  - Notes
  - Pictures
  - GPX maps

### Implementation notes

Site is a static Astro build on GitHub Pages (no server/backend), so everything
below has to work as build-time content + client-side JS only.

**Data model / content**

- New `trips` content collection (`src/content/trips/`), alongside `articles`.
  Schema in `content.config.ts`: `title`, `description`, `startDate`, `endDate`,
  `location`/`country`, `coverImage`, `tags`, `draft`.
- Each trip is a folder (not a single file) so it can own its assets:
  `src/content/trips/<slug>/index.md` (trip intro/overview, markdown body like
  articles) + `src/content/trips/<slug>/days/YYYY-MM-DD-<slug>.md` for each day
  entry, or a `days` array of nested objects in the trip frontmatter if we want
  to keep it to one file per trip (simpler, but bigger files). Lean toward one
  file per day for editability and per-day image/gpx colocation.
- Day entry frontmatter: `date`, `title`, `places` (array), `activities`
  (array), plus a markdown body for free-form notes.
- Routes: `/travel/` (timeline), `/travel/[trip]/` (trip overview + day list),
  `/travel/[trip]/[day]/` (day detail) — mirrors the existing
  `articles/[...slug].astro` pattern via `getStaticPaths` + `getCollection`.

**Scrollable timeline**

- Build as a plain Astro page first (SSR at build time): trips sorted by date,
  rendered as a vertical list/timeline with CSS (scroll-snap or just normal
  scroll + sticky date markers) — no JS required for the base case.
- Only reach for a React island (like `SkillsTree.tsx`) if we want interactive
  bits: filtering by year/tag, expand/collapse, or a horizontal scrubber.
  Keep it an island, not a full SPA, to stay consistent with current
  architecture (islands only where needed).
- "Clicking an item opens a subsection" = plain navigation to `/travel/[trip]/`
  (an `<a>`), not client-side routing — avoids adding a router dependency.

**Pictures**

- Use Astro's built-in `astro:assets` (`<Image>` / `getImage`) for automatic
  optimization + responsive output, same as we'd want for article images.
- Store images next to the day/trip markdown file so they're colocated content
  (Astro content collections support local asset references relative to the
  entry). Reference via frontmatter (`coverImage`) or inline markdown images
  in the body.
- Consider a lightweight lightbox for full-size viewing (small dependency-free
  component, or a minimal React island) — not critical for v1.

**GPX map view + download**

- No backend, so map rendering has to happen client-side: add a React island
  (e.g. `TripMap.tsx`) using Leaflet + OpenStreetMap tiles (free, no API key)
  and a GPX parsing layer (`leaflet-gpx`, or parse GPX to GeoJSON at *build
  time* with a small Node script and feed the island plain GeoJSON — avoids
  shipping a GPX parser to the client and keeps the island simpler).
  Build-time parsing is preferable: less client JS, and we can precompute
  stats (distance, elevation) to display alongside the map.
- Store the raw `.gpx` file alongside the day entry's assets; expose it as a
  direct download link (`public/travel/<trip>/<day>.gpx` or via Astro's
  asset pipeline if it supports passthrough copy) so "download GPX" is just a
  static file link, no server needed.
- Lazy-load the map island (`client:visible` in Astro) so trips without a GPX
  don't pay the Leaflet bundle cost.

**Section text / editing**

- Yes — markdown (`.md`/optionally `.mdx` if we need custom components),
  consistent with how `articles` already work. Keeps editing workflow the
  same as the rest of the site (git-based, no CMS): add/edit a file, commit,
  push, GitHub Actions builds and deploys.
- If frontmatter gets unwieldy (many places/activities per day), consider
  small reusable MDX components (e.g. `<Place>`, `<ActivityList>`) rather
  than free-form prose, so data stays structured enough to also drive the
  timeline/map without re-parsing markdown.

**Else / open questions**

- Where do GPX + photo files live and how big can they get — GitHub repo
  size/LFS is a real constraint for a photo-heavy travel log; may want an
  external image host/CDN instead of committing originals.
- Map tile provider: plain OSM tiles are fine for low traffic/personal use;
  check usage policy if traffic grows.
- Nav: add "Travel" link to `Header.astro`; add trip pages to the sitemap
  (already generated via `@astrojs/sitemap`) and to `dist` build step if any
  extra static copying (raw GPX files) is needed.
- Decide `draft` handling and whether unfinished trips should be filterable
  out like draft articles already are.
