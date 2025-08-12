import React, { useState } from 'react';
import { signInWithMagicLink } from '../supabase/authClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleMagic = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    const { error } = await signInWithMagicLink(email);
    if (error) setError(error.message || 'Failed to send magic link');
    else setMessage('Check your email for the magic link.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-6">
      <div className="card p-6 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>

        <form className="space-y-4" onSubmit={handleMagic}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full"
            required
          />
          <button disabled={loading} className="btn-primary w-full" type="submit">
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>

        {message && <p className="text-green-600 mt-3 text-sm">{message}</p>}
        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
      </div>
    </div>
  );
}


