import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import TimelineVertical from './pages/TimelineVertical';
import Profile from './pages/Profile';
import NewGoal from './pages/NewGoal';
import Login from './auth/Login';
import Callback from './auth/Callback';
import { onAuthStateChange, signOut } from './supabase/authClient';
import { supabase } from './supabase/authClient';
import LayoutShell from './components/LayoutShell';
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
    const subscription = onAuthStateChange((s) => setSession(s));
    return () => subscription?.unsubscribe?.();
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.hash = '#/';
  };

  const renderContent = () => {
    if (route === '#/auth/callback') {
      return <Callback />;
    }

    if (!session) {
      return <Login />;
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