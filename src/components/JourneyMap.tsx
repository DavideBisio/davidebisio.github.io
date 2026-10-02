import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { JourneyDay } from '../lib/journey';

interface Props {
  days: JourneyDay[];
  mode: 'overview' | 'single-day';
  activeDayIndex?: number;
}

// CARTO's free raster basemaps require an API key, and Wikimedia's tile
// service returns 403 for any non-Wikimedia Referer (both verified
// empirically against the real tile servers, not just localhost — the
// Wikimedia 403 only showed up once tested with a real-site Referer header).
// This reuses the same OSM tile source as the existing per-day TripMap
// (proven to work from this site in production) and gets the "coarser,
// simpler" look via a CSS filter on the tile pane instead of a different
// tile source — see the `.journey-map-tiles` rule in src/styles/global.css.
const COARSE_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const COARSE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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

      L.tileLayer(COARSE_TILE_URL, { attribution: COARSE_ATTRIBUTION, maxZoom: 18 }).addTo(map);

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
      <div
        ref={containerRef}
        className="journey-map-tiles h-80 w-full rounded-lg border border-slate-200 dark:border-slate-800"
      />
      {singleDay && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="font-medium">{singleDay.label}</span>
          {singleDay.gpxHref && (
            // `download` takes an explicit filename: small route files get
            // inlined by Vite as base64 data: URIs, which have no filename
            // of their own for the browser to fall back to.
            <a href={singleDay.gpxHref} download={singleDay.routeFilename} className="font-medium text-sky-600 dark:text-sky-400">
              Download GPX
            </a>
          )}
        </div>
      )}
    </div>
  );
}
