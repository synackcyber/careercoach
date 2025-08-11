import React, { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useGoals } from '../hooks/useGoals';
import GoalCard from '../components/GoalCard';
import SimpleGoalForm from '../components/SimpleGoalForm';
import ProgressModal from '../components/ProgressModal';
// AI Settings removed

const Dashboard = () => {
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  // const [showAISettings, setShowAISettings] = useState(false);

  const { goals, loading, error, createGoal, updateGoal, deleteGoal } = useGoals(filters);
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


  const filteredGoals = goals.filter(goal =>
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

  const getGoalStats = () => {
    return {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      paused: goals.filter(g => g.status === 'paused').length
    };
  };

  const stats = getGoalStats();

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
    <div className="min-h-screen app-bg">
      {/* Header card */}
      <div className="px-6 pt-6">
        <div className="w-full">
          <div className="rounded-2xl ring-1 ring-black/5 shadow-card bg-white/85 dark:bg-zinc-900/70 backdrop-blur px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Activity</h1>
              </div>
              <div className="flex items-center space-x-3" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-300">Total Goals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{stats.total}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Active</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.active}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Completed</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.completed}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Paused</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{stats.paused}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Search */}
      <div className="w-full px-6 py-6">
        <div className="mb-8 flex justify-center">
          <motion.div
            className="relative"
            initial={false}
            animate={{ width: (searchFocused || searchTerm) ? '100%' : '60%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 40 }}
            style={{ minWidth: (searchFocused || searchTerm) ? undefined : 280 }}
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchTerm}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </motion.div>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white/85 dark:bg-zinc-900/70 backdrop-blur rounded-2xl ring-1 ring-black/5 shadow-card p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded-lg w-3/4"></div>
                  <div className="h-4 w-4 bg-gray-200 dark:bg-zinc-700 rounded"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded-lg w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No goals found' : 'No goals yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search or filters' 
                : 'Create your first goal to get started on your journey'
              }
            </p>
            {!searchTerm && (
              <button className="btn-primary" onClick={() => setShowGoalForm(true)}>Create a goal</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onClick={handleGoalClick}
              />
            ))}
          </div>
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