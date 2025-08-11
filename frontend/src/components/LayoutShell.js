import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from './Sidebar';
// import BottomNav from './BottomNav'; // removed for mobile per new design
import { useMediaQuery } from '../hooks/useMediaQuery';
import DesktopNav, { getDesktopNavWidth } from './DesktopNav';
import { motion } from 'framer-motion';

export default function LayoutShell({ route, session, onLogout, needsOnboarding, children }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const isAuthenticated = !!session;

  // FAB expanded on load; collapses when user scrolls
  const [fabExpanded, setFabExpanded] = useState(true);
  const [showPageTitle, setShowPageTitle] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      // Collapse when scrolled down a bit; expand when near top
      setFabExpanded(y < 40);
      // Show page title when scrolled down
      setShowPageTitle(y > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Map route to title for the mobile header
  const pageTitle = useMemo(() => {
    switch (route) {
      case '#/':
        return 'Dashboard';
      case '#/timeline':
        return 'Timeline';
      case '#/profile':
        return 'Profile';
      case '#/new-goal':
        return 'New Goal';
      case '#/admin':
        return 'Admin';
      case '#/account':
        return 'Account';
      default:
        return 'RealtimeResume';
    }
  }, [route]);

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

  const navigate = (hash) => { window.location.hash = hash; };

  return (
    <div className="min-h-screen bg-[#f5f5f0] dark:bg-[#1a1a1a]">
      {/* Desktop push nav (width-based) */}
      {isDesktop && isAuthenticated && (
        <DesktopNav
          expanded={desktopExpanded}
          onToggle={() => setDesktopExpanded(v => !v)}
          route={route}
          onLogout={onLogout}
        />
      )}

      {/* Mobile header: hamburger, centered title, right actions */}
      {!isDesktop && isAuthenticated && (
        <div className="fixed top-0 left-0 right-0 z-40 h-14 px-3 flex items-center justify-between bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-gray-200/60 dark:border-zinc-800/60">
          <button
            aria-label="Open menu"
            className="btn-icon"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <motion.div 
            className="text-sm font-semibold text-gray-900 dark:text-zinc-100"
            initial={false}
            animate={{ opacity: showPageTitle ? 1 : 0, scale: showPageTitle ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {pageTitle}
          </motion.div>

          <div className="flex items-center gap-2">
          </div>
        </div>
      )}

      {/* Drawer for tablet/mobile */}
      {!isDesktop && isAuthenticated && (
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />
      )}

      <motion.main
        className="min-h-screen relative"
        initial={false}
        animate={{ paddingLeft: isDesktop ? '80px' : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 40 }}
      >
        {/* add top padding for mobile header; remove bottom nav padding */}
        <div className={`${(!isDesktop && isAuthenticated) ? 'pt-16 pb-4' : 'pb-0'}`}>
          {isAuthenticated && needsOnboarding && route !== '#/profile' && (
            <div className="px-6 pt-2">
              <div className="max-w-7xl mx-auto">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
                  <div className="text-sm text-amber-900">Complete your profile to personalize your goals.</div>
                  <button className="btn-wire" onClick={() => { window.location.hash = '#/profile'; }}>Complete profile</button>
                </div>
              </div>
            </div>
          )}
          {children}
        </div>

        {/* Floating New Goal button (mobile) */}
        {!isDesktop && isAuthenticated && (
          <motion.button
            aria-label="Create new goal"
            onClick={() => navigate('#/new-goal')}
            initial={false}
            animate={{ width: fabExpanded ? 152 : 56 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed bottom-5 right-4 z-40 h-14 rounded-full shadow-xl ring-2 ring-accent-400/40 bg-gradient-to-br from-accent-500 to-accent-600 text-white flex items-center justify-center hover:shadow-2xl active:scale-95 transition-all px-4"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {/* Animated label */}
            <motion.span
              initial={false}
              animate={{ opacity: fabExpanded ? 1 : 0, width: fabExpanded ? 'auto' : 0, marginLeft: fabExpanded ? 10 : 0 }}
              className="text-sm font-semibold whitespace-nowrap overflow-hidden"
            >
              New goal
            </motion.span>
          </motion.button>
        )}
      </motion.main>

      {/* BottomNav removed on mobile per new design */}
      {/* {!isTablet && isAuthenticated && <BottomNav route={route} />} */}
    </div>
  );
}
