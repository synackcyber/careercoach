import React, { useEffect, useState } from 'react';
import { userProfileApi } from '../services/api';
import { getAccessToken, onAuthStateChange } from '../supabase/authClient';

const experienceOptions = [
  { value: 'entry', label: 'Entry Level', description: '0-2 years experience' },
  { value: 'junior', label: 'Junior', description: '2-4 years experience' },
  { value: 'mid', label: 'Mid-Level', description: '4-7 years experience' },
  { value: 'senior', label: 'Senior', description: '7-10 years experience' },
  { value: 'lead', label: 'Lead', description: '10+ years, team leadership' },
  { value: 'expert', label: 'Expert', description: '15+ years, domain authority' }
];

const industrySuggestions = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 
  'Retail', 'Consulting', 'Media', 'Non-profit', 'Government',
  'Real Estate', 'Transportation', 'Energy', 'Legal', 'Marketing'
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ 
    id: null, 
    current_role: '', 
    experience_level: 'mid', 
    industry: '' 
  });
  const [showIndustrySuggestions, setShowIndustrySuggestions] = useState(false);

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
        setTimeout(() => { 
          if (isMounted && loading) { 
            setLoading(false); 
            setError('Please sign in to view your profile.'); 
          } 
        }, 8000);
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
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const selectIndustry = (industry) => {
    setProfile({ ...profile, industry });
    setShowIndustrySuggestions(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Complete Your Profile</h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Help us personalize your career journey and create meaningful goals
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm text-gray-500">
              {[profile.current_role, profile.experience_level, profile.industry].filter(Boolean).length}/3
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${([profile.current_role, profile.experience_level, profile.industry].filter(Boolean).length / 3) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button 
              className="text-red-600 hover:text-red-800 text-sm font-medium"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={onSave} className="space-y-8">
            {/* Current Role */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-lg font-semibold text-gray-900">What's your current role?</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Software Engineer, Product Manager, Data Analyst"
                value={profile.current_role}
                onChange={(e) => setProfile({ ...profile, current_role: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                required
              />
              <p className="text-sm text-gray-500">This helps us suggest relevant goals and opportunities</p>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-lg font-semibold text-gray-900">What's your experience level?</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {experienceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfile({ ...profile, experience_level: option.value })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      profile.experience_level === option.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-lg font-semibold text-gray-900">What industry are you in?</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  onFocus={() => setShowIndustrySuggestions(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  required
                />
                {showIndustrySuggestions && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {industrySuggestions.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => selectIndustry(industry)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">We'll use this to suggest industry-relevant goals</p>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={saving || !profile.current_role || !profile.experience_level || !profile.industry}
                className={`w-full py-4 px-8 rounded-xl text-lg font-semibold transition-all duration-200 ${
                  saving || !profile.current_role || !profile.experience_level || !profile.industry
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
                }`}
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Complete Profile & Continue'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            You can always update these details later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}
