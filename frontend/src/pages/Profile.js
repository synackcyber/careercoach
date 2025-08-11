import React, { useEffect, useState } from 'react';
import { userProfileApi } from '../services/api';
import { getAccessToken, onAuthStateChange } from '../supabase/authClient';

const experienceOptions = ['entry','junior','mid','senior','lead','expert'];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ id: null, current_role: '', experience_level: 'mid', industry: '' });
  const fromGate = !!localStorage.getItem('onboarding_gate');

  useEffect(() => {
    let isMounted = true;
    let subscription;

    const fetchWithTimeout = async () => {
      try { console.debug('[profile] fetchWithTimeout start'); } catch (_) {}
      if (!isMounted) return;
      setLoading(true);
      setError('');
      const timeoutMs = 15000;
      try {
        const result = await Promise.race([
          userProfileApi.getOrCreate(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
        ]);
        if (!isMounted) return;
        try { console.debug('[profile] fetch success'); } catch (_) {}
        const p = result?.data?.data || {};
        setProfile({
          id: p.id,
          current_role: p.current_role || '',
          experience_level: p.experience_level || 'mid',
          industry: p.industry || '',
        });
      } catch (e) {
        if (!isMounted) return;
        try { console.error('[profile] fetch error', e); } catch (_) {}
        setError('Failed to load profile. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
        try { console.debug('[profile] loading = false'); } catch (_) {}
      }
    };

    const ensureAuthThenFetch = async () => {
      // Kick off an immediate fetch attempt (will 401 fast if unauthenticated)
      fetchWithTimeout();

      const token = await getAccessToken();
      try { console.debug('[profile] token present =', !!token); } catch (_) {}
      if (!token) {
        subscription = onAuthStateChange((s) => {
          if (s) {
            try { console.debug('[profile] session arrived, fetching'); } catch (_) {}
            fetchWithTimeout();
            try { subscription?.unsubscribe?.(); } catch (_) {}
          }
        });
        // Fallback: stop showing spinner if auth doesn't arrive quickly
        setTimeout(() => { if (isMounted && loading) { setLoading(false); setError('Please sign in to view your profile.'); } }, 8000);
      }
    };

    ensureAuthThenFetch();

    return () => {
      isMounted = false;
      try { subscription?.unsubscribe?.(); } catch (_) {}
    };
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (!profile.current_role || !profile.experience_level || !profile.industry) {
        setError('Please complete all required fields');
        return;
      }
      await userProfileApi.update(profile.id, {
        current_role: profile.current_role,
        experience_level: profile.experience_level,
        industry: profile.industry,
      });
      localStorage.removeItem('onboarding_gate');
      window.location.hash = '#/';
    } catch (e) {
      setError('Failed to save profile');
    }
  };

  if (loading) return <div className="p-6">Loading profile…</div>;

  return (
    <div className="p-6 max-w-xl">
      {fromGate && <div className="mb-4 text-sm bg-yellow-50 text-yellow-800 rounded p-3">Complete your profile to continue.</div>}
      <h1 className="text-xl font-semibold mb-4">Your Profile</h1>
      {error && (
        <div className="text-red-600 mb-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button className="btn-secondary btn-wire-sm" onClick={() => { window.location.reload(); }}>Retry</button>
        </div>
      )}
      <form className="space-y-4" onSubmit={onSave}>
        <div>
          <label className="block text-sm mb-1">Current Role</label>
          <input className="input-field w-full" value={profile.current_role} onChange={(e) => setProfile({ ...profile, current_role: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Experience Level</label>
          <select className="input-field w-full" value={profile.experience_level} onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })} required>
            {experienceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Industry</label>
          <input className="input-field w-full" value={profile.industry} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} required />
        </div>
        <button className="btn-primary" type="submit">Save</button>
      </form>
    </div>
  );
}
