import React, { useEffect, useState } from 'react';
import { FlagIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoals } from '../hooks/useGoals';
import SuggestedGoalCard from '../components/SuggestedGoalCard';
import RoadmapCard from '../components/RoadmapCard';
import SimpleGoalForm from '../components/SimpleGoalForm';

const Dashboard = ({ session }) => {
  const [filters] = useState({});

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedSuggestedGoal, setSelectedSuggestedGoal] = useState(null);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  
  // Mock suggested goals data - replace with actual API call
  const [suggestedGoals, setSuggestedGoals] = useState([
    {
      id: 1,
      title: "Master React Hooks",
      description: "Learn advanced React patterns and custom hooks to build more maintainable components",
      category: "skill",
      difficulty: "intermediate",
      estimatedDuration: "4-6 weeks",
      prerequisites: ["Basic React knowledge", "JavaScript ES6+"],
      roadmap: [
        {
          title: "Foundation Review",
          description: "Brush up on React basics and component lifecycle",
          estimatedTime: "1 week",
          steps: ["Review functional components", "Understand state management", "Practice with simple examples"]
        },
        {
          title: "Hooks Deep Dive",
          description: "Master useState, useEffect, and custom hooks",
          estimatedTime: "2 weeks",
          steps: ["Learn useState patterns", "Master useEffect dependencies", "Create custom hooks"]
        },
        {
          title: "Advanced Patterns",
          description: "Implement complex state logic and performance optimizations",
          estimatedTime: "2-3 weeks",
          steps: ["UseReducer for complex state", "Context API integration", "Performance optimization techniques"]
        }
      ]
    },
    {
      id: 2,
      title: "Build a Full-Stack SaaS",
      description: "Create a complete SaaS application from frontend to backend with modern technologies",
      category: "project",
      difficulty: "advanced",
      estimatedDuration: "8-12 weeks",
      prerequisites: ["Frontend development", "Backend basics", "Database knowledge"],
      roadmap: [
        {
          title: "Planning & Architecture",
          description: "Design system architecture and plan development phases",
          estimatedTime: "1 week",
          steps: ["Define requirements", "Choose tech stack", "Plan database schema"]
        },
        {
          title: "Frontend Development",
          description: "Build the user interface and user experience",
          estimatedTime: "3-4 weeks",
          steps: ["Create UI components", "Implement routing", "Add state management"]
        },
        {
          title: "Backend Development",
          description: "Develop API endpoints and business logic",
          estimatedTime: "3-4 weeks",
          steps: ["Set up server", "Create API routes", "Implement authentication"]
        }
      ]
    },
    {
      id: 3,
      title: "Learn TypeScript",
      description: "Master TypeScript to write more robust and maintainable JavaScript code",
      category: "learning",
      difficulty: "beginner",
      estimatedDuration: "3-4 weeks",
      prerequisites: ["JavaScript fundamentals"],
      roadmap: [
        {
          title: "TypeScript Basics",
          description: "Learn fundamental TypeScript concepts and syntax",
          estimatedTime: "1 week",
          steps: ["Install TypeScript", "Learn basic types", "Practice with simple examples"]
        },
        {
          title: "Advanced Types",
          description: "Master complex types and interfaces",
          estimatedTime: "1-2 weeks",
          steps: ["Learn interfaces", "Understand generics", "Practice with real projects"]
        },
        {
          title: "Integration",
          description: "Integrate TypeScript into existing projects",
          estimatedTime: "1 week",
          steps: ["Configure tsconfig", "Migrate JavaScript files", "Add type definitions"]
        }
      ]
    }
  ]);

  const { goals, loading, error, initialized, createGoal, updateGoal, deleteGoal } = useGoals(filters);

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

  const filteredSuggestedGoals = suggestedGoals;

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

  const handleSuggestedGoalSelect = (suggestedGoal) => {
    setSelectedSuggestedGoal(suggestedGoal);
    setShowRoadmapModal(true);
  };

  const handleAddToGoals = async (newGoal) => {
    try {
      await createGoal(newGoal);
      // Remove from suggested goals
      setSuggestedGoals(prev => prev.filter(g => g.id !== selectedSuggestedGoal.id));
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
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



        {/* Suggested Goals Grid */}
        {filteredSuggestedGoals.length === 0 ? (
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
                  No suggested goals available
                </h3>
                <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto">
                  Check back later for personalized goal suggestions based on your profile
                </p>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Suggested Goals count */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {filteredSuggestedGoals.length} suggested goal{filteredSuggestedGoals.length !== 1 ? 's' : ''}
                </span>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-zinc-400">
                  Based on your profile
                </span>
              </div>
            </motion.div>

            {/* Suggested Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSuggestedGoals.map((suggestedGoal, index) => (
                <SuggestedGoalCard
                  key={suggestedGoal.id}
                  suggestedGoal={suggestedGoal}
                  onSelect={handleSuggestedGoalSelect}
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

      {/* Roadmap Modal */}
      <AnimatePresence>
        {showRoadmapModal && selectedSuggestedGoal && (
          <RoadmapCard
            suggestedGoal={selectedSuggestedGoal}
            onClose={() => {
              setShowRoadmapModal(false);
              setSelectedSuggestedGoal(null);
            }}
            onAddToGoals={handleAddToGoals}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;