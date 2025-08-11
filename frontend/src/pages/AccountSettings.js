import React, { useState, useEffect } from 'react';
import { supabase, getAccessToken } from '../supabase/authClient';

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setEmail(user.email || '');
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password updated successfully!');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setSaving(false);
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
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/90 dark:bg-zinc-800 rounded-full mb-6 shadow-card ring-1 ring-black/5">
            <svg className="w-10 h-10 text-gray-700 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
          
          <div className="space-y-4">
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

        {/* Security Settings */}
        <div className="rounded-2xl shadow-card ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-6">Security</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100">Password</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Update your account password</p>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="btn-secondary"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="btn-primary w-full"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
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
