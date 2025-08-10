export const navItems = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    hash: '#/',
    icon: (cls = '') => (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    )
  },
  {
    key: 'timeline',
    title: 'Timeline',
    hash: '#/timeline',
    icon: (cls = '') => (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 6H3"/><path d="M21 12H8"/><path d="M21 18H13"/></svg>
    )
  },
  {
    key: 'timeline-vertical',
    title: 'TimeDial',
    hash: '#/timeline-vertical',
    icon: (cls = '') => (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v18"/><path d="M12 3v13"/><path d="M18 3v8"/></svg>
    )
  },
  {
    key: 'suggestions',
    title: 'Suggestions',
    hash: '#/',
    icon: (cls = '') => (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
    )
  },
  {
    key: 'profile',
    title: 'AI Settings',
    hash: '#/profile',
    icon: (cls = '') => (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a7.49 7.49 0 0 1-14.8 0"/></svg>
    )
  }
];
