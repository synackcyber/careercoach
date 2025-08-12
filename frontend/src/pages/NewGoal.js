import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageTitle from '../components/PageTitle';
import { goalApi, jobRoleApi, responsibilityApi, userProfileApi } from '../services/api';
import AIGoalSuggestions from '../components/AIGoalSuggestions';

export default function NewGoal() {
  const [jobRoles, setJobRoles] = useState([]);
  const [jobRoleId, setJobRoleId] = useState('');
  const [responsibilities, setResponsibilities] = useState([]);
  const [responsibilityId, setResponsibilityId] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    let mounted = true;
    jobRoleApi.getAll().then(({ data }) => {
      if (!mounted) return;
      setJobRoles(data?.data || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    userProfileApi.getOrCreate().then(({ data }) => {
      const p = data?.data || {};
      setUserProfile({
        current_role: p.current_role || 'Professional',
        experience_level: p.experience_level || 'mid',
        industry: p.industry || 'Technology',
        company_size: p.company_size || 'mid-size',
        learning_style: p.learning_style || 'balanced',
        available_hours_week: p.available_hours_week || 10,
        career_goals: p.career_goals || '',
        current_tools: p.current_tools || '[]',
        skill_gaps: p.skill_gaps || '[]'
      });
    }).catch(() => {});
  }, []);

  // Load responsibilities when a job role is selected
  React.useEffect(() => {
    let mounted = true;
    if (!jobRoleId) {
      setResponsibilities([]);
      setResponsibilityId('');
      return;
    }
    responsibilityApi.getByJobRole(Number(jobRoleId))
      .then(({ data }) => {
        if (!mounted) return;
        const list = data?.data || [];
        setResponsibilities(list);
        if (!responsibilityId && list.length > 0) {
          setResponsibilityId(String(list[0].id));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [jobRoleId]);

  // Try to auto-match job role from user profile, then fallback to any responsibility
  React.useEffect(() => {
    if (!userProfile || !jobRoles || jobRoles.length === 0) return;
    const profRole = (userProfile.current_role || '').trim().toLowerCase();
    if (profRole) {
      const match = jobRoles.find(r => (r.title || '').trim().toLowerCase() === profRole);
      if (match) {
        setJobRoleId(String(match.id));
        return;
      }
    }
    if (!responsibilityId) {
      responsibilityApi.getAll().then(({ data }) => {
        const list = data?.data || [];
        if (list.length > 0) setResponsibilityId(String(list[0].id));
      }).catch(() => {});
    }
  }, [userProfile, jobRoles]);

  const containerVariants = {
    init: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 36 } },
  };

  const prefersReduced = typeof window !== 'undefined' && (document.documentElement.classList.contains('reduce-motion') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));

  // Quick create when selecting a suggestion
  const handleQuickCreate = async (suggestion) => {
    try {
      setCreating(true);
      setError('');
      const payload = {
        title: suggestion.title || 'New Goal',
        description: suggestion.description || suggestion.personalized_description || '',
        priority: suggestion.priority || (suggestion.priority_score > 0.7 ? 'high' : suggestion.priority_score > 0.4 ? 'medium' : 'low'),
        tags: suggestion.tags || [],
      };
      if (suggestion.estimated_days) {
        const d = new Date();
        d.setDate(d.getDate() + Number(suggestion.estimated_days));
        payload.due_date = d.toISOString();
      }
      await goalApi.create(payload);
      window.location.hash = '#/';
    } catch (e) {
      setError('Failed to create goal');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex items-end">
      <motion.div
        className="w-full rounded-t-3xl ring-1 ring-black/5 shadow-2xl bg-white/85 dark:bg-zinc-900/70 backdrop-blur"
        initial={prefersReduced ? undefined : 'init'}
        animate={prefersReduced ? undefined : 'show'}
        variants={containerVariants}
      >
        <div className="w-full max-w-2xl mx-auto p-6 ml-20">
          <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-zinc-300/70 dark:bg-zinc-700" aria-hidden="true" />
          <div className="flex items-center justify-between mb-2">
            <PageTitle className="text-xl font-semibold">New Goal</PageTitle>
            <button type="button" onClick={() => { window.location.hash = '#/'; }} className="btn-secondary btn-wire-sm">Close</button>
          </div>
          {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

          {/* Simple: show suggestions only */}
          <div className="rounded-2xl ring-1 ring-black/5 bg-white/90 dark:bg-zinc-900/80 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700 dark:text-zinc-200">Suggestions based on your profile</div>
              <a href="#/account" className="text-xs text-accent-600 hover:text-accent-700">Edit profile</a>
            </div>
            {userProfile && responsibilityId && (
              <AIGoalSuggestions responsibilityId={responsibilityId} userProfile={userProfile} limit={6} onGoalSelect={handleQuickCreate} />
            )}
            {creating && <div className="text-xs text-gray-500 mt-2">Creating goal…</div>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}


