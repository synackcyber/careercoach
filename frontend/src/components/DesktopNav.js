import React from 'react';
import { motion } from 'framer-motion';
import { navItems } from '../nav/items';

const COLLAPSED = 56; // px
const EXPANDED = 320; // px

export function getDesktopNavWidth(expanded) {
  return expanded ? EXPANDED : COLLAPSED;
}

const asideVariants = {
  open: {
    width: EXPANDED,
    transition: { type: 'spring', stiffness: 320, damping: 40, when: 'beforeChildren' },
  },
  closed: {
    width: COLLAPSED,
    transition: { type: 'spring', stiffness: 320, damping: 42, when: 'afterChildren' },
  },
};

export default function DesktopNav({ expanded, onToggle, route, onLogout }) {
  const navTo = (hash) => () => { 
    window.location.hash = hash; 
    if (expanded) onToggle(); // Auto-close menu after navigation
  };
  const onGoalSuggestions = () => { 
    window.location.hash = '#/suggestions'; 
    if (expanded) onToggle(); // Auto-close menu after navigation
  };

  return (
    <motion.aside
      className="fixed top-0 left-0 h-full z-40 ring-1 ring-black/5 dark:ring-white/10 bg-[#f5f5f0]/95 dark:bg-[#1a1a1a]/95 backdrop-blur shadow-2xl rounded-r-2xl overflow-hidden"
      variants={asideVariants}
      initial={false}
      animate={expanded ? 'open' : 'closed'}
      style={{ zIndex: 50 }}
    >
      {/* Top bar */}
      <div className="h-14 flex items-center border-b border-amber-200/30 dark:border-amber-700/30">
        <div className="px-2">
          <button className="btn-icon" aria-label={expanded ? 'Collapse' : 'Expand'} onClick={onToggle}>
            {expanded ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            )}
          </button>
        </div>
        <motion.div
          className="flex items-center overflow-hidden"
          initial={false}
          animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
          transition={{ duration: 0.16 }}
        >
          <div className="font-semibold">Workspace</div>
        </motion.div>
      </div>

      {/* Main content area with flex layout */}
      <div className="flex-1 flex flex-col">
        {/* Unified nav list (includes New goal as first item) */}
        <div className={`flex-1 ${expanded ? 'overflow-auto' : 'overflow-hidden'}`}>
          <nav className="px-2 py-3 space-y-3">
            {/* Goal Suggestions lives here to keep icon order stable */}
            <button
              onClick={onGoalSuggestions}
              className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-12 py-0 rounded-xl ${expanded ? 'bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 hover:from-accent-600 hover:via-accent-700 hover:to-accent-800 text-white font-bold shadow-lg hover:shadow-xl ring-2 ring-accent-400/30 hover:ring-accent-400/50' : 'hover:bg-accent-50 hover:text-accent-600'} transform hover:scale-105 transition-all duration-200 relative overflow-hidden group mb-2`}
            >
              {/* Animated background glow - only when expanded */}
              {expanded && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
              )}
              
              <span className={`w-7 h-7 aspect-square inline-flex items-center justify-center shrink-0 rounded-full ${expanded ? 'bg-white/20 text-white ring-2 ring-white/30 shadow-lg' : 'bg-accent-100 text-accent-600 ring-1 ring-accent-200'} text-[14px] leading-none select-none relative z-10`}>💡</span>
              <motion.span
                initial={false}
                animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
                transition={{ duration: 0.16 }}
                className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 font-bold ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}
              >
                Goal Suggestions
              </motion.span>
            </button>

            {navItems.map(item => (
              <button
                key={item.key}
                onClick={navTo(item.hash)}
                className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 ${route === item.hash ? 'bg-gray-100 dark:bg-zinc-800/80' : ''}`}
              >
                <span className="w-6 h-6 aspect-square inline-flex items-center justify-center shrink-0 select-none">
                  {item.icon('w-5 h-5 text-gray-900 dark:text-zinc-100')}
                </span>
                <motion.span
                  initial={false}
                  animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
                  transition={{ duration: 0.16 }}
                  className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}
                >
                  {item.title}
                </motion.span>

              </button>
            ))}
          </nav>
        </div>

        {/* Footer - pushed to bottom with mt-auto */}
        <div className="border-t px-3 py-3 space-y-2 mt-auto">
          <button onClick={() => { const root = document.documentElement; const isDark = root.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); }} className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800`}>
            <span className="w-6 h-6 aspect-square inline-flex items-center justify-center shrink-0 select-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-zinc-100">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </span>
            <motion.span initial={false} animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }} transition={{ duration: 0.16 }} className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}>Dark Mode</motion.span>
          </button>

          <button onClick={navTo('#/account')} className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800`}>
            <span className="w-6 h-6 aspect-square inline-flex items-center justify-center shrink-0 select-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-zinc-100">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </span>
            <motion.span initial={false} animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }} transition={{ duration: 0.16 }} className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}>Account</motion.span>
          </button>
          
          <button onClick={() => { onLogout(); if (expanded) onToggle(); }} className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800`}>
            <span className="w-6 h-6 aspect-square inline-flex items-center justify-center shrink-0 select-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-zinc-100">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <motion.span initial={false} animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }} transition={{ duration: 0.16 }} className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}>Logout</motion.span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
