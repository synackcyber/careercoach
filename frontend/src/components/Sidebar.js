import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navItems } from '../nav/items';

function Badge({ children }) {
  return (
    <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">{children}</span>
  );
}

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
              <div className="h-14 flex items-center px-4 border-b font-semibold">Workspace</div>

              <div className="px-3 pt-3">
                <a href="#/" onClick={onNewGoal} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-accent-50 text-accent-800">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-accent-500 to-accent-600 text-white text-lg leading-none ring-1 ring-black/10 shadow-md shadow-accent-600/25">+</span>
                  <span className="font-medium">New goal</span>
                </a>
              </div>

              <nav className="px-2 py-3 space-y-1 overflow-auto flex-1">
                {navItems.map(item => (
                  <a key={item.key} href={item.hash} onClick={navTo(item.hash)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100">
                    {item.icon('w-5 h-5')}
                    <span>{item.title}</span>
                    {item.key === 'dashboard' ? <Badge>1</Badge> : null}
                  </a>
                ))}
              </nav>

              <div className="border-t px-3 py-3 space-y-2">
                <a href="#/profile" onClick={navTo('#/profile')} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 text-xs font-semibold">M</span>
                  <span className="font-medium">Profile</span>
                </a>
                <button onClick={() => { onLogout?.(); onClose?.(); }} className="flex w-full items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-red-700">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-semibold">⎋</span>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
