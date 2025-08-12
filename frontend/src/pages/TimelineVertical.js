import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionTitle from '../components/SectionTitle';
import PageTitle from '../components/PageTitle';
import { useGoals } from '../hooks/useGoals';
import ProgressModal from '../components/ProgressModal';

function byDateAsc(a, b) {
  const da = new Date(a.date);
  const db = new Date(b.date);
  return da - db;
}

function formatMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function TimelineVertical() {
  const { goals, loading, error } = useGoals({});
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const timelineRef = useRef(null);

  const filteredEntries = useMemo(() => {
    const base = goals.filter(g => statusFilter === 'all' ? true : g.status === statusFilter);
    const list = base.map(g => ({
      id: g.id,
      goal: g,
      date: g.due_date || g.created_at || new Date().toISOString(),
    })).sort(byDateAsc);
    const groups = {};
    list.forEach(item => {
      const mk = formatMonthKey(item.date);
      if (!groups[mk]) groups[mk] = [];
      groups[mk].push(item);
    });
    return groups;
  }, [goals, statusFilter]);

  const monthsAll = useMemo(() => Object.keys(filteredEntries).sort((a, b) => new Date(a + '-01') - new Date(b + '-01')), [filteredEntries]);
  const years = useMemo(() => {
    const set = new Set(monthsAll.map(mk => Number(mk.split('-')[0])));
    return Array.from(set).sort((a, b) => a - b);
  }, [monthsAll]);
  const months = useMemo(() => monthsAll.filter(mk => yearFilter === 'all' ? true : mk.startsWith(yearFilter + '-')), [monthsAll, yearFilter]);

  const openGoal = (g) => { setSelectedGoal(g); setShowProgressModal(true); };

  // Auto-select current month if present, otherwise most recent month (rightmost)
  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      const currentDate = new Date();
      const currentMonth = formatMonthKey(currentDate);
      if (months.includes(currentMonth)) {
        setSelectedMonth(currentMonth);
      } else {
        setSelectedMonth(months[months.length - 1]);
      }
    }
  }, [months, selectedMonth]);

  if (error) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg">
      <div className="relative min-h-screen overflow-hidden">
        {/* Elegant Integrated Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="sticky top-0 z-20 px-6 pt-8 pb-6 bg-[#f5f5f0]/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-gray-200/20 dark:border-zinc-700/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <PageTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-300 bg-clip-text text-transparent">
                Timeline
              </PageTitle>
            </div>
            
            {/* Compact Filters */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white/60 dark:bg-zinc-800/60 border border-gray-200/50 dark:border-zinc-700/50 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-gray-700 dark:text-zinc-300 focus:ring-1 focus:ring-accent-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Done</option>
                <option value="paused">Paused</option>
              </select>
              
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="appearance-none bg-white/60 dark:bg-zinc-800/60 border border-gray-200/50 dark:border-zinc-700/50 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-gray-700 dark:text-zinc-300 focus:ring-1 focus:ring-accent-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              >
                <option value="all">All Time</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </motion.div>
          </div>
        </motion.div>

        <div className="relative w-full px-6 py-6">
          <div className="relative">
            {/* Horizontal Timeline Bar */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl">
                  {/* Year Display - Centered Above */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-zinc-300">
                      {yearFilter === 'all' ? 'All Time' : yearFilter}
                    </h3>
                  </div>
                  
                  {/* Timeline Bar */}
                  <div className="h-1.5 md:h-2 bg-gradient-to-r from-accent-200 via-accent-400 to-orange-300 dark:from-accent-700 dark:via-accent-600 dark:to-orange-700 rounded-full shadow-inner" />
                  
                  {/* Month Markers */}
                  <div className="relative -mt-0.5 md:-mt-1">
                    {months.map((mk, monthIdx) => {
                      const position = (monthIdx / (months.length - 1)) * 100;
                      const isSelected = selectedMonth === mk;
                      const monthName = new Date(mk + '-01').toLocaleDateString(undefined, { month: 'short' });
                      
                      return (
                        <motion.button
                          key={mk}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: monthIdx * 0.1 }}
                          onClick={() => setSelectedMonth(mk)}
                          className={`absolute top-0 w-3 h-3 md:w-4 md:h-4 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
                            isSelected 
                              ? 'bg-accent-600 dark:bg-accent-400 scale-125 shadow-lg ring-2 md:ring-4 ring-accent-200 dark:ring-accent-800' 
                              : 'bg-white dark:bg-zinc-300 hover:bg-accent-400 dark:hover:bg-accent-500 hover:scale-110 shadow-md'
                          }`}
                          style={{ left: `${position}%` }}
                        >
                          {/* Month Label - Below the marker */}
                          <div className={`absolute top-5 md:top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] md:text-xs font-medium transition-all duration-200 ${
                            isSelected 
                              ? 'text-accent-700 dark:text-accent-300 scale-110 font-semibold' 
                              : 'text-gray-500 dark:text-zinc-400'
                          }`}>
                            {monthName}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Month Content */}
            {selectedMonth && (
              <motion.div
                key={selectedMonth}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-4xl mx-auto"
              >
                {/* Month Header */}
                <div className="text-center mb-6 md:mb-8">
                  <SectionTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                    {monthLabel(selectedMonth)}
                  </SectionTitle>
                  <div className="w-12 md:w-16 h-1 bg-gradient-to-r from-accent-500 to-orange-500 rounded-full mx-auto" />
                  <p className="text-sm md:text-base text-gray-600 dark:text-zinc-400 mt-3">
                    {filteredEntries[selectedMonth]?.length || 0} goals
                  </p>
                </div>

                {/* Goals Grid */}
                {filteredEntries[selectedMonth]?.length > 0 ? (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredEntries[selectedMonth].map(({ id, goal, date }) => (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="group"
                      >
                        <button
                          onClick={() => openGoal(goal)}
                          className="w-full text-left p-6 rounded-2xl bg-white/85 dark:bg-zinc-900/70 backdrop-blur ring-1 ring-black/5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group-hover:scale-105"
                        >
                          {/* Goal Header */}
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 line-clamp-2 flex-1 mr-2">
                              {goal.title}
                            </h3>
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
                          
                          {/* Goal Description */}
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

                          {/* Date */}
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-zinc-400 mb-4">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{new Date(date).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-zinc-300 mb-2">
                              <span>Progress</span>
                              <div className="text-xs text-gray-500 dark:text-zinc-400">
                                {goal.due_date ? (() => {
                                  const now = new Date();
                                  const due = new Date(goal.due_date);
                                  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                                  if (diffDays === 0) return 'due today';
                                  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
                                  if (diffDays < 30) return `in ${diffDays}d`;
                                  const months = Math.ceil(diffDays / 30);
                                  return `in ${months}mo`;
                                })() : ''}
                              </div>
                            </div>
                            <div className="relative">
                              {/* Background track */}
                              <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                {/* Animated progress fill */}
                                <div 
                                  className="h-full rounded-full transition-all duration-1000 ease-out group-hover:shadow-sm"
                                  style={{
                                    width: `${goal.progress && goal.progress.length > 0 ? Math.max(...goal.progress.map(p => p.percentage)) : 0}%`,
                                    background: `linear-gradient(90deg, 
                                      ${(goal.progress && goal.progress.length > 0 ? Math.max(...goal.progress.map(p => p.percentage)) : 0) >= 80 ? '#10b981' : 
                                        (goal.progress && goal.progress.length > 0 ? Math.max(...goal.progress.map(p => p.percentage)) : 0) >= 50 ? '#f59e0b' : '#ef4444'} 0%, 
                                      ${(goal.progress && goal.progress.length > 0 ? Math.max(...goal.progress.map(p => p.percentage)) : 0) >= 80 ? '#059669' : 
                                        (goal.progress && goal.progress.length > 0 ? Math.max(...goal.progress.map(p => p.percentage)) : 0) >= 50 ? '#d97706' : '#dc2626'} 100%)`
                                  }}
                                />
                              </div>
                              {/* Progress percentage (subtle) */}
                              <div className="absolute -top-6 right-0 text-xs text-gray-500 dark:text-zinc-400">
                                {goal.progress && goal.progress.length > 0 ? Math.max(...goal.progress.map(p => p.percentage)) : 0}%
                              </div>
                            </div>
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
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                                 ) : (
                   <div className="text-center py-8 md:py-12">
                     <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                       <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                       </svg>
                     </div>
                     <p className="text-gray-500 dark:text-zinc-400 text-base md:text-lg font-medium">No goals for this month</p>
                     <p className="text-gray-400 dark:text-zinc-500 text-xs md:text-sm mt-1">Create your first goal to get started</p>
                   </div>
                 )}
              </motion.div>
            )}
          </div>

          {/* Enhanced Modal */}
          <ProgressModal
            goal={selectedGoal}
            isOpen={showProgressModal}
            onClose={() => { setShowProgressModal(false); setSelectedGoal(null); }}
          />
        </div>
      </div>
    </div>
  );
}


