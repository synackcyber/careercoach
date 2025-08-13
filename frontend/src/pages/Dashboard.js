import React, { useEffect, useState } from 'react';
import { FlagIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useGoals } from '../hooks/useGoals';


import SimpleGoalForm from '../components/SimpleGoalForm';

const Dashboard = ({ session }) => {
  const [filters] = useState({});

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  


  const { goals, loading, error, createGoal, updateGoal } = useGoals(filters);

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



  const handleCreateGoal = async (goalData) => {
    await createGoal(goalData);
  };

  const handleUpdateGoal = async (goalData) => {
    await updateGoal(editingGoal.id, goalData);
    setEditingGoal(null);
  };





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
            <h2 className="text-2xl font-medium text-gray-900 dark:text-zinc-100 mb-2">
              Welcome back, {session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'there'}
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 text-base mb-4">
              Discover personalized goal suggestions to accelerate your growth
            </p>
            
            {/* Navigation to My Goals */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <motion.button
                onClick={() => window.location.hash = '#/my-goals'}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FlagIcon className="w-4 h-4" />
                <span>View My Goals</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}



        {/* Quick Actions Section */}
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="mb-8">
            <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlagIcon className="w-8 h-8 text-accent-600 dark:text-accent-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
              Ready to get started?
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto mb-6">
              Get personalized goal suggestions or view your current goals
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={() => window.location.hash = '#/suggestions'}
                className="px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-semibold transition-colors transform hover:scale-105 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Goal Suggestions
              </motion.button>
              
              <motion.button
                onClick={() => window.location.hash = '#/my-goals'}
                className="px-6 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl font-semibold transition-colors transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View My Goals
              </motion.button>
            </div>
          </div>
        </motion.div>
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


    </div>
  );
};

export default Dashboard;