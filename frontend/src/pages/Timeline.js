import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import ProgressModal from '../components/ProgressModal';
import PageTitle from '../components/PageTitle';

const dayMs = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  return new Date(startOfDay(date).getTime() + n * dayMs);
}

function diffInDays(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / dayMs);
}

const scales = {
  month: { label: 'Month', pxPerDay: 24, tickEveryDays: 7 },
  week: { label: 'Week', pxPerDay: 40, tickEveryDays: 1 },
  quarter: { label: 'Quarter', pxPerDay: 12, tickEveryDays: 14 },
};

export default function Timeline() {
  const { goals, loading, error } = useGoals({});
  const [scale, setScale] = useState('month');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const scrollerRef = useRef(null);
  const headerTicksRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const snapTimerRef = useRef(null);

  const { startDate, endDate } = useMemo(() => {
    const today = startOfDay(new Date());
    let minDate = addDays(today, -14);
    let maxDate = addDays(today, 30);
    goals.forEach((g) => {
      const due = g.due_date ? new Date(g.due_date) : null;
      const created = g.created_at ? new Date(g.created_at) : null;
      const candidate = due || created || today;
      if (candidate < minDate) minDate = startOfDay(candidate);
      if (candidate > maxDate) maxDate = addDays(candidate, 14);
    });
    return { startDate: minDate, endDate: maxDate };
  }, [goals]);

  const { pxPerDay, tickEveryDays } = scales[scale];
  const totalDays = Math.max(1, diffInDays(startDate, endDate));
  const totalWidth = totalDays * pxPerDay;
  const todayOffset = diffInDays(startDate, new Date()) * pxPerDay;

  useEffect(() => {
    // center today on first load
    const el = scrollerRef.current;
    if (el) {
      el.scrollLeft = Math.max(0, todayOffset - el.clientWidth / 2);
    }
  }, [todayOffset, scale]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const prefersReduced = document.documentElement.classList.contains('reduce-motion') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
        setScrollProgress(el.scrollLeft / maxScroll);
        if (headerTicksRef.current && !prefersReduced) {
          const lag = el.scrollLeft * 0.1;
          headerTicksRef.current.style.transform = `translateX(${lag}px)`;
        }
      });

      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      if (!prefersReduced) {
        snapTimerRef.current = setTimeout(() => {
          const denom = tickEveryDays * pxPerDay;
          if (denom <= 0) return;
          const nearest = Math.round(el.scrollLeft / denom) * denom;
          el.scrollTo({ left: nearest, behavior: 'smooth' });
        }, 180);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, [pxPerDay, tickEveryDays]);

  const openGoal = (goal) => {
    setSelectedGoal(goal);
    setShowProgressModal(true);
  };

  if (error) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg">
      <div className="relative min-h-screen overflow-hidden">
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="sticky top-0 z-10 backdrop-blur-sm bg-white/60 dark:bg-zinc-900/40 px-4 py-3 rounded-none shadow-none ring-0 animate-in-down flex items-center justify-between">
            <div>
              <PageTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-zinc-100">Timeline</PageTitle>
              <p className="text-gray-600 dark:text-zinc-400 mt-1">Interactive view of goals over time</p>
            </div>
            <div className="flex items-center gap-2">
              {Object.entries(scales).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setScale(key)}
                  className={`btn-wire btn-wire-sm ${scale === key ? 'ring-2 ring-accent-500' : ''}`}
                  aria-pressed={scale === key}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          {/* Scroll progress ruler */}
          <div className="h-1 w-full bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full overflow-hidden mt-2 mb-4">
            <div className="h-full bg-accent-500" style={{ width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }} />
          </div>

          <div className="p-0 overflow-hidden rounded-none shadow-none ring-0 bg-transparent">
            <div className="flex">
              {/* Sticky left column with goal titles */}
              <div className="w-56 shrink-0">
                <div className="h-12 border-b border-gray-100 dark:border-zinc-800 flex items-center px-4 text-sm text-gray-500">Goals</div>
                <div>
                  {loading ? (
                    <div className="p-4 text-gray-500">Loading...</div>
                  ) : (
                    goals.map((g) => (
                      <div key={g.id} className="h-14 border-b border-gray-50 dark:border-zinc-800 flex items-center px-4 text-sm text-gray-800 dark:text-zinc-100">
                        <button className="text-left hover:underline" onClick={() => openGoal(g)}>
                          {g.title}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Scrollable timeline */}
              <div
                ref={scrollerRef}
                className="relative overflow-x-auto overflow-y-hidden no-scrollbar grow scroll-mask max-w-none timeline-grid-x"
                style={{ ['--gap']: `${pxPerDay}px`, ['--gap-major']: `${pxPerDay * tickEveryDays}px` }}
                onWheel={(e) => {
                  // horizontal wheel with trackpads still works; this converts vertical wheel to horizontal pan for mouse wheels
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.currentTarget.scrollLeft += e.deltaY;
                    e.preventDefault();
                  }
                }}
              >
                {/* Header ticks */}
                <div ref={headerTicksRef} className="h-12 border-b border-gray-100/60 dark:border-zinc-800/60 relative will-change-transform" style={{ width: totalWidth }}>
                  {Array.from({ length: Math.ceil(totalDays / tickEveryDays) + 1 }).map((_, idx) => {
                    const day = idx * tickEveryDays;
                    const date = addDays(startDate, day);
                    return (
                      <div key={idx} className="absolute top-0 h-full border-l border-gray-100/60 dark:border-zinc-800/60 text-xs text-gray-500" style={{ left: day * pxPerDay }}>
                        <div className="px-2 py-2">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                      </div>
                    );
                  })}
                  {/* Today marker */}
                  <div className="absolute top-0 bottom-0 w-px bg-accent-600 today-glow" style={{ left: todayOffset }} />
                </div>

                {/* Rows */}
                <div className="relative" style={{ width: totalWidth }}>
                  {goals.map((g, rowIdx) => {
                    const anchor = g.due_date ? new Date(g.due_date) : g.created_at ? new Date(g.created_at) : new Date();
                    const offset = Math.max(0, diffInDays(startDate, anchor)) * pxPerDay;
                    const widthPx = Math.max(pxPerDay * 2, pxPerDay * 7); // simple fixed duration block
                    const statusColor = g.status === 'completed' ? 'bg-green-500' : g.status === 'paused' ? 'bg-yellow-500' : 'bg-accent-600';
                    return (
                      <div key={g.id} className="h-14 border-b border-gray-50/60 dark:border-zinc-800/60">
                        <button
                          className={`absolute mt-2 goal-chip ${statusColor}`}
                          style={{ left: offset, width: widthPx }}
                          title={g.title}
                          onClick={() => openGoal(g)}
                        >
                          {g.status}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Modal for quick interaction */}
          <ProgressModal
            goal={selectedGoal}
            isOpen={showProgressModal}
            onClose={() => { setShowProgressModal(false); setSelectedGoal(null); }}
          />
        </div>
      </div>
    </div>
  );
}



