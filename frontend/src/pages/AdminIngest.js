import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminIngest() {
  const [status, setStatus] = useState(null);
  const [sources, setSources] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [{ data: s1 }, { data: s2 }] = await Promise.all([
        api.get('/admin/ingest/status'),
        api.get('/admin/ingest/sources'),
      ]);
      setStatus(s1.data || null);
      setSources(s2.data || []);
    } catch (e) {
      setError('Failed to load admin ingest status.');
    }
  };

  useEffect(() => { load(); }, []);

  const runNow = async () => {
    try {
      setRunning(true);
      setError('');
      const { data } = await api.post('/admin/ingest/run');
      setStatus(data.data || null);
    } catch (e) {
      setError('Failed to run ingest.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin · Ingestion</h1>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      <div className="rounded-xl ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-500">Last status</div>
            <div className="text-sm">{status ? `Fetched ${status.postings_fetched}, Upserted ${status.postings_upserted}, Deduped ${status.deduped}` : 'No runs yet'}</div>
          </div>
          <button className="btn-primary" onClick={runNow} disabled={running}>{running ? 'Running…' : 'Run now'}</button>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-black/5 bg-white/85 dark:bg-zinc-900/70 backdrop-blur p-4">
        <div className="text-sm text-zinc-500 mb-2">Sources</div>
        <ul className="text-sm space-y-2">
          {sources.map((s, i) => (
            <li key={i} className="flex items-center justify-between">
              <span>{s.name} · {s.type}</span>
              <span className="text-zinc-500 truncate max-w-xs">{s.base_url}</span>
            </li>
          ))}
          {sources.length === 0 && <li className="text-zinc-500">No sources configured</li>}
        </ul>
      </div>
    </div>
  );
}


