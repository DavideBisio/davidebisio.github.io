import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { loadJourney } from '../../../../lib/loadJourney';
import { tripSlug } from '../../../../lib/trips';

// One static JSON file per day holding that day's full journey map data
// (tracks + waypoints). index.astro passes DayFocusMap only a lightweight
// {dayIndex, label} manifest and a tripSlug; the client fetches every day's
// file here in parallel right after mount instead of the page embedding all
// days' point data (tens of thousands of points for a multi-week trip) in
// its initial hydration payload. See index.astro's comment by the
// <DayFocusMap> mount for the measured page-weight reason this exists.
export async function getStaticPaths() {
  const trips = await getCollection('trips', ({ data }) => !data.draft);
  return trips.flatMap((trip) => {
    const { journeyDays } = loadJourney(trip);
    return journeyDays.map((journeyDay) => ({
      params: { trip: tripSlug(trip), day: String(journeyDay.dayIndex) },
      props: { journeyDay },
    }));
  });
}

export const GET: APIRoute = ({ props }) => {
  return new Response(JSON.stringify(props.journeyDay), {
    headers: { 'Content-Type': 'application/json' },
  });
};
