import React, { useMemo, useState } from 'react';
import { goalApi, jobRoleApi } from '../services/api';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    let mounted = true;
    jobRoleApi.getAll().then(({ data }) => {
      if (!mounted) return;
      setJobRoles(data?.data || []);
    }).catch(() => {});
    return () => { mounted = false; };
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">New Goal</h1>
      {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
      <form onSubmit={onSave} className="space-y-5">
        <div>
          <label className="block text-sm mb-1">Title <span className="text-red-500">*</span></label>
          <input className="input-field w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Earn AWS Solutions Architect" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="input-field w-full" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is the outcome and why does it matter?" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Priority</label>
            <select className="input-field w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Due date</label>
            <input type="date" className="input-field w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div>
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
        </div>
        <div>
          <label className="block text-sm mb-1">Job role (optional)</label>
          <select className="input-field w-full" value={jobRoleId} onChange={(e) => setJobRoleId(e.target.value)}>
            <option value="">None</option>
            {jobRoles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={() => { window.location.hash = '#/'; }}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!canSave}>{submitting ? 'Saving…' : 'Save goal'}</button>
        </div>
      </form>
    </div>
  );
}


