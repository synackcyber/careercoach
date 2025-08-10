import React, { useEffect, useRef, useState } from 'react';
import { CalendarIcon, BriefcaseIcon, CheckCircleIcon, ClockIcon, PauseCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

const GoalCard = ({ goal, onEdit, onDelete, onClick, delayMs = 0 }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'paused':
        return <PauseCircleIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-accent-600" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-badge status-completed';
      case 'paused':
        return 'status-badge status-paused';
      default:
        return 'status-badge status-active';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'status-badge priority-high';
      case 'medium':
        return 'status-badge priority-medium';
      default:
        return 'status-badge priority-low';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getLatestProgress = () => {
    if (!goal.progress || goal.progress.length === 0) return 0;
    return Math.max(...goal.progress.map(p => p.percentage));
  };

  const daysUntil = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const due = new Date(dateString);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'due today';
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays < 30) return `in ${diffDays}d`;
    const months = Math.ceil(diffDays / 30);
    return `in ${months}mo`;
  };

  return (
    <div className="card h-full flex flex-col cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 animate-in-up" style={{ animationDelay: `${delayMs}ms` }} onClick={() => onClick(goal)}>
      <div className="flex-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(goal.status)}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 line-clamp-2">{goal.title}</h3>
        </div>
      </div>

      {goal.description && (
        <p className="text-gray-600 dark:text-zinc-300 mb-4 line-clamp-2">{goal.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-zinc-400 mb-4">
        {goal.job_role && (
          <div className="flex items-center space-x-1">
            <BriefcaseIcon className="w-4 h-4" />
            <span>{goal.job_role.title}</span>
          </div>
        )}
        {goal.due_date && (
          <div className="flex items-center space-x-1">
            <CalendarIcon className="w-4 h-4" />
            <span>{formatDate(goal.due_date)}</span>
          </div>
        )}
      </div>

      {/* Progress Ring */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-zinc-300 mb-2">
          <span>Progress</span>
          <span>{getLatestProgress()}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="relative h-8 w-8 rounded-full"
               style={{ background: `conic-gradient(#b1814e ${getLatestProgress()*3.6}deg, #e6e4df 0)` }}>
            <div className="absolute inset-1 rounded-full bg-white dark:bg-zinc-900" />
          </div>
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            {goal.due_date ? daysUntil(goal.due_date) : ''}
          </div>
        </div>
      </div>

      {/* Close flex-1 content wrapper */}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className={getStatusBadgeClass(goal.status)}>
            {goal.status}
          </span>
          <span className={getPriorityBadgeClass(goal.priority)}>
            {goal.priority}
          </span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
            title="More actions"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute top-1/2 -translate-y-1/2 right-full mr-2 w-36 rounded-lg bg-white dark:bg-zinc-900 shadow-card ring-1 ring-black/5 py-1 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                role="menuitem"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800"
                onClick={() => { setMenuOpen(false); onEdit(goal); }}
              >
                Edit
              </button>
              {onDelete && (
                <button
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    setMenuOpen(false);
                    if (window.confirm('Delete this goal? This cannot be undone.')) {
                      onDelete(goal.id);
                    }
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalCard;