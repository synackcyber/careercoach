import React, { useEffect, useState } from 'react';
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useGoals } from '../hooks/useGoals';
import GoalCard from '../components/GoalCard';
import SimpleGoalForm from '../components/SimpleGoalForm';
import ProgressModal from '../components/ProgressModal';
import AISettings from '../components/AISettings';

const Dashboard = () => {
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const { goals, loading, error, createGoal, updateGoal, deleteGoal } = useGoals(filters);

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

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === 'all' ? undefined : value
    }));
  };

  const getGoalStats = () => {
    return {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      paused: goals.filter(g => g.status === 'paused').length
    };
  };

  const stats = getGoalStats();

  const completedCardClasses = stats.completed > 0
    ? 'rounded-lg bg-accent-50 dark:bg-accent-900/20 p-4'
    : 'rounded-lg bg-gray-50 dark:bg-zinc-800 p-4';
  const completedTextClasses = stats.completed > 0
    ? 'text-sm font-medium text-accent-700 dark:text-accent-300'
    : 'text-sm font-medium text-gray-600 dark:text-zinc-400';
  const completedNumberClasses = stats.completed > 0
    ? 'text-2xl font-bold text-accent-700 dark:text-accent-300 mt-1'
    : 'text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1';

  // simple dark mode persistence
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
    setIsDark(isDark);
    const reduce = localStorage.getItem('reduce-motion') === 'true' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    document.documentElement.classList.toggle('reduce-motion', reduce);
    setReduceMotion(reduce);
  }, []);
  const toggleReduceMotion = () => {
    setReduceMotion((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('reduce-motion', next);
      localStorage.setItem('reduce-motion', String(next));
      return next;
    });
  };

  const toggleTheme = () => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    const next = currentlyDark ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
    setIsDark(next === 'dark');
  };

  if (error) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col gap-4">
          <div className="card p-4 animate-in-left" style={{ animationDelay: '40ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Workspace</h2>
              <button
                onClick={toggleTheme}
                className="btn-icon"
                title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Reduce Motion</span>
              <button
                onClick={toggleReduceMotion}
                className="btn-wire btn-wire-sm"
                title="Toggle reduced motion"
                aria-pressed={reduceMotion}
              >
                {reduceMotion ? 'On' : 'Off'}
              </button>
            </div>
            <nav className="space-y-1">
              <a className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800" href="#">
                <span className="text-sm text-gray-700 dark:text-zinc-200">Dashboard</span>
              </a>
              <a className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800" href="#/timeline">
                <span className="text-sm text-gray-700 dark:text-zinc-200">Timeline</span>
              </a>
              <a className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800" href="#/timeline-vertical">
                <span className="text-sm text-gray-700 dark:text-zinc-200">Timeline (Vertical)</span>
              </a>
              <a className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-accent-700" href="#goals">
                <span className="text-sm text-gray-700 dark:text-zinc-200">Goals</span>
                <span className="text-xs text-gray-500">{stats.total}</span>
              </a>
              <a className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800" href="#suggestions">
                <span className="text-sm text-gray-700 dark:text-zinc-200">Suggestions</span>
              </a>
              <button onClick={() => setShowAISettings(true)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
                <span className="text-sm text-gray-700 dark:text-zinc-200">AI Settings</span>
              </button>
            </nav>
          </div>

          <div className="card p-4 animate-in-left" style={{ animationDelay: '80ms' }}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Overview</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 dark:bg-zinc-800 p-3">
                <p className="text-gray-500 dark:text-zinc-400">Total</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                <p className="text-green-700 dark:text-green-300">Active</p>
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">{stats.active}</p>
              </div>
              <div className="rounded-lg bg-accent-50 dark:bg-accent-900/20 p-3">
                <p className="text-accent-700 dark:text-accent-300">Completed</p>
                <p className="text-lg font-semibold text-accent-700 dark:text-accent-300">{stats.completed}</p>
              </div>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                <p className="text-yellow-700 dark:text-yellow-300">Paused</p>
                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{stats.paused}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {/* Header */}
          <div className="card p-6 mb-6 animate-in-down">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-zinc-100">Goal Tracker</h1>
                <p className="text-gray-600 dark:text-zinc-400 mt-1">Track your personal and professional goals</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setShowGoalForm(true);
                  }}
                  className="btn-wire-accent"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>New Goal</span>
                </button>
              </div>
            </div>

            {/* Stats row (compact on header) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-gray-50 dark:bg-zinc-800 p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">Total Goals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Active</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.active}</p>
              </div>
              <div className={completedCardClasses}>
                <p className={completedTextClasses}>Completed</p>
                <p className={completedNumberClasses}>{stats.completed}</p>
              </div>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Paused</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{stats.paused}</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card p-6 mb-6 animate-in-up" style={{ animationDelay: '80ms' }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search goals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input-field min-w-[120px]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                
                <select
                  value={filters.priority || 'all'}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="input-field min-w-[120px]"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          {loading ? (
            <div className="card p-8 text-center animate-fade-in">
              <div className="animate-spin w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 dark:text-zinc-400 mt-4">Loading your goals...</p>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="card p-8 text-center animate-fade-in">
              <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">
                {searchTerm ? 'No goals found' : 'No goals yet'}
              </h3>
              <p className="text-gray-500 dark:text-zinc-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first goal to get started on your journey'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setShowGoalForm(true);
                  }}
                  className="btn-wire-accent mx-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Create Your First Goal</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal, idx) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
                  onClick={handleGoalClick}
                  delayMs={100 + idx * 60}
                />
              ))}
            </div>
          )}
        </main>
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

      <AISettings
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
      />
    </div>
  );
};

export default Dashboard;