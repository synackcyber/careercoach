import React from 'react';
import { navItems } from '../nav/items';

export default function BottomNav({ route }) {
  const navTo = (hash) => () => { window.location.hash = hash; };
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur border-t border-zinc-200 sm:hidden">
      <div className="grid grid-cols-4 gap-1 py-2">
        {navItems.slice(0,4).map(item => (
          <button key={item.key} onClick={navTo(item.hash)} className="flex flex-col items-center gap-1 text-[11px] py-1">
            {item.icon('w-5 h-5')}
            <span className={`${route === item.hash ? 'text-accent-700' : 'text-zinc-500'}`}>{item.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
