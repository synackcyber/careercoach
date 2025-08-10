import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Badge({ children }) {
  return (
    <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">{children}</span>
  );
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const drawerVariants = {
  hidden: { x: -24, opacity: 0.0 },
  visible: { x: 56, opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 36 } }, // 56px to clear rail
  exit: { x: -24, opacity: 0, transition: { duration: 0.18 } }
};

export default function Sidebar({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-30"
            style={{ left: '3.5rem' }}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
          </motion.div>

          <motion.aside
            className="fixed top-0 left-0 h-full w-80 z-40"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="h-full rounded-r-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white/80 backdrop-blur">
              <div className="h-14 flex items-center px-4 border-b font-semibold">Workspace</div>
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-2">Reduce Motion</div>
                <button className="btn-wire btn-wire-sm">On</button>
              </div>
              <nav className="px-2 py-2 space-y-1 overflow-auto h-[calc(100%-4rem)]">
                <a href="#/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <span>Dashboard</span>
                </a>
                <a href="#/timeline" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <span>Timeline</span>
                </a>
                <a href="#/timeline-vertical" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <span>Timeline (Vertical)</span>
                </a>
                <a href="#/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <span>Goals</span>
                  <Badge>1</Badge>
                </a>
                <a href="#/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <span>Suggestions</span>
                </a>
                <a href="#/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <span>AI Settings</span>
                </a>
              </nav>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
