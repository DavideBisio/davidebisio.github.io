import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  /** [lat, lng] pairs, precomputed at build time from the GPX track. */
  points: [number, number][];
}

export default function TripMap({ points }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;
    let cancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const line = L.polyline(points, { color: '#0284c7', weight: 3 }).addTo(map);
      const start = points[0];
      const end = points[points.length - 1];
      L.circleMarker(start, { radius: 5, color: '#16a34a', fillColor: '#16a34a', fillOpacity: 1 })
        .addTo(map)
        .bindTooltip('Start');
      L.circleMarker(end, { radius: 5, color: '#dc2626', fillColor: '#dc2626', fillOpacity: 1 })
        .addTo(map)
        .bindTooltip('End');

      map.fitBounds(line.getBounds(), { padding: [16, 16] });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (points.length === 0) return null;

  return <div ref={containerRef} className="h-80 w-full rounded-lg border border-slate-200 dark:border-slate-800" />;
}
