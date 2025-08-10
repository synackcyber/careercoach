import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const listVariants = {
  open: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
  closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const itemVariants = {
  open: { opacity: 1, x: 0, scale: 1 },
  closed: { opacity: 1, x: 0, scale: 1 },
};

export default function DesktopNav({ expanded, onToggle, route }) {
  const navTo = (hash) => () => { window.location.hash = hash; };

  return (
    <motion.aside
      className="fixed top-0 left-0 h-full z-40 border-r border-zinc-900/10 bg-white/85 backdrop-blur dark:bg-zinc-900/70"
      variants={asideVariants}
      initial={false}
      animate={expanded ? 'open' : 'closed'}
    >
      <div className="h-full flex flex-col">
        {/* Top bar: left chevron is fixed; title slides in */}
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
            animate={expanded ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="font-semibold">Workspace</div>
          </motion.div>
        </div>

        <div className="px-3 pt-3">
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.button
                key="new-goal"
                onClick={navTo('#/')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-accent-50 text-accent-800"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-white text-lg leading-none">+</span>
                <span className="font-medium">New goal</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items with fixed icon box and flowing labels */}
        <motion.nav
          className="px-2 py-3 space-y-1 overflow-auto flex-1"
          variants={listVariants}
          initial={false}
          animate={expanded ? 'open' : 'closed'}
        >
          {navItems.map(item => (
            <motion.button
              key={item.key}
              variants={itemVariants}
              onClick={navTo(item.hash)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 ${route === item.hash ? 'bg-gray-100 dark:bg-zinc-800/80' : ''}`}
              layout
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            >
              <span className="w-6 h-6 inline-flex items-center justify-center">
                {item.icon('w-5 h-5')}
              </span>
              <div className="relative overflow-hidden">
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.span
                      key={`label-${item.key}`}
                      initial={{ clipPath: 'inset(0% 100% 0% 0%)' }}
                      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                      exit={{ clipPath: 'inset(0% 100% 0% 0%)' }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          ))}
        </motion.nav>

        {/* Footer controls */}
        {expanded ? (
          <div className="border-t px-3 py-2 space-y-2">
            <button onClick={() => { const root = document.documentElement; const isDark = root.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm">🌓</span>
              <span className="font-medium">Dark Mode</span>
            </button>
            <button onClick={() => { const root = document.documentElement; const enabled = root.classList.toggle('reduce-motion'); localStorage.setItem('reduceMotion', enabled ? '1' : '0'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm">⌘</span>
              <span className="font-medium">Reduce Motion</span>
            </button>
            <motion.button
              onClick={navTo('#/profile')}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 w-full"
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16 }}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 text-xs font-semibold">M</span>
              <span className="font-medium">Profile</span>
            </motion.button>
          </div>
        ) : (
          <div className="border-t px-2 py-3">
            <div className="w-full flex flex-col items-center gap-3">
              <button onClick={() => { const root = document.documentElement; const isDark = root.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); }} className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm">🌓</button>
              <button onClick={() => { const root = document.documentElement; const enabled = root.classList.toggle('reduce-motion'); localStorage.setItem('reduceMotion', enabled ? '1' : '0'); }} className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm">⌘</button>
              <button onClick={navTo('#/profile')} className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 text-xs font-semibold">M</button>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
