import fs from 'node:fs';
import path from 'node:path';
import type { CollectionEntry } from 'astro:content';
import { parseGpx, parseTracks, parseWaypoints, buildGpxFile, haversineKm } from './gpx';
import type { JourneyDay, JourneyTrack } from './journey';
import { sortDaysByDate } from './trips';

// GPX files are colocated with the trip's markdown but aren't part of the
// schema's markdown/image pipeline, so resolve + parse them at build time.
// Shared across index.astro (per-day stats) and the journey/route endpoints
// below (the trip-level map's lazily-fetched per-day data).
const gpxUrls = import.meta.glob('/src/content/trips/**/gpx/*.gpx', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function labelFromFilename(filename: string): string {
  const base = filename.split('/').pop()!.replace(/\.gpx$/i, '');
  return base.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function trackDateLabel(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}

export interface ActivityTrackEntry {
  label: string;
  track: ReturnType<typeof parseGpx>;
  href: string | null;
}

interface RouteFile {
  routeTracks: ReturnType<typeof parseTracks>;
  waypoints: ReturnType<typeof parseWaypoints>;
}

export interface RouteDownload {
  track: ReturnType<typeof parseGpx>;
  gpxXml: string;
  dateStr: string;
  filename: string;
}

// A waypoint counts as "on" a day if it's within this distance of that day's
// own tracks — picked empirically from the real trip data: every waypoint's
// nearest matching day's track is within ~3.4km, while the next-nearest
// unrelated day is always 5km+ away, so this sits squarely in the gap.
const WAYPOINT_RADIUS_KM = 3.5;

// Reads every .gpx file under the trip's `gpx/` folder. A filename ending in
// "-route.gpx" is the trip's single combined routes+waypoints file (one
// <trk> per day, named "Route DD/MM/YYYY", plus shared <wpt> waypoints).
// Every other file is a per-day activity track, matched to its day by the
// date embedded in its own points — not by filename — so files can be named
// freely (the import script names them after the activity).
function loadGpxFiles(trip: CollectionEntry<'trips'>): {
  tripDir: string | null;
  activityTracksByDate: Map<string, ActivityTrackEntry[]>;
  routeFile: RouteFile | null;
} {
  const activityTracksByDate = new Map<string, ActivityTrackEntry[]>();
  let routeFile: RouteFile | null = null;
  const tripDir = trip.filePath ? path.posix.dirname(trip.filePath) : null;
  if (!tripDir) return { tripDir, activityTracksByDate, routeFile };
  const tripDirAbs = path.join(process.cwd(), tripDir);

  const gpxDir = path.join(tripDirAbs, 'gpx');
  if (!fs.existsSync(gpxDir)) return { tripDir, activityTracksByDate, routeFile };

  for (const filename of fs.readdirSync(gpxDir)) {
    if (!filename.toLowerCase().endsWith('.gpx')) continue;
    const xml = fs.readFileSync(path.join(gpxDir, filename), 'utf-8');

    if (filename.toLowerCase().endsWith('-route.gpx')) {
      routeFile = { routeTracks: parseTracks(xml), waypoints: parseWaypoints(xml) };
      continue;
    }

    const track = parseGpx(xml);
    if (!track.startTime) throw new Error(`${filename}: no <time> on its points, can't match it to a day`);
    const relPath = path.posix.join(tripDir, 'gpx', filename);
    const entry: ActivityTrackEntry = {
      label: labelFromFilename(filename),
      track,
      href: gpxUrls[`/${relPath}`] ?? null,
    };
    const key = track.startTime.slice(0, 10);
    if (!activityTracksByDate.has(key)) activityTracksByDate.set(key, []);
    activityTracksByDate.get(key)!.push(entry);
  }
  for (const entries of activityTracksByDate.values()) {
    entries.sort((a, b) => (a.track.startTime ?? '').localeCompare(b.track.startTime ?? ''));
  }
  return { tripDir, activityTracksByDate, routeFile };
}

export interface LoadedJourney {
  activityTracksByDate: Map<string, ActivityTrackEntry[]>;
  routeDownloads: (RouteDownload | null)[];
  journeyDays: JourneyDay[];
}

// Builds everything derived from a trip's gpx/ folder: per-day activity
// tracks (for the server-rendered stats/download link in the timeline), a
// synthesized single-day GPX per day from the combined route file (for the
// "Download route GPX" link, served by the route/[day].gpx endpoint), and
// the full per-day journey map data (served by the journey/[day].json
// endpoint instead of being embedded in index.astro's page — see that
// page's comment on why).
export function loadJourney(trip: CollectionEntry<'trips'>): LoadedJourney {
  const days = sortDaysByDate(trip.data.days);
  const { activityTracksByDate, routeFile } = loadGpxFiles(trip);

  const routeDownloads: (RouteDownload | null)[] = days.map((day) => {
    if (!routeFile) return null;
    const routeName = `Route ${trackDateLabel(day.date)}`;
    const routeTrack = routeFile.routeTracks.find((t) => t.name === routeName && t.points.length > 0);
    if (!routeTrack) return null;
    const dateStr = dateKey(day.date);
    return {
      track: routeTrack,
      gpxXml: buildGpxFile(routeName, routeTrack.points),
      dateStr,
      filename: `route-${dateStr}.gpx`,
    };
  });

  function waypointsNearDay(points: [number, number][]) {
    if (!routeFile) return [];
    return routeFile.waypoints.filter((wpt) =>
      points.some(([lat, lon]) => haversineKm({ lat, lon }, wpt) <= WAYPOINT_RADIUS_KM),
    );
  }

  const journeyDays: JourneyDay[] = days
    .map((day, i): JourneyDay => {
      const key = dateKey(day.date);
      const tracks: JourneyTrack[] = (activityTracksByDate.get(key) ?? []).map((entry) => ({
        label: entry.label,
        points: entry.track.points.map((p) => [p.lat, p.lon] as [number, number]),
        variant: 'activity' as const,
      }));

      const routeDownload = routeDownloads[i];
      if (routeDownload) {
        tracks.push({
          label: routeDownload.track.name ?? 'Route',
          points: routeDownload.track.points.map((p) => [p.lat, p.lon] as [number, number]),
          variant: 'route',
        });
      }

      const dayPoints = tracks.flatMap((t) => t.points);
      return { dayIndex: i, label: day.title, tracks, waypoints: waypointsNearDay(dayPoints) };
    })
    .filter((d) => d.tracks.some((t) => t.points.length > 0));

  return { activityTracksByDate, routeDownloads, journeyDays };
}
