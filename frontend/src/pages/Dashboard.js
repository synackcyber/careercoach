import React, { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import PageTitle from '../components/PageTitle';
import { useGoals } from '../hooks/useGoals';
import { goalSuggestionApi, aiApi, userProfileApi } from '../services/api';
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

  const { goals, loading, error, initialized, createGoal, updateGoal, deleteGoal } = useGoals(filters);
  const [profileSuggestions, setProfileSuggestions] = useState([]);
  const [prefetching, setPrefetching] = useState(false);
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

  // Prefetch profile-based suggestions (authenticated)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPrefetching(true);
        const prof = await userProfileApi.getOrCreate();
        // Use axios client with auth to fetch personalized suggestions
        const resp = await goalSuggestionApi.getAll(); // not used; ensure client warm
        const raw = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:8080') + '/api/v1/suggestions/for-profile', {
          headers: { 'Authorization': 'Bearer ' + (await (await import('../supabase/authClient')).getAccessToken()) }
        }).catch(()=>null);
        let list = [];
        if (raw && raw.ok) {
          const j = await raw.json(); list = j?.data || [];
        }
        if (mounted) setProfileSuggestions(list.slice(0,6));
      } catch (_) {
        if (mounted) setProfileSuggestions([]);
      } finally {
        if (mounted) setPrefetching(false);
      }
    })();
    return () => { mounted = false; };
  }, []);


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
    <div className="min-h-screen app-bg">
      {/* Animated Search */}
      <div className="w-full px-6 py-6">
        {/* Page Title (desktop only; mobile uses the header title) */}
        <div className="mb-4 hidden md:block">
          <PageTitle className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
            Dashboard
          </PageTitle>
        </div>

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
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </motion.span>
            <input
              type="text"
              placeholder="Search.."
              value={searchTerm}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </motion.div>
        </motion.div>

        {/* Suggested for you */}
        {profileSuggestions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Suggested for you</h3>
              <button className="text-sm text-accent-600 hover:text-accent-700" onClick={()=>window.location.hash = '#/new-goal'}>Create custom</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileSuggestions.map((s, idx) => (
                <div key={s.id || idx} className="rounded-xl border-2 border-gray-200 dark:border-zinc-800 p-4 bg-white/95 dark:bg-zinc-900/95">
                  <div className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">{s.title}</div>
                  <div className="text-sm text-gray-600 dark:text-zinc-400 mb-3 line-clamp-2">{s.description}</div>
                  <div className="flex gap-2">
                    <button className="btn-primary btn-wire-sm" onClick={() => {
                      setEditingGoal({ title: s.title, description: s.description, priority: s.priority || 'medium' });
                      setShowGoalForm(true);
                    }}>Use</button>
                    <button className="btn-secondary btn-wire-sm" onClick={() => {
                      // Open form prefilled, then dispatch an event to refine SMART
                      setEditingGoal({ title: s.title, description: s.description, priority: s.priority || 'medium' });
                      setShowGoalForm(true);
                      setTimeout(() => {
                        try { document.querySelector('button[data-refine-smart]')?.click(); } catch (_) {}
                      }, 220);
                    }}>Refine SMART</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Grid. Hide empty-state until first load completes to avoid flash. */}
        {filteredGoals.length === 0 ? (
          (!initialized || loading) ? null : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No active goals found' : 'No active goals yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search or create a new active goal' 
                  : 'Create your first active goal to get started on your journey'
                }
              </p>
              {!searchTerm && (
                <button className="btn-primary" onClick={() => setShowGoalForm(true)}>Create a goal</button>
              )}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onClick={handleGoalClick}
                delayMs={Math.min(index * 70, 700)}
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