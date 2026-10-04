import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { loadJourney } from '../../../../lib/loadJourney';
import { tripSlug } from '../../../../lib/trips';

// One static GPX file per day's driving route, synthesized at build time
// from the trip's combined route file. Previously inlined as a base64
// data: URI directly in index.astro's HTML (12 copies on this trip alone,
// ~1.8MB total) — serving it from its own URL means that weight is only
// paid by someone who actually clicks "Download route GPX".
export async function getStaticPaths() {
  const trips = await getCollection('trips', ({ data }) => !data.draft);
  return trips.flatMap((trip) => {
    const { routeDownloads } = loadJourney(trip);
    return routeDownloads
      .filter((rd): rd is NonNullable<typeof rd> => rd !== null)
      .map((routeDownload) => ({
        params: { trip: tripSlug(trip), day: routeDownload.dateStr },
        props: { routeDownload },
      }));
  });
}

export const GET: APIRoute = ({ props }) => {
  return new Response(props.routeDownload.gpxXml, {
    headers: {
      'Content-Type': 'application/gpx+xml',
      'Content-Disposition': `attachment; filename="${props.routeDownload.filename}"`,
    },
  });
};
