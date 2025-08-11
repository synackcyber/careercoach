import React, { useEffect, useState } from 'react';
import { userProfileApi } from '../services/api';

const experienceOptions = ['entry','junior','mid','senior','lead','expert'];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ id: null, current_role: '', experience_level: 'mid', industry: '' });
  const fromGate = !!localStorage.getItem('onboarding_gate');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await userProfileApi.getOrCreate();
        const p = data.data || {};
        setProfile({
          id: p.id,
          current_role: p.current_role || '',
          experience_level: p.experience_level || 'mid',
          industry: p.industry || '',
        });
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
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
      {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
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
