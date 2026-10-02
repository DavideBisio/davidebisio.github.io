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
  // Vite inlines small GPX files as base64 data: URIs (no filename of their
  // own), so the download link needs this to suggest a real filename.
  routeFilename: string;
}
