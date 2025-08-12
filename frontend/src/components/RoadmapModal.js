import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, FlagIcon } from '@heroicons/react/24/outline';

const RoadmapModal = ({ isOpen, onClose, goal }) => {
  if (!goal) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'leadership': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'operational': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'security': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center">
                  <FlagIcon className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    {goal.title}
                  </h2>
                  <p className="text-gray-600 dark:text-zinc-400 mt-1">
                    {goal.description}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - Goal Details & Roadmap */}
            <div className="p-6">
              {/* Goal Metadata */}
              <div className="mb-8">
                <div className="flex items-center gap-4 text-sm mb-4">
                  {goal.estimated_weeks && (
                    <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-full">
                      {goal.estimated_weeks} weeks
                    </span>
                  )}
                  {goal.difficulty && (
                    <span className={`px-3 py-1 rounded-full ${getDifficultyColor(goal.difficulty)}`}>
                      {goal.difficulty}
                    </span>
                  )}
                  {goal.category && (
                    <span className={`px-3 py-1 rounded-full ${getCategoryColor(goal.category)}`}>
                      {goal.category}
                    </span>
                  )}
                  {goal.priority && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                      {goal.priority} priority
                    </span>
                  )}
                </div>

                {/* Progress Section */}
                {goal.progress && goal.progress.length > 0 && (
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-3">
                      Current Progress
                    </h3>
                    <div className="space-y-3">
                      {goal.progress.slice(-3).reverse().map((progress, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-zinc-400">
                            {progress.description || `Progress update ${index + 1}`}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                            {progress.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Roadmap Section */}
              {goal.roadmap && goal.roadmap.length > 0 ? (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-6">
                    Achievement Roadmap
                  </h3>
                  
                  <div className="space-y-6">
                    {goal.roadmap.map((step, index) => (
                      <motion.div
                        key={step.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-5 border-l-4 border-accent-500"
                      >
                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center text-xl font-bold text-accent-700 dark:text-accent-300 mr-4 flex-shrink-0">
                            {step.week || index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                              {step.title}
                            </h4>
                            <p className="text-gray-600 dark:text-zinc-400 mb-4">
                              {step.description}
                            </p>
                            
                            {step.tasks && step.tasks.length > 0 && (
                              <ul className="space-y-2">
                                {step.tasks.map((task, taskIndex) => (
                                  <li key={taskIndex} className="text-gray-700 dark:text-zinc-300 flex items-start">
                                    <span className="w-2 h-2 bg-accent-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FlagIcon className="w-8 h-8 text-gray-400 dark:text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                    No Roadmap Available
                  </h3>
                  <p className="text-gray-600 dark:text-zinc-400">
                    This goal doesn't have a detailed roadmap yet.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoadmapModal;
