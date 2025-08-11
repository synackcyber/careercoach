import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useMediaQuery } from '../hooks/useMediaQuery';
import DesktopNav, { getDesktopNavWidth } from './DesktopNav';
import { motion } from 'framer-motion';

export default function LayoutShell({ route, session, onLogout, children }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 640px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const isAuthenticated = !!session;

  // Apply saved preferences for theme and motion
  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') root.classList.add('dark');
    if (savedTheme === 'light') root.classList.remove('dark');

    const savedRM = localStorage.getItem('reduceMotion');
    if (savedRM === '1') root.classList.add('reduce-motion');
    if (savedRM === '0') root.classList.remove('reduce-motion');
  }, []);

  const contentPaddingLeft = isDesktop && isAuthenticated ? getDesktopNavWidth(desktopExpanded) : 0;

  return (
    <div className="min-h-screen app-bg">
      {/* Desktop push nav (width-based) */}
      {isDesktop && isAuthenticated && (
        <DesktopNav
          expanded={desktopExpanded}
          onToggle={() => setDesktopExpanded(v => !v)}
          route={route}
          onLogout={onLogout}
        />
      )}

      {/* Tablet/Mobile hamburger trigger */}
      {!isDesktop && isAuthenticated && (
        <button
          className="fixed top-3 left-3 z-40 btn-icon"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      )}

      {/* Drawer for tablet/mobile */}
      {!isDesktop && isAuthenticated && (
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />
      )}

      <motion.main
        className="min-h-screen relative"
        initial={false}
        animate={{ paddingLeft: contentPaddingLeft }}
        transition={{ type: 'spring', stiffness: 320, damping: 40 }}
      >
        <div className={`${(!isDesktop && isAuthenticated) ? 'pt-14 pb-16' : 'pb-0'}`}>
          {children}
        </div>
      </motion.main>

      {!isTablet && isAuthenticated && <BottomNav route={route} />}
    </div>
  );
}
