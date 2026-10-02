/** One line rendered on a day's journey map — either an activity track (from
 * the per-day `gpx:` hikes/runs) or the day's driving route (from the shared
 * `routesGpx` file), styled differently. */
export interface JourneyTrack {
  label: string;
  points: [number, number][];
  variant: 'activity' | 'route';
}

/** One day's data for the trip-level journey map — distinct from the
 * existing per-day activity GpxTrack: dayIndex is the index into the full
 * `days[]` array (not the filtered journey-days list), so it stays valid
 * for matching against the timeline's `data-day-index` attributes. */
export interface JourneyDay {
  dayIndex: number;
  label: string;
  tracks: JourneyTrack[];
  // Waypoints aren't tied to a specific day in the source data, so the same
  // shared list is shown on every day's map as context.
  waypoints: { name: string; lat: number; lon: number }[];
  downloads: { label: string; href: string; filename: string }[];
}
