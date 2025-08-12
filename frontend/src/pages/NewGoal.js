import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageTitle from '../components/PageTitle';
import { goalApi, jobRoleApi, responsibilityApi, userProfileApi } from '../services/api';
import AIGoalSuggestions from '../components/AIGoalSuggestions';

const priorities = ['low','medium','high'];

export default function NewGoal() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(''); // yyyy-mm-dd
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [jobRoleId, setJobRoleId] = useState('');
  const [responsibilities, setResponsibilities] = useState([]);
  const [responsibilityId, setResponsibilityId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    jobRoleApi.getAll().then(({ data }) => {
      if (!mounted) return;
      setJobRoles(data?.data || []);
    }).catch(() => {});
    return () => { mounted = false; };
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
        setResponsibilities(data?.data || []);
        setResponsibilityId('');
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [jobRoleId]);

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

  const addTag = () => {
    const t = tagsInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagsInput('');
  };
  const removeTag = (t) => setTags(tags.filter(x => x !== t));

  const canSave = useMemo(() => title.trim().length > 0 && !submitting, [title, submitting]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : '',
        tags,
      };
      if (jobRoleId) payload.job_role_id = Number(jobRoleId);
      await goalApi.create(payload);
      window.location.hash = '#/';
    } catch (e) {
      setError('Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = {
    init: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 36 } },
  };

  const item = {
    init: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  };

  const prefersReduced = typeof window !== 'undefined' && (document.documentElement.classList.contains('reduce-motion') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));

  // When a suggestion is selected, prefill the form fields
  const handleGoalSelect = (suggestion) => {
    setTitle(suggestion.title || '');
    setDescription(suggestion.description || suggestion.personalized_description || '');
    if (suggestion.priority) setPriority(suggestion.priority);
    if (suggestion.estimated_days) {
      const d = new Date();
      d.setDate(d.getDate() + Number(suggestion.estimated_days));
      setDueDate(d.toISOString().slice(0,10));
    }
    // Merge tags if provided
    if (Array.isArray(suggestion.tags) && suggestion.tags.length) {
      const merged = Array.from(new Set([...(tags || []), ...suggestion.tags]));
      setTags(merged);
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
            <button type="button" onClick={() => { window.location.hash = '#/'; }} className="btn-secondary btn-wire-sm">Cancel</button>
          </div>
          {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

          {/* AI Generate Panel */}
          <div className="mb-6 rounded-2xl ring-1 ring-black/5 bg-white/90 dark:bg-zinc-900/80 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700 dark:text-zinc-200">Personalized suggestions based on your profile</div>
              <a href="#/account" className="text-xs text-accent-600 hover:text-accent-700">Update profile</a>
            </div>
            {/* If user has a profile with industry/role, show direct suggestions limited to 6 */}
            {userProfile && (
              <div className="mt-2">
                {/* If a responsibility is chosen, we pass both; otherwise backend will rely on profile context */}
                <AIGoalSuggestions responsibilityId={responsibilityId || 1} userProfile={userProfile} limit={6} onGoalSelect={handleGoalSelect} />
              </div>
            )}

            {/* Optional: advanced targeting via role/responsibility */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 dark:text-zinc-200 mb-1">Job role (optional)</div>
              <select className="input-field w-full" value={jobRoleId} onChange={(e) => setJobRoleId(e.target.value)}>
                <option value="">None</option>
                {jobRoles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
              {jobRoleId && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-200 mb-1">Responsibility</div>
                  <select className="input-field w-full" value={responsibilityId} onChange={(e) => setResponsibilityId(e.target.value)}>
                    <option value="">Select responsibility</option>
                    {responsibilities.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <motion.form onSubmit={onSave} className="space-y-5" initial={false}>
            <motion.div variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <label className="block text-sm mb-1">Title <span className="text-red-500">*</span></label>
              <input className="input-field w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Earn AWS Solutions Architect" required />
            </motion.div>

            <motion.div variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <label className="block text-sm mb-1">Description</label>
              <textarea className="input-field w-full" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is the outcome and why does it matter?" />
            </motion.div>

            <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <div>
                <label className="block text-sm mb-1">Priority</label>
                <div className="flex gap-2">
                  {priorities.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`btn-wire btn-wire-sm ${priority === p ? 'ring-2 ring-accent-500' : ''}`}
                      aria-pressed={priority === p}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Due date</label>
                <input type="date" className="input-field w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </motion.div>

            <motion.div variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <label className="block text-sm mb-1">Tags</label>
              <div className="flex gap-2">
                <input className="input-field flex-1" placeholder="Press Enter to add" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                <button type="button" className="btn-secondary" onClick={addTag}>Add</button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-zinc-100 border border-zinc-200">
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className="ml-1 text-zinc-500 hover:text-zinc-800">×</button>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <label className="block text-sm mb-1">Job role (optional)</label>
              <select className="input-field w-full" value={jobRoleId} onChange={(e) => setJobRoleId(e.target.value)}>
                <option value="">None</option>
                {jobRoles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </motion.div>

            <motion.div className="flex gap-3 pt-2" variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <button type="button" className="btn-secondary" onClick={() => { window.location.hash = '#/'; }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={!canSave}>{submitting ? 'Saving…' : 'Save goal'}</button>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}


