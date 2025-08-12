import React, { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, FlagIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useGoals } from '../hooks/useGoals';
import GoalCard from '../components/GoalCard';
import SimpleGoalForm from '../components/SimpleGoalForm';


const Dashboard = ({ session }) => {
  const [filters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  // const [showAISettings, setShowAISettings] = useState(false);

  const { goals, loading, error, initialized, createGoal, updateGoal, deleteGoal } = useGoals(filters);
  
  // Rotating greetings array
  const greetings = [
    "Welcome back",
    "Good to see you",
    "Hello again",
    "Welcome back",
    "Great to have you here",
    "Welcome",
    "Good day",
    "Hello there",
    "Welcome back",
    "Glad you're here"
  ];
  
  // Rotate greeting every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [greetings.length]);
  
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
      
      
             {/* Main content */}
       <div className="w-full px-6 py-6">


        {/* Personalized Greeting */}
        {session?.user && (
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.h2 
              key={currentGreetingIndex}
              className="text-2xl font-medium text-gray-900 dark:text-zinc-100 mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              {greetings[currentGreetingIndex]}, {session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'there'}
            </motion.h2>
            <motion.p 
              key={currentGreetingIndex}
              className="text-gray-600 dark:text-zinc-400 text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {currentGreetingIndex % 2 === 0 ? "Let's make progress on your goals" : "Ready to tackle today's objectives"}
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
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </motion.span>
            <input
              type="text"
              placeholder="Search your goals..."
              value={searchTerm}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400"
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
                <div className="w-32 h-8 bg-gray-200 dark:bg-zinc-700 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="h-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6 animate-pulse"
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
                 <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <FlagIcon className="w-8 h-8 text-gray-600 dark:text-zinc-400" />
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
                   className="btn-primary bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
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
               <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">
                 <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                   {filteredGoals.length} active goal{filteredGoals.length !== 1 ? 's' : ''}
                 </span>
                 <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                 <span className="text-sm text-gray-600 dark:text-zinc-400">
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





      {/* AI Settings removed */}
    </div>
  );
};

export default Dashboard;