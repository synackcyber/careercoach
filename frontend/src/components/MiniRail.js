import React from 'react';
import LogoMark from './LogoMark';

function RailButton({ title, onClick, children, active }) {
  return (
    <button
      title={title}
      className={`mx-auto my-3 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-zinc-900/5 border-zinc-900/10 ${active ? 'bg-zinc-900/5' : 'bg-white/90'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function MiniRail({ onOpenSidebar, route, open = false }) {
  const navTo = (hash) => () => { window.location.hash = hash; };

  return (
    <div className={`fixed left-0 top-0 h-full w-14 bg-surface-50 border-r border-zinc-900/10 flex flex-col items-center pt-3 z-50 transition-opacity duration-200 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="mt-1 mb-2"><LogoMark size={22} /></div>

      <RailButton title="Menu" onClick={onOpenSidebar}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </RailButton>

      <RailButton title="Dashboard" onClick={navTo('#/')} active={route === '#/'}> 
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      </RailButton>

      <RailButton title="New Goal" onClick={navTo('#/')}>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-white text-lg leading-none">+</span>
      </RailButton>

      <RailButton title="Timeline" onClick={navTo('#/timeline')} active={route === '#/timeline'}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 6H3"/><path d="M21 12H8"/><path d="M21 18H13"/></svg>
      </RailButton>

      <RailButton title="Suggestions" onClick={navTo('#/')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
      </RailButton>

      <div className="mt-auto mb-4">
        <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-semibold">M</div>
      </div>
    </div>
  );
}
