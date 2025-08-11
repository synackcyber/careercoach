import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navItems } from '../nav/items';



const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const drawerVariants = { hidden: { x: -24, opacity: 0 }, visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 36 } }, exit: { x: -24, opacity: 0, transition: { duration: 0.18 } } };

export default function Sidebar({ open, onClose, onLogout }) {
  const navTo = (hash) => (e) => { e.preventDefault(); window.location.hash = hash; onClose?.(); };
  const onNewGoal = (e) => { e.preventDefault(); window.location.hash = '#/new-goal'; onClose?.(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-30" variants={overlayVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
          </motion.div>

          <motion.aside className="fixed top-0 left-0 h-full w-80 z-40" variants={drawerVariants} initial="hidden" animate="visible" exit="exit">
            <div className="h-full rounded-r-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white/85 backdrop-blur flex flex-col">
              <div className="h-14 flex items-center border-b">
                <div className="px-2">
                  <button className="btn-icon" aria-label="Close menu" onClick={onClose}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                </div>
                <div className="flex items-center overflow-hidden">
                  <div className="font-semibold">Account</div>
                </div>
              </div>

              <div className="px-3 pt-3">
              </div>

              <nav className="px-2 py-3 space-y-1 overflow-auto flex-1">
                {/* Dashboard */}
                <button
                  onClick={navTo('#/')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-900 dark:text-zinc-100" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  </div>
                  <span className="font-medium">Dashboard</span>
                </button>

                {/* Timeline */}
                <button
                  onClick={navTo('#/timeline')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-900 dark:text-zinc-100" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 6H3"/><path d="M21 12H8"/><path d="M21 18H13"/></svg>
                  </div>
                  <span className="font-medium">Timeline</span>
                </button>

                {/* Account Settings */}
                <button
                  onClick={navTo('#/account')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-900 dark:text-zinc-100" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <span className="font-medium">Account Settings</span>
                </button>
              </nav>

              <div className="border-t px-3 py-3 space-y-2">
                {/* Dark Mode Toggle */}
                <button onClick={() => { const root = document.documentElement; const isDark = root.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-zinc-100">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                  </div>
                  <span>Dark Mode</span>
                </button>

                {/* Logout Button */}
                <button onClick={() => { onLogout?.(); onClose?.(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-zinc-100">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
