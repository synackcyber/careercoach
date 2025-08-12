import React, { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, FlagIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

import { useGoals } from '../hooks/useGoals';

import GoalCard from '../components/GoalCard';
import SimpleGoalForm from '../components/SimpleGoalForm';
import ProgressModal from '../components/ProgressModal';
// AI Settings removed

const Dashboard = ({ session }) => {
  const [filters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  // const [showAISettings, setShowAISettings] = useState(false);

  const { goals, loading, error, initialized, createGoal, updateGoal, deleteGoal } = useGoals(filters);
  // Suggestions removed
  // Listen for global "open-new-goal" to open the form from nav components
  useEffect(() => {
    const handler = () => {
      setEditingGoal(null);
      setShowGoalForm(true);
    };
    window.addEventListener('open-new-goal', handler);
    return () => window.removeEventListener('open-new-goal', handler);
  }, []);

  // Debug dashboard state
  useEffect(() => {
    try { console.debug('[dashboard] goals length =', goals.length, 'loading =', loading, 'error =', error); } catch (_) {}
  }, [goals, loading, error]);

  // Suggestions removed


  const filteredGoals = goals
    .filter(goal => goal.status === 'active') // Only show active goals
    .filter(goal =>
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const handleCreateGoal = async (goalData) => {
    await createGoal(goalData);
  };

  const handleUpdateGoal = async (goalData) => {
    await updateGoal(editingGoal.id, goalData);
    setEditingGoal(null);
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(goalId);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleGoalClick = (goal) => {
    setSelectedGoal(goal);
    setShowProgressModal(true);
  };

  // (Filters UI removed) Keep filters state to support future server filtering via useGoals

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)
          `
        }} />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 w-full px-6 py-6">


        {/* Personalized Greeting */}
        {session?.user && (
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.div
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-3 rounded-2xl border border-white/20 dark:border-zinc-800/50"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Howdy, {session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'there'}! 👋
              </h2>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </motion.div>
            <motion.p
              className="mt-3 text-gray-600 dark:text-zinc-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              Ready to crush some goals today?
            </motion.p>
          </motion.div>
        )}

        <motion.div
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.div
            className="relative"
            initial={{ scale: 0.98 }}
            animate={{ width: (searchFocused || searchTerm) ? '100%' : '60%', scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 40 }}
            style={{ minWidth: (searchFocused || searchTerm) ? undefined : 280 }}
          >
            <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
              <MagnifyingGlassIcon className="w-5 h-5 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </motion.span>
            <input
              type="text"
              placeholder="Search your goals..."
              value={searchTerm}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-2xl shadow-lg focus:shadow-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400"
            />
            {/* Subtle glow effect on focus */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur-xl"
              animate={{ opacity: searchFocused ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.div>

        {/* Suggestions removed */}

        {/* Goals Grid. Hide empty-state until first load completes to avoid flash. */}
        {filteredGoals.length === 0 ? (
          (!initialized || loading) ? (
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Loading skeleton */}
              <div className="text-center mb-8">
                <div className="w-32 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-600 rounded-full mx-auto animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="h-64 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-2xl p-6 animate-pulse"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
                        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded flex-1"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FlagIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  {searchTerm ? 'No active goals found' : 'Ready to set your first goal?'}
                </h3>
                <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search or create a new active goal' 
                    : 'Create your first goal and start building momentum toward your dreams'
                  }
                </p>
              </div>
              {!searchTerm && (
                <motion.button 
                  className="btn-primary bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.hash = '#/suggestions'}
                >
                  Get Goal Suggestions
                </motion.button>
              )}
            </motion.div>
          )
        ) : (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Goals count and quick stats */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {filteredGoals.length} active goal{filteredGoals.length !== 1 ? 's' : ''}
                </span>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {filteredGoals.filter(g => g.progress && g.progress.length > 0).length} with progress
                </span>
              </div>
            </motion.div>

            {/* Enhanced Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGoals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
                  onClick={handleGoalClick}
                  delayMs={Math.min(index * 100, 800)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <SimpleGoalForm
        goal={editingGoal}
        isOpen={showGoalForm}
        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
        onClose={() => {
          setShowGoalForm(false);
          setEditingGoal(null);
        }}
      />

      <ProgressModal
        goal={selectedGoal}
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          setSelectedGoal(null);
        }}
      />

      {/* AI Settings removed */}
    </div>
  );
};

export default Dashboard;