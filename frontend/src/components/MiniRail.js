import React from 'react';
import LogoMark from './LogoMark';
import { navItems } from '../nav/items';

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

      {navItems.map(item => (
        <RailButton key={item.key} title={item.title} onClick={navTo(item.hash)} active={route === item.hash}>
          {item.icon('')}
        </RailButton>
      ))}

      <div className="mt-auto mb-4">
        <button
          title="Profile"
          onClick={navTo('#/profile')}
          className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-semibold hover:bg-zinc-300 transition-colors"
        >
          M
        </button>
      </div>
    </div>
  );
}
