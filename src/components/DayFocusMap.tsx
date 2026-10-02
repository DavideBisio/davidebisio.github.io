import { useEffect, useRef, useState } from 'react';
import JourneyMap from './JourneyMap';
import { useActiveDay } from './useActiveDay';
import type { JourneyDay } from '../lib/journey';

interface Props {
  days: JourneyDay[];
}

function resolveActiveDay(days: JourneyDay[], activeDayIndex: number | null): JourneyDay | null {
  if (days.length === 0) return null;
  if (activeDayIndex === null) return days[0];
  let candidate: JourneyDay | null = null;
  for (const day of days) {
    if (day.dayIndex <= activeDayIndex) candidate = day;
  }
  return candidate ?? days[0];
}

const POPUP_TITLE_ID = 'day-focus-map-popup-title';

export default function DayFocusMap({ days }: Props) {
  const activeDayIndex = useActiveDay();
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [snapshotDayIndex, setSnapshotDayIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  function closePopup() {
    setPopupOpen(false);
    triggerRef.current?.focus();
  }

  // Matches the existing Lightbox's behavior: Escape closes it, and the
  // background page doesn't scroll while it's open.
  useEffect(() => {
    if (!isPopupOpen) return;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePopup();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopupOpen]);

  if (days.length === 0) return null;

  const activeDay = resolveActiveDay(days, activeDayIndex);
  if (!activeDay) return null;

  return (
    <>
      <div className="hidden lg:block">
        <JourneyMap days={days} mode="single-day" activeDayIndex={activeDay.dayIndex} />
      </div>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setSnapshotDayIndex(activeDay.dayIndex);
          setPopupOpen(true);
        }}
        // Leaflet's own controls (zoom, attribution) default to z-index 1000,
        // which would otherwise cover this button whenever a per-day map's
        // bottom-right corner scrolls into the same screen position.
        className="fixed bottom-6 right-6 z-[1100] flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg lg:hidden"
        aria-label="Show day map"
      >
        🗺
      </button>

      {isPopupOpen && snapshotDayIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={POPUP_TITLE_ID}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 lg:hidden"
          onClick={closePopup}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-4 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p id={POPUP_TITLE_ID} className="text-sm font-medium">
                {days.find((d) => d.dayIndex === snapshotDayIndex)?.label}
              </p>
              <button ref={closeRef} type="button" onClick={closePopup} aria-label="Close" className="text-xl leading-none">
                &times;
              </button>
            </div>
            <JourneyMap days={days} mode="single-day" activeDayIndex={snapshotDayIndex} />
          </div>
        </div>
      )}
    </>
  );
}
