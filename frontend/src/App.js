import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import MarketData from './pages/MarketData';
import Profile from './pages/Profile';
import AccountSettings from './pages/AccountSettings';
import GoalSuggestions from './pages/GoalSuggestions';
import Admin from './pages/Admin';
import Login from './auth/Login';
import Callback from './auth/Callback';
import { onAuthStateChange, signOut } from './supabase/authClient';
import { supabase } from './supabase/authClient';
import LayoutShell from './components/LayoutShell';
import { userProfileApi } from './services/api';
import './index.css';

function parseTokensFromHash() {
  const fullHash = window.location.hash || '';
  const lastHashIndex = fullHash.lastIndexOf('#');
  if (lastHashIndex === -1) return {};
  const paramsStr = fullHash.substring(lastHashIndex + 1);
  const params = new URLSearchParams(paramsStr);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  return { access_token, refresh_token };
}

function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [session, setSession] = useState(null);
  const [mustOnboard, setMustOnboard] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const maybeSetSession = async () => {
      const { access_token, refresh_token } = parseTokensFromHash();
      if (!access_token && !refresh_token) return;
      const { data } = await supabase.auth.setSession({ access_token, refresh_token });
      if (data?.session) {
        window.location.hash = '#/';
      }
    };
    maybeSetSession();
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Fetch current session on mount so we don't flash the Login screen
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const sess = data?.session || null;
        setSession(sess);
        if (sess) {
          try {
            const { data: resp } = await userProfileApi.getOrCreate();
            const p = resp?.data || {};
            // Tech-only: do not require industry for onboarding
            const missing = !p.current_role || !p.experience_level;
            setMustOnboard(missing);
          } catch (_) {
            setMustOnboard(false);
          }
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const subscription = onAuthStateChange(async (s) => {
      setSession(s);
      setAuthLoading(false);
      if (s) {
        try {
          const { data } = await userProfileApi.getOrCreate();
          const p = data?.data || {};
          // Tech-only: do not require industry for onboarding
          const missing = !p.current_role || !p.experience_level;
          setMustOnboard(missing);
        } catch (_) {
          setMustOnboard(false);
        }
      } else {
        setMustOnboard(false);
      }
    });
    return () => subscription?.unsubscribe?.();
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.hash = '#/';
  };

  const renderContent = () => {
    if ((route || '').startsWith('#/auth/callback')) {
      return <Callback />;
    }

    if (authLoading) {
      return <div />; // return an element so LayoutShell can clone safely
    }

    if (!session) {
      return <Login />;
    }

    // Allow Market Data to render with inline profile prompt even when onboarding is required
    if (mustOnboard && route !== '#/profile' && route !== '#/market') {
      return <Profile />;
    }

    switch (route) {
      case '#/':
        return <Dashboard key={session ? 'authenticated' : 'unauthenticated'} />;
      case '#/profile':
        return <Profile />;
      case '#/account':
        return <AccountSettings />;
      case '#/suggestions':
        return <GoalSuggestions />;
      case '#/market':
        return <MarketData />;
      case '#/admin':
        return <Admin />;
      default:
        return <Dashboard key={session ? 'authenticated' : 'unauthenticated'} />;
    }
  };

  return (
    <LayoutShell route={route} session={session} onLogout={handleLogout} needsOnboarding={mustOnboard}>
      {renderContent()}
    </LayoutShell>
  );
}

export default App;