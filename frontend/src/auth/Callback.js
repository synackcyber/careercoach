import React, { useEffect, useState } from 'react';
import { supabase, onAuthStateChange } from '../supabase/authClient';

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

export default function Callback() {
  const [status, setStatus] = useState('Signing you in...');
  const [error, setError] = useState('');

  useEffect(() => {
    let subscription;

    const init = async () => {
      try {
        const { access_token, refresh_token } = parseTokensFromHash();
        if (access_token) {
          setStatus('Setting session...');
          const { data: setData, error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) {
            console.error('setSession error:', setErr);
          }
          if (setData?.session) {
            window.location.hash = '#/';
            return;
          }
          // Try again if only refresh token works
          if (refresh_token) {
            setStatus('Finalizing session...');
            const { data: setData2, error: setErr2 } = await supabase.auth.setSession({ refresh_token });
            if (!setErr2 && setData2?.session) {
              window.location.hash = '#/';
              return;
            }
          }
        }

        // Fallback: check existing session or wait for change
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          window.location.hash = '#/';
          return;
        }

        subscription = onAuthStateChange((session) => {
          if (session) {
            window.location.hash = '#/';
          }
        });
        setStatus('Finalizing sign-in...');
      } catch (e) {
        console.error('Callback init error:', e);
        setError('Could not complete sign-in. You can try again.');
      }
    };

    init();
    return () => {
      try { subscription?.unsubscribe?.(); } catch (_) {}
    };
  }, []);

  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-6">
      <div className="card p-6 w-full max-w-md text-center">
        <h1 className="text-xl font-semibold mb-2">Authenticating</h1>
        {!error ? (
          <p className="text-sm text-gray-600">{status}</p>
        ) : (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <div className="mt-6">
          <a href="#/" className="btn-primary">Continue</a>
        </div>
      </div>
    </div>
  );
}
