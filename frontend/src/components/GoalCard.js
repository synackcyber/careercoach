import React from 'react';
import { CalendarIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

const GoalCard = ({ goal, onEdit, onDelete, onClick, delayMs = 0 }) => {


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
    <div className="card h-full flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-in-up group" style={{ animationDelay: `${delayMs}ms` }} onClick={() => onClick(goal)}>
      <div className="flex-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 line-clamp-2">{goal.title}</h3>
        </div>
        {/* Animated Status Dot */}
        <div className="flex-shrink-0">
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
            goal.status === 'completed' ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 
            goal.status === 'paused' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' : 
            'bg-green-500 shadow-lg shadow-green-500/30'
          } ${
            goal.status === 'active' ? 'animate-pulse' : ''
          } group-hover:scale-110`} />
        </div>
      </div>

      {goal.description && (
        <div className="mb-4">
          <p className={`text-gray-600 dark:text-zinc-300 transition-all duration-300 ${
            goal.description.length > 100 ? 'line-clamp-2 group-hover:line-clamp-none' : ''
          }`}>
            {goal.description}
          </p>
          {goal.description.length > 100 && (
            <div className="mt-2 text-xs text-accent-600 dark:text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Hover to see more
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-zinc-400 mb-4">
        {goal.due_date && (
          <div className="flex items-center space-x-1">
            <CalendarIcon className="w-4 h-4" />
            <span>{formatDate(goal.due_date)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-zinc-300 mb-2">
          <span>Progress</span>
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            {goal.due_date ? daysUntil(goal.due_date) : ''}
          </div>
        </div>
        <div className="relative">
          {/* Background track */}
          <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            {/* Animated progress fill */}
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out group-hover:shadow-sm"
              style={{
                width: `${getLatestProgress()}%`,
                background: `linear-gradient(90deg, 
                  ${getLatestProgress() >= 80 ? '#10b981' : 
                    getLatestProgress() >= 50 ? '#f59e0b' : '#ef4444'} 0%, 
                  ${getLatestProgress() >= 80 ? '#059669' : 
                    getLatestProgress() >= 50 ? '#d97706' : '#dc2626'} 100%)`
              }}
            />
          </div>
          {/* Progress percentage (subtle) */}
          <div className="absolute -top-6 right-0 text-xs text-gray-500 dark:text-zinc-400">
            {getLatestProgress()}%
          </div>
        </div>
      </div>

      {/* Close flex-1 content wrapper */}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {/* Priority indicator - subtle dot */}
          <div className={`w-2 h-2 rounded-full ${
            goal.priority === 'high' ? 'bg-red-500' : 
            goal.priority === 'medium' ? 'bg-yellow-500' : 
            'bg-gray-400'
          }`} />
        </div>
        <div className="relative">
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              onEdit(goal); 
            }}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
            title="Edit goal"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;