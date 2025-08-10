import React from 'react';
import Timeline from './Timeline';
import TimelineVertical from './TimelineVertical';

export default function TimelineView() {
  const [view, setView] = React.useState(() => {
    try {
      return localStorage.getItem('timelineView') || 'vertical';
    } catch (_) {
      return 'vertical';
    }
  });

  const switchTo = (v) => {
    setView(v);
    try { localStorage.setItem('timelineView', v); } catch (_) {}
  };

  return (
    <div className="relative">
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2">
        <button
          className={`btn-wire btn-wire-sm ${view === 'vertical' ? 'ring-2 ring-accent-500' : ''}`}
          onClick={() => switchTo('vertical')}
          aria-pressed={view === 'vertical'}
        >
          TimeDial
        </button>
        <button
          className={`btn-wire btn-wire-sm ${view === 'horizontal' ? 'ring-2 ring-accent-500' : ''}`}
          onClick={() => switchTo('horizontal')}
          aria-pressed={view === 'horizontal'}
        >
          Timeline
        </button>
      </div>

      {view === 'horizontal' ? <Timeline /> : <TimelineVertical />}
    </div>
  );
}


