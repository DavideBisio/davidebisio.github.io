import type { CollectionEntry } from 'astro:content';

export type TripDay = CollectionEntry<'trips'>['data']['days'][number];

/** Trip entries are loaded from `<slug>/<slug>.md`, so the first id segment is the slug. */
export function tripSlug(trip: CollectionEntry<'trips'>): string {
  return trip.id.split('/')[0];
}

export function sortTripsByDate(trips: CollectionEntry<'trips'>[]): CollectionEntry<'trips'>[] {
  return [...trips].sort((a, b) => b.data.startDate.valueOf() - a.data.startDate.valueOf());
}

export function sortDaysByDate(days: TripDay[]): TripDay[] {
  return [...days].sort((a, b) => a.date.valueOf() - b.date.valueOf());
}
