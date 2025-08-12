import React, { useState } from 'react';
import { CalendarIcon, EllipsisVerticalIcon, SparklesIcon, FlagIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const GoalCard = ({ goal, onEdit, onDelete, onClick, delayMs = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

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

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-emerald-400 to-emerald-600';
    if (progress >= 50) return 'from-amber-400 to-amber-600';
    return 'from-rose-400 to-rose-600';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-r from-rose-400 to-rose-600';
      case 'medium': return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default: return 'bg-gradient-to-r from-slate-400 to-slate-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-blue-400 to-blue-600';
      case 'paused': return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default: return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
    }
  };

  return (
    <motion.div
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: delayMs / 1000,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick(goal)}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 blur-xl"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Main card */}
      <motion.div
        className="relative h-full bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-2xl p-6 shadow-lg"
        animate={{
          y: isHovered ? -8 : 0,
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)" 
            : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)"
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header with enhanced status indicator */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <motion.div
                className={`w-4 h-4 rounded-full ${getStatusColor(goal.status)} shadow-lg`}
                animate={{ 
                  scale: goal.status === 'active' ? [1, 1.1, 1] : 1,
                  boxShadow: goal.status === 'active' 
                    ? "0 0 20px rgba(34, 197, 94, 0.4)" 
                    : "0 4px 12px rgba(0, 0, 0, 0.15)"
                }}
                transition={{ 
                  duration: 2, 
                  repeat: goal.status === 'active' ? Infinity : 0,
                  ease: "easeInOut"
                }}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 leading-tight line-clamp-2">
              {goal.title}
            </h3>
          </div>
          
          {/* Priority badge */}
          <motion.div
            className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getPriorityColor(goal.priority)} shadow-md`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + (delayMs / 1000), duration: 0.3 }}
          >
            {goal.priority || 'normal'}
          </motion.div>
        </div>

        {/* Description with enhanced typography */}
        {goal.description && (
          <motion.div 
            className="mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + (delayMs / 1000), duration: 0.4 }}
          >
            <p className={`text-gray-600 dark:text-zinc-300 leading-relaxed transition-all duration-300 ${
              goal.description.length > 100 ? 'line-clamp-2 group-hover:line-clamp-none' : ''
            }`}>
              {goal.description}
            </p>
            {goal.description.length > 100 && (
              <motion.div 
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 flex items-center space-x-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                transition={{ duration: 0.2 }}
              >
                <SparklesIcon className="w-3 h-3" />
                <span>Hover to see more</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Due date with enhanced icon */}
        {goal.due_date && (
          <motion.div 
            className="flex items-center space-x-2 text-sm text-gray-500 dark:text-zinc-400 mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + (delayMs / 1000), duration: 0.4 }}
          >
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium">{formatDate(goal.due_date)}</span>
            <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
              {daysUntil(goal.due_date)}
            </span>
          </motion.div>
        )}

        {/* Enhanced Progress Bar */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + (delayMs / 1000), duration: 0.4 }}
        >
          <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-zinc-200 mb-3">
            <div className="flex items-center space-x-2">
                              <FlagIcon className="w-4 h-4 text-gray-500" />
              <span>Progress</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">
              {getLatestProgress()}%
            </span>
          </div>
          
          <div className="relative">
            {/* Background track */}
            <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              {/* Animated progress fill */}
              <motion.div 
                className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(getLatestProgress())} shadow-lg`}
                initial={{ width: 0 }}
                animate={{ width: `${getLatestProgress()}%` }}
                transition={{ 
                  duration: 1.5, 
                  delay: 0.8 + (delayMs / 1000),
                  ease: "easeOut"
                }}
              />
            </div>
            
            {/* Progress glow effect */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${getProgressColor(getLatestProgress())} opacity-20 blur-sm`}
              animate={{ 
                opacity: isHovered ? 0.4 : 0.2,
                scale: isHovered ? 1.05 : 1
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Bottom action bar with enhanced styling */}
        <motion.div 
          className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + (delayMs / 1000), duration: 0.4 }}
        >
          <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-zinc-400">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(goal.status)}`} />
              <span className="capitalize">{goal.status}</span>
            </div>
          </div>
          
          {/* Action button */}
          <motion.button
            onClick={(e) => { 
              e.stopPropagation(); 
              onEdit(goal); 
            }}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Edit goal"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300" />
          </motion.button>
        </motion.div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 rounded-2xl opacity-5 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GoalCard;