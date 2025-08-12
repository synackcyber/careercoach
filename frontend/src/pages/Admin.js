import React, { useEffect, useState } from 'react';
import api from '../services/api';
import PageTitle from '../components/PageTitle';
import SectionTitle from '../components/SectionTitle';

export default function Admin() {
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: h }, { data: u }, { data: a }] = await Promise.all([
          api.get('/admin/health'),
          api.get('/admin/users'),
          api.get('/admin/ai-status'),
        ]);
        setHealth(h.data || null);
        setUsers(u.data || []);
        setAiStatus(a.data || null);
      } catch (e) {
        setError('Failed to load admin data.');
      }
    };
    load();
  }, []);

  return (
          <div className="w-full max-w-5xl mx-auto p-6 ml-20">
      <PageTitle className="text-2xl font-semibold mb-4">Admin</PageTitle>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-4">
          <div className="text-sm text-zinc-500">DB ping</div>
          <div className="text-xl">{health ? `${health.db_ms} ms` : '—'}</div>
        </div>
        <div className="rounded-xl ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-4">
          <div className="text-sm text-zinc-500">Server time (UTC)</div>
          <div className="text-xl">{health ? new Date(health.time).toLocaleString() : '—'}</div>
        </div>
        <div className="rounded-xl ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-500">AI Provider</div>
              <div className="text-xl">{aiStatus ? aiStatus.provider : '—'}</div>
            </div>
            {aiStatus && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                aiStatus.health?.status === 'up' || aiStatus.health?.status === 'up-local' ? 'bg-green-100 text-green-700' :
                aiStatus.health?.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {aiStatus.health?.status || '—'}
              </div>
            )}
          </div>
          {aiStatus && (
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              <div>Calls (window): {aiStatus.total_calls}</div>
              <div>Success: {aiStatus.success_calls}</div>
              <div>Avg latency: {aiStatus.avg_latency_ms} ms</div>
              {aiStatus.health?.last_success && (
                <div>Last success: {new Date(aiStatus.health.last_success).toLocaleString()}</div>
              )}
              {typeof aiStatus.health?.fallback_rate === 'number' && (
                <div>Fallback rate: {(aiStatus.health.fallback_rate * 100).toFixed(0)}%</div>
              )}
              {aiStatus.health?.reason && (
                <div className="text-xs text-zinc-500 mt-1">{aiStatus.health.reason}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle className="text-lg font-semibold">Users</SectionTitle>
          <div className="text-sm text-zinc-500">{users.length} total (showing latest)</div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2 pr-4">User ID</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Experience</th>
                <th className="py-2 pr-4">Industry</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <td className="py-2 pr-4 font-mono text-[12px]">{u.user_id || '—'}</td>
                  <td className="py-2 pr-4">{u.current_role || '—'}</td>
                  <td className="py-2 pr-4">{u.experience_level || '—'}</td>
                  <td className="py-2 pr-4">{u.industry || '—'}</td>
                  <td className="py-2 pr-4">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td className="py-4 text-zinc-500" colSpan={5}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


