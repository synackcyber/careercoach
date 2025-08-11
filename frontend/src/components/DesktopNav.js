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
  const navTo = (hash) => () => { window.location.hash = hash; };
  const onNewGoal = () => { window.location.hash = '#/new-goal'; };

  return (
    <motion.aside
      className="fixed top-0 left-0 h-full z-40 ring-1 ring-black/5 bg-white/85 backdrop-blur dark:bg-zinc-900/70 shadow-2xl rounded-r-2xl overflow-hidden"
      variants={asideVariants}
      initial={false}
      animate={expanded ? 'open' : 'closed'}
    >
      {/* Top bar */}
      <div className="h-14 flex items-center border-b">
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
          <nav className="px-2 py-3 space-y-1">
            {/* New goal lives here to keep icon order stable */}
            <button
              onClick={onNewGoal}
              className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800`}
            >
              <span className="w-6 h-6 aspect-square inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-b from-accent-500 to-accent-600 text-white text-[12px] leading-none select-none ring-1 ring-black/10 shadow-md shadow-accent-600/25">+</span>
              <motion.span
                initial={false}
                animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
                transition={{ duration: 0.16 }}
                className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}
              >
                New goal
              </motion.span>
            </button>

            {navItems.map(item => (
              <button
                key={item.key}
                onClick={navTo(item.hash)}
                className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 ${route === item.hash ? 'bg-gray-100 dark:bg-zinc-800/80' : ''}`}
              >
                <span className="w-6 h-6 aspect-square inline-flex items-center justify-center shrink-0 select-none">
                  {item.icon('w-5 h-5')}
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
      </div>

      {/* Footer */}
      <div className="border-t px-3 py-2 space-y-2">
        <button onClick={() => { const root = document.documentElement; const isDark = root.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); }} className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800`}>
          <span className="inline-flex w-6 h-6 aspect-square items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-[12px] select-none">🌓</span>
          <motion.span initial={false} animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }} transition={{ duration: 0.16 }} className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}>Dark Mode</motion.span>
        </button>

        <button onClick={navTo('#/account')} className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800`}>
          <span className="inline-flex w-6 h-6 aspect-square items-center justify-center rounded-full bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-100 text-[12px] select-none">⚙️</span>
          <motion.span initial={false} animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }} transition={{ duration: 0.16 }} className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}>Account</motion.span>
        </button>
        <button onClick={onLogout} className={`w-full flex items-center ${expanded ? 'gap-3 px-3 justify-start' : 'px-0 justify-center'} h-10 py-0 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300`}>
          <span className="inline-flex w-6 h-6 aspect-square items-center justify-center rounded-full bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-200 text-[12px] select-none">⎋</span>
          <motion.span initial={false} animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }} transition={{ duration: 0.16 }} className={`overflow-hidden whitespace-nowrap transition-[max-width] duration-200 ${expanded ? 'max-w-[220px]' : 'max-w-0'}`}>Logout</motion.span>
        </button>
      </div>
    </motion.aside>
  );
}
