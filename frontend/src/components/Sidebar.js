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
                  <div className="font-semibold">Workspace</div>
                </div>
              </div>

              <div className="px-3 pt-3 pb-2">
                <button onClick={onNewGoal} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 hover:from-accent-600 hover:via-accent-700 hover:to-accent-800 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ring-2 ring-accent-400/30 hover:ring-accent-400/50 relative overflow-hidden group">
                  {/* Animated background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                  
                  <div className="w-6 h-6 flex items-center justify-center shrink-0 relative z-10">
                    <span className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-white/20 text-white text-[14px] leading-none select-none ring-2 ring-white/30 shadow-lg">+</span>
                  </div>
                  <span className="font-bold relative z-10">New Goal</span>
                </button>
              </div>

              <nav className="px-2 py-3 space-y-1 overflow-auto flex-1">
                {navItems.map(item => (
                  <button
                    key={item.key}
                    onClick={navTo(item.hash)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      {item.icon('w-5 h-5 text-gray-900 dark:text-zinc-100')}
                    </div>
                    <span>{item.title}</span>
                  </button>
                ))}
              </nav>

              <div className="border-t px-3 py-3 space-y-2">
                <button onClick={() => { const root = document.documentElement; const isDark = root.classList.toggle('dark'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-zinc-100">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                  </div>
                  <span>Dark Mode</span>
                </button>

                <button onClick={navTo('#/account')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-zinc-100">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <span>Account</span>
                </button>
                <button onClick={() => { onLogout?.(); onClose?.(); }} className="w-full flex items-center gap-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800">
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
