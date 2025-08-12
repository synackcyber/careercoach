import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../components/PageTitle';
import { userProfileApi } from '../services/api';

// Simple deterministic mock generator from strings
function hashStringToNumber(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function generateMockMarket(role, location) {
  const seed = hashStringToNumber(`${role}|${location}`);
  const rand = (min, max, m = 1) => {
    const v = (Math.sin(seed + min * 12.9898 + max * 78.233) * 43758.5453) % 1;
    const n = Math.abs(v - Math.floor(v));
    const val = min + n * (max - min);
    return Math.round(val * m) / m;
  };

  const baseSalary = rand(80, 210) * 1000; // USD
  const growthPct = rand(2, 18, 10); // percent
  const heatIdx = rand(0, 100);
  const heat = heatIdx > 66 ? 'High' : heatIdx > 33 ? 'Medium' : 'Low';

  const junior = Math.round(baseSalary * 0.72);
  const mid = Math.round(baseSalary * 1.0);
  const senior = Math.round(baseSalary * 1.35);

  const skillsPool = [
    'Python', 'Go', 'TypeScript', 'React', 'Kubernetes', 'AWS', 'GCP', 'SQL', 'Data Analysis', 'ML',
    'Security', 'Observability', 'CI/CD', 'Systems Design', 'Prompt Engineering', 'GenAI', 'Rust',
  ];
  const pathwaysPool = [
    { title: 'Team Lead', desc: 'Develop leadership skills by mentoring and owning cross‑functional initiatives.' },
    { title: 'Platform/Infra', desc: 'Deepen systems, reliability, and cloud skills to own platform foundations.' },
    { title: 'AI/ML Track', desc: 'Build ML fundamentals and MLOps to contribute to intelligent features.' },
    { title: 'Product Engineer', desc: 'Strengthen UX, rapid prototyping, and product sense for end‑to‑end delivery.' },
  ];

  const pickN = (pool, n) => {
    const local = [...pool];
    const out = [];
    let s = seed;
    for (let i = 0; i < n && local.length; i += 1) {
      s = (s * 9301 + 49297) % 233280;
      const idx = Math.floor((s / 233280) * local.length);
      out.push(local.splice(idx, 1)[0]);
    }
    return out;
  };

  return {
    averageSalary: baseSalary,
    demandGrowthPct: growthPct,
    marketHeat: heat,
    salaryBands: {
      junior,
      mid,
      senior,
    },
    topSkills: pickN(skillsPool, 8),
    suggestedPathways: pickN(pathwaysPool, 3),
  };
}

export default function MarketData() {
  const [loading, setLoading] = useState(true);
  const [profileRole, setProfileRole] = useState(null);
  const [location, setLocation] = useState('United States');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await userProfileApi.getOrCreate();
        const role = data?.data?.current_role || null;
        if (!mounted) return;
        setProfileRole(role);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const mock = useMemo(() => {
    const roleKey = profileRole || 'Unknown';
    return generateMockMarket(roleKey, location);
  }, [profileRole, location]);

  if (loading) {
    return <div className="min-h-screen app-bg" />;
  }

  const missingRole = !profileRole;

  return (
    <div className="min-h-screen app-bg">
      <div className="w-full px-6 py-6">
        <div className="mb-4 hidden md:block">
          <PageTitle className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
            Market Data
          </PageTitle>
        </div>

        {/* Controls */}
        {!missingRole && (
          <div className="mb-6">
            <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur rounded-2xl ring-1 ring-gray-200 dark:ring-zinc-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                {/* Role */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Role</label>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-zinc-800/60 ring-1 ring-gray-200 dark:ring-zinc-800 px-4 h-12">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M3 13h18"/></svg>
                      </span>
                      <span className="truncate text-gray-900 dark:text-zinc-100" title={profileRole}>
                        {profileRole}
                      </span>
                    </div>
                    <a href="#/profile" className="text-sm font-medium text-amber-700 hover:text-amber-800">Change</a>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-field w-full h-12"
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Remote (Global)</option>
                    <option>European Union</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline profile completion prompt */}
        {missingRole && (
          <div className="mb-6 rounded-xl border-2 border-amber-300 dark:border-amber-500 bg-amber-50/70 dark:bg-amber-900/20 p-4">
            <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">Complete your profile to personalize market insights</div>
            <div className="text-sm text-amber-700/90 dark:text-amber-300/90 mb-3">Add your current role to unlock role‑specific salary bands, demand trends, and skill recommendations.</div>
            <button className="btn-primary" onClick={() => { window.location.hash = '#/profile'; }}>Complete Profile</button>
          </div>
        )}

        {/* Overview metrics */}
        {!missingRole && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border-2 border-gray-200 dark:border-zinc-800 p-4 bg-white/95 dark:bg-zinc-900/95">
              <div className="text-sm text-gray-500 dark:text-zinc-400">Avg Base Salary</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mt-1">${mock.averageSalary.toLocaleString()}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">USD • {location}</div>
            </div>
            <div className="rounded-xl border-2 border-gray-200 dark:border-zinc-800 p-4 bg-white/95 dark:bg-zinc-900/95">
              <div className="text-sm text-gray-500 dark:text-zinc-400">Demand Growth</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mt-1">{mock.demandGrowthPct}%</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">12‑18 months outlook</div>
            </div>
            <div className="rounded-xl border-2 border-gray-200 dark:border-zinc-800 p-4 bg-white/95 dark:bg-zinc-900/95">
              <div className="text-sm text-gray-500 dark:text-zinc-400">Market Heat</div>
              <div className={`text-2xl font-semibold mt-1 ${mock.marketHeat === 'High' ? 'text-emerald-600' : mock.marketHeat === 'Medium' ? 'text-amber-600' : 'text-gray-700 dark:text-zinc-300'}`}>{mock.marketHeat}</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Relative opportunity</div>
            </div>
          </div>
        )}

        {/* Trends placeholder */}
        {!missingRole && (
          <div className="mb-6 rounded-xl border-2 border-gray-200 dark:border-zinc-800 p-6 bg-white/95 dark:bg-zinc-900/95">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900 dark:text-zinc-100">Trends</div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">Last 12 months</div>
            </div>
            <div className="h-40 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-800/60 flex items-center justify-center text-gray-500 dark:text-zinc-400">
              Chart coming soon
            </div>
          </div>
        )}

        {/* Salary bands */}
        {!missingRole && (
          <div className="mb-6 rounded-xl border-2 border-gray-200 dark:border-zinc-800 p-6 bg-white/95 dark:bg-zinc-900/95">
            <div className="font-semibold text-gray-900 dark:text-zinc-100 mb-4">Salary Bands</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border p-4 border-gray-200 dark:border-zinc-800">
                <div className="text-sm text-gray-500 dark:text-zinc-400">Junior</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mt-1">${mock.salaryBands.junior.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border p-4 border-gray-200 dark:border-zinc-800">
                <div className="text-sm text-gray-500 dark:text-zinc-400">Mid‑level</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mt-1">${mock.salaryBands.mid.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border p-4 border-gray-200 dark:border-zinc-800">
                <div className="text-sm text-gray-500 dark:text-zinc-400">Senior</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mt-1">${mock.salaryBands.senior.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* In‑demand skills */}
        {!missingRole && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl border-2 border-gray-200 dark:border-zinc-800 p-6 bg-white/95 dark:bg-zinc-900/95">
              <div className="font-semibold text-gray-900 dark:text-zinc-100 mb-3">In‑demand Skills</div>
              <div className="flex flex-wrap gap-2">
                {mock.topSkills.map((s, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggested pathways */}
        {!missingRole && (
          <div className="rounded-xl border-2 border-gray-200 dark:border-zinc-800 p-6 bg-white/95 dark:bg-zinc-900/95">
            <div className="font-semibold text-gray-900 dark:text-zinc-100 mb-3">Suggested Pathways</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mock.suggestedPathways.map((p, i) => (
                <div key={i} className="rounded-xl border p-4 border-gray-200 dark:border-zinc-800">
                  <div className="font-medium text-gray-900 dark:text-zinc-100">{p.title}</div>
                  <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


