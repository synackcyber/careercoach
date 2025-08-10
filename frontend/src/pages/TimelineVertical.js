import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import ProgressModal from '../components/ProgressModal';

function byDateAsc(a, b) {
  const da = new Date(a.date);
  const db = new Date(b.date);
  return da - db;
}

function formatMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function TimelineVertical() {
  const { goals, loading, error } = useGoals({});
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | completed | paused
  const [yearFilter, setYearFilter] = useState('all'); // 'all' or numeric year string
  const monthRefs = useRef({});

  const filteredEntries = useMemo(() => {
    // Filter goals by status first
    const base = goals.filter(g => statusFilter === 'all' ? true : g.status === statusFilter);
    const list = base.map(g => ({
      id: g.id,
      goal: g,
      date: g.due_date || g.created_at || new Date().toISOString(),
    })).sort(byDateAsc);
    // Group by month
    const groups = {};
    list.forEach(item => {
      const mk = formatMonthKey(item.date);
      if (!groups[mk]) groups[mk] = [];
      groups[mk].push(item);
    });
    return groups;
  }, [goals, statusFilter]);

  const monthsAll = useMemo(() => Object.keys(filteredEntries).sort((a, b) => new Date(a + '-01') - new Date(b + '-01')), [filteredEntries]);
  const years = useMemo(() => {
    const set = new Set(monthsAll.map(mk => Number(mk.split('-')[0])));
    return Array.from(set).sort((a, b) => a - b);
  }, [monthsAll]);
  const months = useMemo(() => monthsAll.filter(mk => yearFilter === 'all' ? true : mk.startsWith(yearFilter + '-')), [monthsAll, yearFilter]);

  const openGoal = (g) => {
    setSelectedGoal(g);
    setShowProgressModal(true);
  };

  const scrollToMonth = (key) => {
    const el = monthRefs.current[key];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header removed per request for a cleaner, immersive timeline */}

        <div className="relative">
          {/* Right mini month navigator */}
          <div className="hidden md:flex flex-col gap-1 items-center fixed right-6 top-28 z-10 select-none">
            {months.map((mk) => (
              <button
                key={mk}
                onClick={() => scrollToMonth(mk)}
                className="btn-icon h-8 w-8 text-[10px] font-semibold"
                title={monthLabel(mk)}
              >
                {new Date(mk + '-01').toLocaleDateString(undefined, { month: 'short' })[0]}
              </button>
            ))}
          </div>

          {/* Vertical rail with scroll-snap */}
          <div className="p-0 overflow-hidden bg-transparent rounded-none shadow-none ring-0">
            <div className="relative flex">
              {/* Rail */}
              <div className="w-12 shrink-0 relative">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800" />
              </div>

              {/* Content */}
              <div
                className="grow h-[calc(100vh-48px)] overflow-y-auto no-scrollbar snap-y snap-mandatory pr-2 timeline-grid-y"
                style={{ ['--gap']: '56px', ['--gap-major']: '224px' }}
              >
                {months.length === 0 && (
                  <div className="p-8 text-center text-gray-500">{loading ? 'Loading…' : 'No goals yet'}</div>
                )}
                {months.map((mk) => (
                  <section
                    key={mk}
                    ref={(el) => { monthRefs.current[mk] = el; }}
                    className="snap-start scroll-mt-6"
                  >
                    {/* Month header sticky within section */}
                    <div className="sticky top-0 z-10 backdrop-blur-sm bg-white/70 dark:bg-zinc-900/40 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                      {monthLabel(mk)}
                    </div>
                    <div className="px-2">
                      {filteredEntries[mk]?.map(({ id, goal, date }, idx) => (
                        <div key={id} className="relative pl-8 pt-4 pb-6">
                          {/* Node dot */}
                          <div className="absolute left-0 top-6 h-3 w-3 rounded-full bg-accent-600 ring-2 ring-white dark:ring-zinc-900" />
                          {/* Connector to next node */}
                          {idx < (filteredEntries[mk]?.length || 0) - 1 && (
                            <div className="absolute left-[5px] top-9 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
                          )}
                          {/* Card */}
                          <button
                            onClick={() => { setSelectedGoal(goal); setShowProgressModal(true); }}
                            className="w-full text-left rounded-soft bg-white/85 dark:bg-zinc-900/60 ring-1 ring-black/5 shadow-card backdrop-blur p-4 transition-transform duration-200 hover:-translate-y-0.5 animate-in-up"
                            style={{ animationDelay: `${idx * 40}ms` }}
                            title={goal.title}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 line-clamp-1">{goal.title}</h3>
                              <span className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</span>
                            </div>
                            {goal.description && (
                              <p className="text-xs text-gray-600 dark:text-zinc-300 line-clamp-2">{goal.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                              <span className="status-badge bg-gray-100 text-gray-800 ring-gray-200">{goal.status}</span>
                              <span className="status-badge bg-gray-100 text-gray-800 ring-gray-200">{goal.priority}</span>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal reuse */}
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


