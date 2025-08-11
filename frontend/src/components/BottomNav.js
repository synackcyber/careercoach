import React from 'react';
import { motion } from 'framer-motion';
import { navItems } from '../nav/items';

export default function BottomNav({ route }) {
  const navTo = (hash) => (e) => { 
    e.preventDefault(); 
    window.location.hash = hash; 
  };

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-zinc-700/50"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {/* Main Navigation Tabs */}
        {navItems.map((item) => {
          const isActive = route === item.hash;
          
          return (
            <motion.button
              key={item.key}
              onClick={navTo(item.hash)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20' 
                  : 'text-gray-500 dark:text-zinc-400 hover:text-accent-500 dark:hover:text-accent-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="w-5 h-5 mb-1">
                {item.icon('w-5 h-5')}
              </div>
              <span className="text-xs font-medium">{item.title}</span>
            </motion.button>
          );
        })}
        
        {/* New Goal Button - Special styling */}
        <motion.button
          onClick={navTo('#/new-goal')}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="w-5 h-5 mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-medium">New Goal</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}
