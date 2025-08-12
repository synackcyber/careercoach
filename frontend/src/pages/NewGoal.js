import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageTitle from '../components/PageTitle';
import { aiApi } from '../services/api';
import { goalApi } from '../services/api';

const priorities = ['low','medium','high'];

export default function NewGoal() {
  // Custom goal form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState([]);
  // Optional OKR/SMART assistant state (lightweight, non-rigid)
  const [okrOpen, setOkrOpen] = useState(false);
  const [okr, setOkr] = useState({
    objective: '',
    timeframe: { start: '', end: '', quarter: '' },
    owners: [],
    smart: { specific: '', achievable: '', relevant: '', time_bound: { review_cadence: '' }, measurable_kr_ids: [] },
    metadata_schema: 'v1'
  });
  const [milestones, setMilestones] = useState([]);
  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success', ms = 2400) => {
    setToast({ visible: true, message, type });
    window.clearTimeout(showToast._t);
    // @ts-ignore
    showToast._t = window.setTimeout(() => setToast((t) => ({ ...t, visible: false })), ms);
  };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Suggestions removed: no profile/responsibility context needed

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
      // Build optional metadata if any OKR/SMART details are provided
      const hasOKR = (okr.objective && okr.objective.trim() !== '') || (okr.smart && (okr.smart.specific || okr.smart.achievable || okr.smart.relevant));

      const metadata = hasOKR ? {
        metadata_schema: okr.metadata_schema || 'v1',
        objective: okr.objective || title.trim() || undefined,
        timeframe: {
          start: okr.timeframe?.start || undefined,
          end: (dueDate ? new Date(dueDate).toISOString().slice(0,10) : (okr.timeframe?.end || undefined)),
          quarter: okr.timeframe?.quarter || undefined,
        },
        owners: Array.isArray(okr.owners) && okr.owners.length ? okr.owners : undefined,
        // key_results omitted for frictionless v1
        smart: okr.smart ? {
          specific: okr.smart.specific || undefined,
          achievable: okr.smart.achievable || undefined,
          relevant: okr.smart.relevant || undefined,
          time_bound: {
            due_date: (dueDate ? new Date(dueDate).toISOString().slice(0,10) : undefined),
            review_cadence: okr.smart.time_bound?.review_cadence || undefined,
          },
          measurable_kr_ids: Array.isArray(okr.smart.measurable_kr_ids) && okr.smart.measurable_kr_ids.length ? okr.smart.measurable_kr_ids : undefined,
        } : undefined,
        milestones: milestones && milestones.length ? milestones : undefined,
      } : undefined;

      const autoTags = (() => {
        if (!metadata) return tags;
        const base = new Set(tags || []);
        base.add('okr'); base.add('smart');
        return Array.from(base);
      })();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : '',
        tags: autoTags,
        metadata,
      };
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
  const hasSMART = !!(okr.smart?.specific || okr.smart?.achievable || okr.smart?.relevant || okr.smart?.time_bound?.review_cadence);
  const hasMilestones = Array.isArray(milestones) && milestones.length > 0;
  const smartPreview = () => {
    const lines = [];
    if (okr.smart?.specific) lines.push(`Specific: ${okr.smart.specific}`);
    if (okr.smart?.achievable) lines.push(`Achievable: ${okr.smart.achievable}`);
    if (okr.smart?.relevant) lines.push(`Relevant: ${okr.smart.relevant}`);
    const due = dueDate || okr.smart?.time_bound?.due_date;
    const cadence = okr.smart?.time_bound?.review_cadence;
    if (due || cadence) {
      const tb = [];
      if (due) tb.push(`Due ${new Date(due).toISOString().slice(0,10)}`);
      if (cadence) tb.push(`Review ${cadence}`);
      lines.push(`Time-bound: ${tb.join(' · ')}`);
    }
    return lines;
  };

  // Suggestions removed

  // KR editor removed for frictionless v1

  // Lightweight local "AI" assist (heuristics) to draft OKR/SMART from title/description
  const aiDraftOKR = () => {
    const text = `${title}\n${description}`.toLowerCase();
    const objectiveDraft = title || okr.objective || '';
    const inferDirection = () => (/time|latency|error|bug|incident|cost|downtime|churn/.test(text) ? 'down' : 'up');
    const inferTypeUnit = () => {
      if (/time|latency|cycle|duration/.test(text)) return { metric_type: 'time', unit: 'ms' };
      if (/%|percent|rate|ratio/.test(text)) return { metric_type: '%', unit: '%' };
      if (/bug|incident|ticket|deploy|signup|lead|user/.test(text)) return { metric_type: 'count', unit: '' };
      return { metric_type: 'score', unit: '' };
    };
    const dir = inferDirection();
    const { metric_type, unit } = inferTypeUnit();
    const krName = objectiveDraft ? objectiveDraft.replace(/^(increase|reduce|improve)\s+/i, '').slice(0, 60) : 'Key Result';

    const draftedKR = { id: 'kr1', name: krName || 'Key Result', metric_type, unit, direction: dir, baseline: '', target: '', update_cadence: 'weekly' };
    const measurableSet = new Set(okr.smart.measurable_kr_ids || ['kr1']);
    measurableSet.add('kr1');

    const quarterFromDue = () => {
      if (!dueDate) return okr.timeframe.quarter || '';
      const d = new Date(dueDate);
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `Q${q}`;
    };

    setOkr((prev) => ({
      ...prev,
      objective: prev.objective || objectiveDraft,
      timeframe: {
        start: prev.timeframe.start || '',
        end: prev.timeframe.end || (dueDate || ''),
        quarter: prev.timeframe.quarter || quarterFromDue(),
      },
      key_results: prev.key_results && prev.key_results.length ? prev.key_results : [draftedKR],
      smart: {
        ...prev.smart,
        specific: prev.smart.specific || (title ? `Deliver: ${title}` : ''),
        achievable: prev.smart.achievable || 'Scoped to available resources and timeline',
        relevant: prev.smart.relevant || 'Supports current priorities',
        time_bound: { review_cadence: prev.smart.time_bound?.review_cadence || 'weekly' },
        measurable_kr_ids: Array.from(measurableSet),
      },
    }));
  };

  // SMART helpers removed

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Page Header */}
      <div className="w-full max-w-4xl mx-auto px-6 pt-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative inline-flex items-center justify-center w-24 h-24 mb-6"
          >
            <div className="w-24 h-24 bg-accent-100 dark:bg-accent-900/30 rounded-3xl flex items-center justify-center shadow-sm ring-1 ring-accent-200/50 dark:ring-accent-700/30">
              <div className="w-16 h-16 bg-accent-50 dark:bg-accent-800/20 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
          </motion.div>
          <PageTitle className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
            Discover Goals
          </PageTitle>
        </div>
      </div>

      <motion.div
        className="w-full max-w-4xl mx-auto px-6 py-8 relative z-10"
        initial={prefersReduced ? undefined : 'init'}
        animate={prefersReduced ? undefined : 'show'}
        variants={containerVariants}
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-amber-200/50 dark:ring-amber-700/30 overflow-hidden relative p-6">
          {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

          {/* Optional OKR/SMART assistant */}
          {okrOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl border-2 border-gray-200 dark:border-zinc-800 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Objective</label>
                  <input className="input-field w-full" value={okr.objective} onChange={(e)=>setOkr({ ...okr, objective: e.target.value })} placeholder="Outcome you want to achieve" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Quarter</label>
                  <input className="input-field w-full" value={okr.timeframe.quarter} onChange={(e)=>setOkr({ ...okr, timeframe: { ...okr.timeframe, quarter: e.target.value } })} placeholder="e.g., Q4" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Start</label>
                  <input type="date" className="input-field w-full" value={okr.timeframe.start} onChange={(e)=>setOkr({ ...okr, timeframe: { ...okr.timeframe, start: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">End</label>
                  <input type="date" className="input-field w-full" value={okr.timeframe.end} onChange={(e)=>setOkr({ ...okr, timeframe: { ...okr.timeframe, end: e.target.value } })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Owners (comma-separated emails or names)</label>
                  <input className="input-field w-full" value={(okr.owners || []).join(', ')} onChange={(e)=>setOkr({ ...okr, owners: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} />
                </div>
              </div>

              {/* Key Results omitted for frictionless v1 */}

              {/* SMART minimal */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Specific</label>
                  <input className="input-field w-full" value={okr.smart.specific} onChange={(e)=>setOkr({ ...okr, smart: { ...okr.smart, specific: e.target.value } })} placeholder="Concrete outcome" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Achievable</label>
                  <input className="input-field w-full" value={okr.smart.achievable} onChange={(e)=>setOkr({ ...okr, smart: { ...okr.smart, achievable: e.target.value } })} placeholder="Assumptions/resources" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Relevant</label>
                  <input className="input-field w-full" value={okr.smart.relevant} onChange={(e)=>setOkr({ ...okr, smart: { ...okr.smart, relevant: e.target.value } })} placeholder="Why now" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Review cadence</label>
                  <input className="input-field w-full" value={okr.smart.time_bound.review_cadence} onChange={(e)=>setOkr({ ...okr, smart: { ...okr.smart, time_bound: { ...okr.smart.time_bound, review_cadence: e.target.value } } })} placeholder="weekly, biweekly" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Custom goal form */}
          <motion.form onSubmit={onSave} className="space-y-5" initial={false}>
            <motion.div variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <label className="block text-sm mb-1">Title <span className="text-red-500">*</span></label>
              <input className="input-field w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Launch team onboarding playbook" required />
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

            {/* SMART fields (optional) as part of the regular form */}
            <motion.div variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">SMART (optional)</label>
                <button type="button" data-refine-smart className="btn-primary btn-wire-sm" onClick={async ()=>{
                  try {
                    const draft = { ...okr };
                    const { data } = await aiApi.refineSMART({ title, description, due_date: dueDate, draft: draft.smart || draft });
                    const refined = data?.data;
                    if (refined) { setOkr({ ...okr, smart: refined }); showToast('SMART refined'); }
                  } catch (_) { showToast('AI refine failed', 'error'); }
                }}>Refine SMART</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1">Specific</label>
                  <input className="input-field w-full" value={okr.smart.specific} onChange={(e)=>setOkr({ ...okr, smart: { ...okr.smart, specific: e.target.value } })} placeholder="What exactly will you deliver?" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Achievable</label>
                  <input className="input-field w-full" value={okr.smart.achievable} onChange={(e)=>setOkr({ ...okr, smart: { ...okr.smart, achievable: e.target.value } })} placeholder="Assumptions/resources" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Relevant</label>
                  <input className="input-field w-full" value={okr.smart.relevant} onChange={(e)=>setOkr({ ...okr, smart: { ...okr.smart, relevant: e.target.value } })} placeholder="Why this matters now" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Review cadence</label>
                  <input className="input-field w-full" value={okr.smart.time_bound.review_cadence} onChange={(e)=>setOkr({ ...okr, smart: { ...okr.smart, time_bound: { ...okr.smart.time_bound, review_cadence: e.target.value } } })} placeholder="weekly, biweekly" />
                </div>
              </div>
            </motion.div>

            {/* SMART section removed */}

            {/* Milestones */}
            <motion.div variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Milestones (optional)</label>
                <button type="button" className="btn-secondary btn-wire-sm" onClick={async ()=>{
                  try {
                    const { data } = await aiApi.milestones({ title, description, due_date: dueDate, count: 4 });
                    const list = data?.data || [];
                    if (Array.isArray(list)) setMilestones(list);
                    showToast('Milestones suggested');
                  } catch (_) { showToast('Milestones failed', 'error'); }
                }}>Suggest</button>
              </div>
              {(milestones || []).map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
                  <input className="input-field md:col-span-4" placeholder={`Milestone ${idx+1}`} value={m.label || ''} onChange={(e)=>{
                    const arr=[...milestones]; arr[idx] = { ...arr[idx], label: e.target.value }; setMilestones(arr);
                  }} />
                  <input type="date" className="input-field md:col-span-2" value={m.due_date || ''} onChange={(e)=>{
                    const arr=[...milestones]; arr[idx] = { ...arr[idx], due_date: e.target.value }; setMilestones(arr);
                  }} />
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button type="button" className="btn-wire btn-wire-sm" onClick={()=>setMilestones([...(milestones||[]), { label: '', due_date: '' }])}>Add Milestone</button>
                {milestones.length>0 && (
                  <button type="button" className="btn-wire btn-wire-sm" onClick={()=>setMilestones(milestones.slice(0,-1))}>Remove Last</button>
                )}
              </div>
            </motion.div>

            {/* Preview */}
            {(hasSMART || hasMilestones) && (
              <motion.div variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'} className="rounded-2xl border-2 border-gray-200 dark:border-zinc-800 p-4 bg-white/70 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Preview</label>
                </div>
                {hasSMART && (
                  <div className="mb-3">
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-1">SMART</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 dark:text-zinc-200">
                      {smartPreview().map((l, i) => (<li key={i}>{l}</li>))}
                    </ul>
                  </div>
                )}
                {hasMilestones && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-1">Milestones</div>
                    <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-800 dark:text-zinc-200">
                      {milestones.map((m, i) => (
                        <li key={i}>{m.label || `Milestone ${i+1}`}{m.due_date ? ` — ${m.due_date}` : ''}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </motion.div>
            )}

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

            <motion.div className="flex gap-3 pt-2" variants={item} initial={prefersReduced ? undefined : 'init'} animate={prefersReduced ? undefined : 'show'}>
              <button type="button" className="btn-secondary" onClick={() => { window.location.hash = '#/'; }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={!canSave}>{submitting ? 'Saving…' : 'Save goal'}</button>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg border text-sm z-50 ${toast.type==='error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}


