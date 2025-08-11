import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import TimelineVertical from './pages/TimelineVertical';
import Profile from './pages/Profile';
import NewGoal from './pages/NewGoal';
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

  useEffect(() => {
    const subscription = onAuthStateChange(async (s) => {
      setSession(s);
      if (s) {
        try {
          const { data } = await userProfileApi.getOrCreate();
          const p = data?.data || {};
          const missing = !p.current_role || !p.experience_level || !p.industry;
          setMustOnboard(missing);
          if (missing) {
            localStorage.setItem('onboarding_gate', '1');
            window.location.hash = '#/profile';
          } else {
            localStorage.removeItem('onboarding_gate');
          }
        } catch (_) {
          setMustOnboard(false);
        }
      } else {
        setMustOnboard(false);
        localStorage.removeItem('onboarding_gate');
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

    if (!session) {
      return <Login />;
    }

    if (mustOnboard && route !== '#/profile') {
      return <Profile />;
    }

    switch (route) {
      case '#/':
        return <Dashboard key={session ? 'authenticated' : 'unauthenticated'} />;
      case '#/timeline':
        return <TimelineVertical />;
      case '#/profile':
        return <Profile />;
      case '#/new-goal':
        return <NewGoal />;
      case '#/admin':
        return <Admin />;
      default:
        return <Dashboard key={session ? 'authenticated' : 'unauthenticated'} />;
    }
  };

  return (
    <LayoutShell route={route} session={session} onLogout={handleLogout}>
      {renderContent()}
    </LayoutShell>
  );
}

export default App;