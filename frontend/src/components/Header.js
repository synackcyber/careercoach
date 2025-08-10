import React from 'react';
import LogoMark from './LogoMark';

export default function Header({ onToggleSidebar, onLogout, session }) {
  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-sm border-b border-zinc-900/10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <button
          className="btn-icon"
          aria-label="Open menu"
          onClick={onToggleSidebar}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <a href="#/" className="inline-flex items-center gap-2 font-semibold text-[15px] tracking-tight">
          <LogoMark size={24} />
          <span>RealtimeResume</span>
        </a>
        <div className="ml-auto flex items-center gap-2">
          {session && (
            <button className="btn-wire-accent btn-wire-sm" onClick={onLogout}>Logout</button>
          )}
        </div>
      </div>
    </header>
  );
}
