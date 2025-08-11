import React, { useState, useEffect } from 'react';
import { supabase, getAccessToken } from '../supabase/authClient';
import { userProfileApi } from '../services/api';

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showDisplayNameForm, setShowDisplayNameForm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setEmail(user.email || '');
          setDisplayName(user.user_metadata?.display_name || '');
          
          // Load policy acceptance from localStorage
          const storedTerms = localStorage.getItem('acceptedTerms') === 'true';
          const storedPrivacy = localStorage.getItem('acceptedPrivacy') === 'true';
          setAcceptedTerms(storedTerms);
          setAcceptedPrivacy(storedPrivacy);
          
          // Check database for policy acceptance
          try {
            const result = await userProfileApi.getOrCreate();
            const profile = result?.data?.data;
            if (profile) {
              console.log('[account] Loaded profile:', profile);
              if (profile.terms_accepted_at) {
                setAcceptedTerms(true);
                localStorage.setItem('acceptedTerms', 'true');
                console.log('[account] Terms already accepted at:', profile.terms_accepted_at);
              }
              if (profile.privacy_accepted_at) {
                setAcceptedPrivacy(true);
                localStorage.setItem('acceptedPrivacy', 'true');
                console.log('[account] Privacy already accepted at:', profile.privacy_accepted_at);
              }
            }
          } catch (err) {
            console.error('Failed to check database policy status:', err);
          }
          
          // Load reduce motion preference
          const storedReduceMotion = localStorage.getItem('reduceMotion') === '1';
          setReduceMotion(storedReduceMotion);
          if (storedReduceMotion) {
            document.documentElement.classList.add('reduce-motion');
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail === email) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Verification email sent to your new email address. Please check your inbox and click the verification link.');
        setShowEmailForm(false);
        setNewEmail('');
      }
    } catch (err) {
      setError('Failed to update email. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisplayNameChange = async (e) => {
    e.preventDefault();
    if (!newDisplayName || newDisplayName === displayName) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: newDisplayName }
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Display name updated successfully!');
        setDisplayName(newDisplayName);
        setShowDisplayNameForm(false);
        setNewDisplayName('');
      }
    } catch (err) {
      setError('Failed to update display name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTermsAcceptance = async (accepted) => {
    setAcceptedTerms(accepted);
    localStorage.setItem('acceptedTerms', accepted.toString());
    
    // Update database if user has a profile
    if (accepted) {
      try {
        console.log('[account] Updating terms acceptance for user:', user?.id);
        console.log('[account] Request payload:', { accept_terms: true });
        
        // First get the current profile to get the ID
        const profileResult = await userProfileApi.getOrCreate();
        const profile = profileResult?.data?.data;
        
        if (profile && profile.id) {
          console.log('[account] Updating profile ID:', profile.id);
          const result = await userProfileApi.update(profile.id, { accept_terms: true });
          console.log('✅ Terms accepted successfully!', result);
          setSuccess('Terms of Service accepted successfully!');
        } else {
          throw new Error('No profile found to update');
        }
      } catch (err) {
        console.error('❌ Terms acceptance failed:', err);
        setError('Failed to update terms acceptance. Please try again.');
      }
    }
  };

  const handlePrivacyAcceptance = async (accepted) => {
    setAcceptedPrivacy(accepted);
    localStorage.setItem('acceptedPrivacy', accepted.toString());
    
    // Update database if user has a profile
    if (accepted) {
      try {
        console.log('[account] Updating privacy acceptance for user:', user?.id);
        console.log('[account] Request payload:', { accept_privacy: true });
        
        // First get the current profile to get the ID
        const profileResult = await userProfileApi.getOrCreate();
        const profile = profileResult?.data?.data;
        
        if (profile && profile.id) {
          console.log('[account] Updating profile ID:', profile.id);
          const result = await userProfileApi.update(profile.id, { accept_privacy: true });
          console.log('✅ Privacy policy accepted successfully!', result);
          setSuccess('Privacy Policy accepted successfully!');
        } else {
          throw new Error('No profile found to update');
        }
      } catch (err) {
        console.error('❌ Privacy policy acceptance failed:', err);
        setError('Failed to update privacy acceptance. Please try again.');
      }
    }
  };



  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        setError(error.message);
      } else {
        // Redirect to login after account deletion
        window.location.hash = '#/';
        await supabase.auth.signOut();
      }
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear policy acceptance when signing out
      localStorage.removeItem('acceptedTerms');
      localStorage.removeItem('acceptedPrivacy');
      await supabase.auth.signOut();
      window.location.hash = '#/';
    } catch (err) {
      setError('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-zinc-400">Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg">
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-100 dark:bg-accent-900/30 rounded-full mb-6 shadow-sm ring-1 ring-accent-200/50 dark:ring-accent-700/30">
            <svg className="w-10 h-10 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3">Account Settings</h1>
          <p className="text-xl text-gray-600 dark:text-zinc-300 max-w-md mx-auto">
            Manage your account, email, and security settings
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Account Information */}
        <div className="rounded-2xl shadow-card ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-6">Account Information</h2>
          
          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Display Name</label>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-zinc-100">
                  {displayName || 'Not set'}
                </span>
                <button
                  onClick={() => setShowDisplayNameForm(!showDisplayNameForm)}
                  className="btn-secondary"
                >
                  {showDisplayNameForm ? 'Cancel' : displayName ? 'Edit Name' : 'Set Name'}
                </button>
              </div>
            </div>

            {showDisplayNameForm && (
              <form onSubmit={handleDisplayNameChange} className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
                      placeholder="Enter your preferred name"
                      required
                    />
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                      This is how your name will appear throughout the app
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !newDisplayName || newDisplayName === displayName}
                    className="btn-primary w-full"
                  >
                    {saving ? 'Updating...' : 'Update Display Name'}
                  </button>
                </div>
              </form>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Email Address</label>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-zinc-100">{email}</span>
                <button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  className="btn-secondary"
                >
                  {showEmailForm ? 'Cancel' : 'Change Email'}
                </button>
              </div>
            </div>

            {showEmailForm && (
              <form onSubmit={handleEmailChange} className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">New Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
                      placeholder="Enter new email address"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !newEmail || newEmail === email}
                    className="btn-primary w-full"
                  >
                    {saving ? 'Updating...' : 'Update Email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Legal Agreements */}
        <div className="rounded-2xl shadow-card ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-6">Legal Agreements</h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => handleTermsAcceptance(e.target.checked)}
                  className="mt-1 h-5 w-5 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-700 dark:text-zinc-300">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-600 hover:text-accent-500 underline"
                  >
                    Terms of Service
                  </a>
                </label>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={acceptedPrivacy}
                  onChange={(e) => handlePrivacyAcceptance(e.target.checked)}
                  className="mt-1 h-5 w-5 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="privacy" className="text-sm text-gray-700 dark:text-zinc-300">
                  I agree to the{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-600 hover:text-accent-500 underline"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                You must accept these agreements to use our service. Your acceptance is recorded and stored securely.
                {acceptedTerms && acceptedPrivacy && (
                  <span className="block mt-2 text-green-600 dark:text-green-400 font-medium">
                    ✓ All agreements accepted
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Authentication Info */}
        <div className="rounded-2xl shadow-card ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-6">Authentication</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Sign-in Method</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Magic link authentication via email</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                Magic Link
              </span>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Your account uses secure magic link authentication. Each time you sign in, 
                we'll send a unique, time-limited link to your email address. 
                No passwords to remember or manage.
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-2xl shadow-card ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-6">Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Reduce Motion</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Disable animations for users with motion sensitivity</p>
              </div>
              <button 
                onClick={() => { 
                  const root = document.documentElement; 
                  const enabled = root.classList.toggle('reduce-motion'); 
                  localStorage.setItem('reduceMotion', enabled ? '1' : '0');
                  setReduceMotion(enabled);
                  setSuccess('Motion preference updated successfully!');
                }} 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                {reduceMotion ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                This setting helps users who are sensitive to motion or prefer a more static experience. 
                When enabled, animations and transitions throughout the app will be reduced or disabled.
              </p>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="rounded-2xl shadow-card ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-6">Account Actions</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Sign Out</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Sign out of your account on this device</p>
              </div>
              <button onClick={handleSignOut} className="btn-secondary">
                Sign Out
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-700">
              <div>
                <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            Need help? Contact support if you have any questions about your account.
          </p>
        </div>
      </div>
    </div>
  );
}
