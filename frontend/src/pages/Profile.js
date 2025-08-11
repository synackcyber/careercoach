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
  const [originalProfile, setOriginalProfile] = useState(null);
  const [showIndustrySuggestions, setShowIndustrySuggestions] = useState(false);

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (!originalProfile) return false;
    return (
      profile.current_role !== originalProfile.current_role ||
      profile.experience_level !== originalProfile.experience_level ||
      profile.industry !== originalProfile.industry
    );
  };

  // Check if profile is complete (all required fields filled)
  const isProfileComplete = () => {
    return profile.current_role && profile.experience_level && profile.industry;
  };

  // Get button text based on current state
  const getButtonText = () => {
    if (saving) return 'Saving...';
    if (!isProfileComplete()) return 'Complete Profile to Continue';
    if (!hasChanges()) return 'Profile Complete ✓';
    if (originalProfile?.id) return 'Update Profile';
    return 'Save Profile';
  };

  // Get button state
  const getButtonState = () => {
    if (saving) return 'saving';
    if (!isProfileComplete()) return 'incomplete';
    if (!hasChanges()) return 'complete';
    return 'hasChanges';
  };

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
        const profileData = {
          id: p.id,
          current_role: p.current_role || '',
          experience_level: p.experience_level || 'mid',
          industry: p.industry || '',
        };
        setProfile(profileData);
        setOriginalProfile(profileData); // Store original for change detection
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
      // Update original profile to reflect saved state
      setOriginalProfile({ ...profile });
      localStorage.removeItem('onboarding_gate');
      // Only redirect if this was a new profile completion
      if (!originalProfile?.current_role || !originalProfile?.experience_level || !originalProfile?.industry) {
        window.location.hash = '#/';
      }
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
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-zinc-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const buttonState = getButtonState();

  return (
    <div className="min-h-screen app-bg">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/90 dark:bg-zinc-800 rounded-full mb-6 shadow-card ring-1 ring-black/5">
            <svg className="w-10 h-10 text-gray-700 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3">Complete Your Profile</h1>
          <p className="text-xl text-gray-600 dark:text-zinc-300 max-w-md mx-auto">
            Help us personalize your career journey and create meaningful goals
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Profile Completion</span>
            <span className="text-sm text-gray-500 dark:text-zinc-400">
              {[profile.current_role, profile.experience_level, profile.industry].filter(Boolean).length}/3
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
            <div 
              className="bg-accent-500 h-2 rounded-full transition-all duration-500 ease-out"
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
        <div className="rounded-2xl shadow-card ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-8">
          <form onSubmit={onSave} className="space-y-8">
            {/* Current Role */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">What's your current role?</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Software Engineer, Product Manager, Data Analyst"
                value={profile.current_role}
                onChange={(e) => setProfile({ ...profile, current_role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 text-lg"
                required
              />
              <p className="text-sm text-gray-500 dark:text-zinc-400">This helps us suggest relevant goals and opportunities</p>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">What's your experience level?</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {experienceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfile({ ...profile, experience_level: option.value })}
                    className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                      profile.experience_level === option.value
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 ring-2 ring-accent-200 dark:ring-accent-700'
                        : 'border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-zinc-100">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">What industry are you in?</span>
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  onFocus={() => setShowIndustrySuggestions(true)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 text-lg"
                  required
                />
                {showIndustrySuggestions && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-card ring-1 ring-black/5 max-h-60 overflow-y-auto">
                    {industrySuggestions.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => selectIndustry(industry)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg text-gray-900 dark:text-zinc-100"
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">We'll use this to suggest industry-relevant goals</p>
            </div>

            {/* Submit Button - Only show when there are changes or profile is incomplete */}
            {(buttonState === 'hasChanges' || buttonState === 'incomplete') && (
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={saving || !isProfileComplete()}
                  className={`w-full py-4 px-8 rounded-xl text-lg font-semibold transition-all duration-200 ${
                    saving || !isProfileComplete()
                      ? 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 cursor-not-allowed'
                      : 'btn-primary transform hover:scale-[1.02]'
                  }`}
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    getButtonText()
                  )}
                </button>
              </div>
            )}

            {/* Success State - Show when profile is complete and no changes */}
            {buttonState === 'complete' && (
              <div className="pt-6">
                <div className="w-full py-4 px-8 rounded-xl text-lg font-semibold bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 text-center flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Profile Complete ✓
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-zinc-400 mt-3">
                  Your profile is up to date. Make changes above to update it.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            You can always update these details later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}
