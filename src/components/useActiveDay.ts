import { useEffect, useState } from 'react';

// The active day is the last one (in document order) whose top has scrolled
// above this fraction of the viewport height — i.e. whichever day currently
// occupies the "reading line" near the top of the screen.
const THRESHOLD_FRACTION = 0.3;

/** Tracks which day's timeline entry (by its `data-day-index` attribute) is
 * currently at the top of the viewport, scrollspy-style. Returns null before
 * the first day has scrolled up to the threshold line, or if no
 * `[data-day-index]` elements exist in the DOM yet.
 *
 * Deliberately not IntersectionObserver-based: its callback only reports
 * elements whose intersection state *changed* since the previous callback,
 * not every currently-intersecting element. Picking "topmost of this batch"
 * silently keeps stale state whenever the day that should become active
 * didn't itself cross a threshold on this tick — e.g. a short day near the
 * end of the list whose top never dips below 30% of the viewport because
 * there's no more page left to scroll past it, so the real "last visible"
 * day was never hidden by a bottom-of-page special case the way it would be
 * with a fixed index. Recomputing from live getBoundingClientRect() on every
 * scroll avoids that whole class of bug — it just answers the current
 * question each time instead of reacting to a stream of change events. */
export function useActiveDay(): number | null {
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-day-index]'));
    if (elements.length === 0) return;

    let rafId: number | null = null;

    function recompute() {
      rafId = null;
      const thresholdY = window.innerHeight * THRESHOLD_FRACTION;
      let active: number | null = null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top > thresholdY) continue;
        const idx = Number(el.getAttribute('data-day-index'));
        if (!Number.isNaN(idx)) active = idx;
      }
      setActiveDayIndex(active);
    }

    function onScrollOrResize() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(recompute);
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    recompute();

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return activeDayIndex;
}
