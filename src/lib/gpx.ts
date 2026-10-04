export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: string | null;
}

export interface GpxTrack {
  name: string | null;
  points: GpxPoint[];
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
}

// Matches both self-closing `<trkpt lat="…" lon="…"/>` (e.g. CalTopo exports
// with no elevation/time) and paired `<trkpt …>…</trkpt>` tags.
const TRKPT_RE = /<trkpt\b([^>]*?)\/>|<trkpt\b([^>]*?)>([\s\S]*?)<\/trkpt>/g;
const LAT_RE = /\blat="(-?[\d.]+)"/;
const LON_RE = /\blon="(-?[\d.]+)"/;
const ELE_RE = /<ele>([-\d.]+)<\/ele>/;
const TIME_RE = /<time>([^<]+)<\/time>/;
const NAME_RE = /<trk>[\s\S]*?<name>([^<]*)<\/name>/;

export interface GpxWaypoint {
  name: string;
  lat: number;
  lon: number;
}

const WPT_RE = /<wpt\b([^>]*?)>([\s\S]*?)<\/wpt>/g;
const WPT_NAME_RE = /<name>([^<]*)<\/name>/;

/** Great-circle distance in km between two lat/lon points. Exported so
 * callers can test proximity (e.g. "is this waypoint near this track?")
 * without duplicating the formula. */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const TRK_BLOCK_RE = /<trk>[\s\S]*?<\/trk>/g;

/** Splits a multi-track GPX file into its individual `<trk>` blocks, each
 * parsed with parseGpx. Used for a combined file holding one track per day. */
export function parseTracks(xml: string): GpxTrack[] {
  return (xml.match(TRK_BLOCK_RE) ?? []).map((block) => parseGpx(block));
}

/** Parses raw GPX XML into a track with plain points and precomputed stats, all at build time. */
export function parseGpx(xml: string): GpxTrack {
  const points: GpxPoint[] = [];
  let match: RegExpExecArray | null;

  TRKPT_RE.lastIndex = 0;
  while ((match = TRKPT_RE.exec(xml)) !== null) {
    const attrs = match[1] ?? match[2] ?? '';
    const inner = match[3] ?? '';
    const latMatch = LAT_RE.exec(attrs);
    const lonMatch = LON_RE.exec(attrs);
    if (!latMatch || !lonMatch) continue;
    const eleMatch = ELE_RE.exec(inner);
    const timeMatch = TIME_RE.exec(inner);
    points.push({
      lat: Number.parseFloat(latMatch[1]),
      lon: Number.parseFloat(lonMatch[1]),
      ele: eleMatch ? Number.parseFloat(eleMatch[1]) : null,
      time: timeMatch ? timeMatch[1] : null,
    });
  }

  let distanceKm = 0;
  let elevationGainM = 0;
  let elevationLossM = 0;
  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(points[i - 1], points[i]);
    const prevEle = points[i - 1].ele;
    const ele = points[i].ele;
    if (prevEle !== null && ele !== null) {
      const delta = ele - prevEle;
      if (delta > 0) elevationGainM += delta;
      else elevationLossM += -delta;
    }
  }

  const startTime = points[0]?.time ?? null;
  const endTime = points[points.length - 1]?.time ?? null;
  const durationMinutes =
    startTime && endTime ? (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000 : null;

  const nameMatch = NAME_RE.exec(xml);

  return {
    name: nameMatch ? nameMatch[1].trim() : null,
    points,
    distanceKm,
    elevationGainM,
    elevationLossM,
    startTime,
    endTime,
    durationMinutes,
  };
}

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

/** Builds a minimal single-track GPX document, for offering a day's slice of a
 * shared multi-track file as its own downloadable file. */
export function buildGpxFile(name: string, points: GpxPoint[]): string {
  const trkpts = points.map((p) => `<trkpt lat="${p.lat}" lon="${p.lon}"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="davidebisio.github.io"><trk><name>${name}</name><trkseg>${trkpts}</trkseg></trk></gpx>`;
}
