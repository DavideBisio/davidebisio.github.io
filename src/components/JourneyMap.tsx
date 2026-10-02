import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { JourneyDay } from '../lib/journey';

interface Props {
  day: JourneyDay;
}

// CARTO's free raster basemaps require an API key, and Wikimedia's tile
// service returns 403 for any non-Wikimedia Referer (both verified
// empirically against the real tile servers, not just localhost — the
// Wikimedia 403 only showed up once tested with a real-site Referer header).
// This uses the same OSM tile source proven to work from this site in
// production, and gets the "coarser, simpler" look via a CSS filter on the
// tile pane instead of a different tile source — see the `.journey-map-tiles`
// rule in src/styles/global.css.
const COARSE_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const COARSE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const TRACK_STYLE: Record<'activity' | 'route', { color: string; weight: number }> = {
  activity: { color: '#ea580c', weight: 4 },
  route: { color: '#0284c7', weight: 4 },
};

export default function JourneyMap({ day }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current);
      mapRef.current = map;

      L.tileLayer(COARSE_TILE_URL, { attribution: COARSE_ATTRIBUTION, maxZoom: 18 }).addTo(map);

      // Bounds come from this day's own tracks only — the waypoints are a
      // trip-wide shared set, and fitting to all of them would zoom out to
      // the whole island instead of focusing on today's route.
      const bounds: [number, number][] = [];
      for (const track of day.tracks) {
        if (track.points.length === 0) continue;
        L.polyline(track.points, { ...TRACK_STYLE[track.variant], opacity: 0.9 }).addTo(map);
        bounds.push(...track.points);
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
  }, [day]);

  return (
    <div>
      <div
        ref={containerRef}
        className="journey-map-tiles h-80 w-full rounded-lg border border-slate-200 dark:border-slate-800"
      />
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="font-medium">{day.label}</span>
        {day.downloads.map((dl) => (
          // `download` takes an explicit filename: data: URIs have no
          // filename of their own for the browser to fall back to.
          <a key={dl.href} href={dl.href} download={dl.filename} className="font-medium text-sky-600 dark:text-sky-400">
            {dl.label}
          </a>
        ))}
      </div>
    </div>
  );
}
