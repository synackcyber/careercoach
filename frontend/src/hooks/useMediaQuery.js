import { useEffect, useState } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    try { mql.addEventListener('change', handler); } catch { mql.addListener(handler); }
    return () => {
      try { mql.removeEventListener('change', handler); } catch { mql.removeListener(handler); }
    };
  }, [query]);

  return matches;
}
