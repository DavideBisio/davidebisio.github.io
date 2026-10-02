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

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        const index = Number(topMost.target.getAttribute('data-day-index'));
        setActiveDayIndex(Number.isNaN(index) ? null : index);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return activeDayIndex;
}
