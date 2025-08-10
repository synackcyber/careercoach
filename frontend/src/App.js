import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import TimelineVertical from './pages/TimelineVertical';
import Profile from './pages/Profile';
import Login from './auth/Login';
import Callback from './auth/Callback';
import { onAuthStateChange, signOut } from './supabase/authClient';
import { supabase } from './supabase/authClient';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MiniRail from './components/MiniRail';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        return <Timeline />;
      case '#/timeline-vertical':
        return <TimelineVertical />;
      case '#/profile':
        return <Profile />;
      default:
        return <Dashboard key={session ? 'authenticated' : 'unauthenticated'} />;
    }
  };

  return (
    <div className="App">
      <MiniRail onOpenSidebar={() => setSidebarOpen(true)} route={route} open={sidebarOpen} />
      <div className="pl-14">
        <Header onToggleSidebar={() => setSidebarOpen(true)} onLogout={handleLogout} session={session} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main>{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;