import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlagIcon, TrashIcon, PlusIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { userProfileApi, aiApi, goalApi } from '../services/api';
import PageTitle from '../components/PageTitle';

export default function GoalSuggestions() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [suggestedGoals, setSuggestedGoals] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [selectedGoalForModal, setSelectedGoalForModal] = useState(null);
  const [addingToDashboard, setAddingToDashboard] = useState(false);

  // Load user profile and generate initial suggestions
  useEffect(() => {
    const loadProfileAndSuggestions = async () => {
      try {
        setLoading(true);
        
        // Load user profile
        const profileResult = await userProfileApi.getOrCreate();
        const profile = profileResult?.data?.data || {};
        setUserProfile(profile);

        // Generate initial AI suggestions
        await generateGoalSuggestions(profile);
      } catch (error) {
        console.error('Failed to load profile or generate suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndSuggestions();
  }, []);

  const generateGoalSuggestions = async (profile) => {
    try {
      setGenerating(true);
      
      // Call AI service to generate goal suggestions
      const response = await aiApi.generateGoalSuggestions({
        current_role: profile.current_role || 'Professional',
        experience_level: profile.experience_level || 'mid',
        industry: profile.industry || 'Technology',
        count: 5
      });

      const goals = response?.data?.data || [];
      
      // Transform AI response into structured format
      const structuredGoals = goals.map(goal => ({
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: goal.title || 'Professional Development Goal',
        description: goal.description || goal.personalized_description || 'A goal to advance your career',
        category: goal.category || 'career',
        estimated_weeks: goal.estimated_weeks || 4,
        difficulty: goal.difficulty || 'medium',
        roadmap: goal.roadmap || generateDefaultRoadmap(goal.title || 'Professional Development Goal'),
        selected: false
      }));

      setSuggestedGoals(structuredGoals);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      // Fallback to default suggestions
      setSuggestedGoals(generateFallbackSuggestions(profile));
    } finally {
      setGenerating(false);
    }
  };

  const generateDefaultRoadmap = (goalTitle) => {
    // Generate a basic 4-week roadmap for any goal
    return [
      {
        id: `step-1-${Date.now()}`,
        week: 1,
        title: 'Assessment & Planning',
        description: 'Evaluate current state and create detailed plan',
        tasks: [
          'Review current situation and identify gaps',
          'Research best practices and industry standards',
          'Create timeline and resource requirements',
          'Set specific, measurable objectives'
        ]
      },
      {
        id: `step-2-${Date.now()}`,
        week: 2,
        title: 'Foundation Building',
        description: 'Establish basic infrastructure and processes',
        tasks: [
          'Set up necessary tools and environments',
          'Create initial documentation and templates',
          'Establish baseline measurements',
          'Begin core implementation'
        ]
      },
      {
        id: `step-3-${Date.now()}`,
        week: 3,
        title: 'Implementation & Testing',
        description: 'Execute core activities and validate results',
        tasks: [
          'Implement main features or processes',
          'Conduct testing and quality assurance',
          'Gather feedback and iterate',
          'Document lessons learned'
        ]
      },
      {
        id: `step-4-${Date.now()}`,
        week: 4,
        title: 'Optimization & Handoff',
        description: 'Refine results and ensure sustainability',
        tasks: [
          'Optimize performance and efficiency',
          'Create maintenance procedures',
          'Train team members if applicable',
          'Plan next iteration or goal'
        ]
      }
    ];
  };

  const generateFallbackSuggestions = (profile) => {
    const role = profile.current_role || 'Professional';
    const experience = profile.experience_level || 'mid';
    
    return [
      {
        id: 'fallback-1',
        title: 'Master Advanced DevOps Practices',
        description: 'Deepen your expertise in CI/CD, infrastructure as code, and cloud-native development',
        category: 'technical',
        estimated_weeks: 6,
        difficulty: 'advanced',
        roadmap: generateDefaultRoadmap('Master Advanced DevOps Practices'),
        selected: false
      },
      {
        id: 'fallback-2',
        title: 'Build Leadership Skills',
        description: 'Develop team management, project planning, and stakeholder communication abilities',
        category: 'leadership',
        estimated_weeks: 8,
        difficulty: 'intermediate',
        roadmap: generateDefaultRoadmap('Build Leadership Skills'),
        selected: false
      },
      {
        id: 'fallback-3',
        title: 'Expand Cloud Architecture Knowledge',
        description: 'Learn advanced cloud patterns, security best practices, and cost optimization',
        category: 'technical',
        estimated_weeks: 5,
        difficulty: 'intermediate',
        roadmap: generateDefaultRoadmap('Expand Cloud Architecture Knowledge'),
        selected: false
      },
      {
        id: 'fallback-4',
        title: 'Improve System Reliability',
        description: 'Implement SRE principles, monitoring, and incident response procedures',
        category: 'operational',
        estimated_weeks: 7,
        difficulty: 'advanced',
        roadmap: generateDefaultRoadmap('Improve System Reliability'),
        selected: false
      },
      {
        id: 'fallback-5',
        title: 'Enhance Security Posture',
        description: 'Strengthen security practices, compliance, and threat modeling capabilities',
        category: 'security',
        estimated_weeks: 6,
        difficulty: 'intermediate',
        roadmap: generateDefaultRoadmap('Enhance Security Posture'),
        selected: false
      }
    ];
  };

  const toggleGoalSelection = (goalId) => {
    setSuggestedGoals(prev => 
      prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, selected: !goal.selected }
          : goal
      )
    );
  };

  const addSelectedGoalsToDashboard = async () => {
    const newGoals = suggestedGoals.filter(goal => goal.selected);
    
    if (newGoals.length === 0) return;
    
    try {
      setAddingToDashboard(true);
      
      // Add each selected goal to the dashboard via API
      for (const goal of newGoals) {
        const goalData = {
          title: goal.title,
          description: goal.description,
          category: goal.category,
          estimated_weeks: goal.estimated_weeks,
          difficulty: goal.difficulty,
          roadmap: goal.roadmap, // Store roadmap data for the modal
          status: 'active',
          priority: 'medium'
        };
        
        await goalApi.create(goalData);
      }
      
      // Clear selections and show success
      setSuggestedGoals(prev => 
        prev.map(goal => ({ ...goal, selected: false }))
      );
      
      // Navigate to dashboard to see the new goals
      window.location.hash = '#/';
      
    } catch (error) {
      console.error('Failed to add goals to dashboard:', error);
      // You could add a toast notification here
    } finally {
      setAddingToDashboard(false);
    }
  };

  const openRoadmapModal = (goal) => {
    setSelectedGoalForModal(goal);
    setShowRoadmapModal(true);
  };

  const closeRoadmapModal = () => {
    setShowRoadmapModal(false);
    setSelectedGoalForModal(null);
  };

  const requestMoreSuggestions = async () => {
    if (!userProfile) return;
    
    try {
      setGenerating(true);
      
      // Generate 3 more suggestions
      const response = await aiApi.generateGoalSuggestions({
        current_role: userProfile.current_role || 'Professional',
        experience_level: userProfile.experience_level || 'mid',
        industry: userProfile.industry || 'Technology',
        count: 3,
        exclude: selectedGoals.map(g => g.title) // Avoid duplicates
      });

      const newGoals = response?.data?.data || [];
      const structuredNewGoals = newGoals.map(goal => ({
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: goal.title || 'Professional Development Goal',
        description: goal.description || goal.personalized_description || 'A goal to advance your career',
        category: goal.category || 'career',
        estimated_weeks: goal.estimated_weeks || 4,
        difficulty: goal.difficulty || 'medium',
        roadmap: goal.roadmap || generateDefaultRoadmap(goal.title || 'Professional Development Goal'),
        selected: false
      }));

      setSuggestedGoals(prev => [...prev, ...structuredNewGoals]);
    } catch (error) {
      console.error('Failed to generate more suggestions:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-zinc-400">Loading your personalized suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <div className="w-full px-6 pt-8 pb-6">
        <PageTitle className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 text-center">
          Goal Suggestions
        </PageTitle>
        <p className="text-center text-gray-600 dark:text-zinc-400 mt-2">
          AI-powered suggestions based on your profile
        </p>
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 pb-8">
        {/* Suggested Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Suggested Goals
              </h2>
              <button
                onClick={requestMoreSuggestions}
                disabled={generating}
                className="flex items-center px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    More Suggestions
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    goal.selected
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 ring-2 ring-accent-200 dark:ring-accent-700/50'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-accent-300 dark:hover:border-accent-600 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                  onClick={() => toggleGoalSelection(goal.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <FlagIcon className="w-5 h-5 text-accent-600 dark:text-accent-400 mt-0.5" />
                    {goal.selected && (
                      <div className="w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 line-clamp-2">
                    {goal.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3 line-clamp-3">
                    {goal.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                      {goal.estimated_weeks} weeks
                    </span>
                    <span className="capitalize">{goal.difficulty}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {suggestedGoals.some(goal => goal.selected) && (
              <div className="mt-6 text-center">
                <button
                  onClick={addSelectedGoalsToDashboard}
                  disabled={addingToDashboard}
                  className="px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-semibold transition-colors transform hover:scale-105 disabled:opacity-50"
                >
                  {addingToDashboard ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline"></div>
                      Adding to Dashboard...
                    </>
                  ) : (
                    'Add Selected Goals to Dashboard'
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Preview Section - Show selected goals before adding */}
        {suggestedGoals.some(goal => goal.selected) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-6">
              Preview: Goals to Add
            </h2>

            <div className="space-y-4">
              {suggestedGoals.filter(goal => goal.selected).map((goal) => (
                <div key={goal.id} className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                        {goal.title}
                      </h3>
                      <p className="text-gray-600 dark:text-zinc-400 mb-3">
                        {goal.description}
                      </p>
                    </div>
                    <button
                      onClick={() => openRoadmapModal(goal)}
                      className="px-3 py-1 text-sm bg-accent-100 hover:bg-accent-200 dark:bg-accent-900/30 dark:hover:bg-accent-900/50 text-accent-700 dark:text-accent-300 rounded-lg transition-colors"
                    >
                      View Roadmap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Roadmap Modal */}
      <AnimatePresence>
        {showRoadmapModal && selectedGoalForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeRoadmapModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    {selectedGoalForModal.title}
                  </h2>
                  <p className="text-gray-600 dark:text-zinc-400 mt-1">
                    {selectedGoalForModal.description}
                  </p>
                </div>
                <button
                  onClick={closeRoadmapModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content - Roadmap */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                    Achievement Roadmap
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-400">
                    <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-full">
                      {selectedGoalForModal.estimated_weeks} weeks
                    </span>
                    <span className="capitalize">{selectedGoalForModal.difficulty}</span>
                    <span className="capitalize">{selectedGoalForModal.category}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedGoalForModal.roadmap.map((step) => (
                    <div key={step.id} className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-5">
                      <div className="flex items-start mb-4">
                        <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center text-lg font-bold text-accent-700 dark:text-accent-300 mr-4 flex-shrink-0">
                          {step.week}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                            {step.title}
                          </h4>
                          <p className="text-gray-600 dark:text-zinc-400 mb-4">
                            {step.description}
                          </p>
                          
                          <ul className="space-y-2">
                            {step.tasks.map((task, index) => (
                              <li key={index} className="text-gray-700 dark:text-zinc-300 flex items-start">
                                <span className="w-2 h-2 bg-accent-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700">
                <button
                  onClick={closeRoadmapModal}
                  className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
