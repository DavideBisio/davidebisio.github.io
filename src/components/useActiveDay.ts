import { useEffect, useState } from 'react';

/** Tracks which day's timeline entry (by its `data-day-index` attribute) is
 * currently crossing a thin band near the top of the viewport, scrollspy-style.
 * Returns null if no day is currently in that band, or no `[data-day-index]`
 * elements exist in the DOM yet. */
export function useActiveDay(): number | null {
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-day-index]'));
    if (elements.length === 0) return;

    const indices = elements
      .map((el) => Number(el.getAttribute('data-day-index')))
      .filter((n) => !Number.isNaN(n));
    const lastIndex = indices.length > 0 ? Math.max(...indices) : null;

    // The scrollspy band sits 20-70% down the viewport, which the last day's
    // entry may never reach if it's short (there's no more page left to
    // scroll past it) — without this, the last day could never become
    // active. Being scrolled to the very bottom of the page always wins over
    // whatever the intersection band reports, since an earlier (taller) day
    // can still be straddling that band at max scroll.
    function isAtBottom() {
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isAtBottom() && lastIndex !== null) {
          setActiveDayIndex(lastIndex);
          return;
        }
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        const index = Number(topMost.target.getAttribute('data-day-index'));
        setActiveDayIndex(Number.isNaN(index) ? null : index);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    for (const el of elements) observer.observe(el);

    function checkAtBottom() {
      if (isAtBottom() && lastIndex !== null) setActiveDayIndex(lastIndex);
    }
    window.addEventListener('scroll', checkAtBottom, { passive: true });
    checkAtBottom();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkAtBottom);
    };
  }, []);

  return activeDayIndex;
}
