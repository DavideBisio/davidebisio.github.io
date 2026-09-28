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

const TRKPT_RE = /<trkpt\b[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
const ELE_RE = /<ele>([-\d.]+)<\/ele>/;
const TIME_RE = /<time>([^<]+)<\/time>/;
const NAME_RE = /<trk>[\s\S]*?<name>([^<]*)<\/name>/;

function haversineKm(a: GpxPoint, b: GpxPoint): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Parses raw GPX XML into a track with plain points and precomputed stats, all at build time. */
export function parseGpx(xml: string): GpxTrack {
  const points: GpxPoint[] = [];
  let match: RegExpExecArray | null;

  TRKPT_RE.lastIndex = 0;
  while ((match = TRKPT_RE.exec(xml)) !== null) {
    const [, lat, lon, inner] = match;
    const eleMatch = ELE_RE.exec(inner);
    const timeMatch = TIME_RE.exec(inner);
    points.push({
      lat: Number.parseFloat(lat),
      lon: Number.parseFloat(lon),
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
