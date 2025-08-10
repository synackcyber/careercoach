import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, LightBulbIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { progressApi } from '../services/api';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const ProgressModal = ({ goal, isOpen, onClose }) => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProgress, setNewProgress] = useState({
    description: '',
    percentage: '',
    notes: '',
    outcome: '',
    action_taken: '',
    next_steps: ''
  });
  const [progressSuggestions, setProgressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  useEffect(() => {
    if (isOpen && goal) {
      fetchProgress();
    }
  }, [isOpen, goal]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await progressApi.getByGoalId(goal.id);
      setProgress(response.data.data);
      
      // Fetch progress suggestions based on current progress
      await fetchProgressSuggestions();
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProgressSuggestions = async () => {
    try {
      // Calculate current percentage from existing progress
      const currentPercentage = progress.length > 0 
        ? Math.max(...progress.map(p => p.percentage)) 
        : 0;
        
      const response = await axios.get(
        `${API_BASE_URL}/progress-suggestions/for-goal/${goal.id}`,
        { params: { current_percentage: currentPercentage } }
      );
      setProgressSuggestions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching progress suggestions:', error);
    }
  };

  const handleAddProgress = async (e) => {
    e.preventDefault();
    try {
      const response = await progressApi.create(goal.id, {
        ...newProgress,
        percentage: parseInt(newProgress.percentage)
      });
      setProgress(prev => [response.data.data, ...prev]);
      setNewProgress({ description: '', percentage: '', notes: '', outcome: '', action_taken: '', next_steps: '' });
      setSelectedSuggestion(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  };

  const handleDeleteProgress = async (progressId) => {
    try {
      await progressApi.delete(progressId);
      setProgress(prev => prev.filter(p => p.id !== progressId));
    } catch (error) {
      console.error('Error deleting progress:', error);
    }
  };
  
  const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setNewProgress(prev => ({
      ...prev,
      description: suggestion.suggested_outcome,
      outcome: suggestion.suggested_outcome,
      action_taken: suggestion.action_prompt,
      next_steps: suggestion.next_step_prompt,
      percentage: getPercentageFromRange(suggestion.percentage_range)
    }));
  };
  
  const getPercentageFromRange = (range) => {
    if (!range) return '';
    const [min] = range.split('-').map(n => parseInt(n));
    return Math.max(min, 25).toString(); // Suggest at least 25% for meaningful progress
  };
  
  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
    if (!showSuggestions && progressSuggestions.length === 0) {
      fetchProgressSuggestions();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 animate-fade-in flex items-center justify-center p-4 z-50">
      <div className="modal-panel rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Progress for "{goal?.title}"
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Progress Updates</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-wire"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Progress</span>
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6">
              {/* Suggestions Section */}
              {progressSuggestions.length > 0 && (
                <div className="card mb-4 bg-white/70 dark:bg-zinc-900/50 ring-amber-200/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <LightBulbIcon className="w-5 h-5 text-amber-600" />
                      <h4 className="font-medium text-amber-900">Suggested Progress Updates</h4>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSuggestions}
                      className="text-sm text-accent-700 hover:text-accent-800"
                    >
                      {showSuggestions ? 'Hide' : 'Show'} Suggestions
                    </button>
                  </div>
                  
                  {showSuggestions && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {progressSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedSuggestion?.id === suggestion.id
                              ? 'border-accent-500 bg-accent-100'
                              : 'border-gray-200 bg-white hover:border-accent-300 hover:bg-surface-100'
                          }`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">
                                {suggestion.progress_stage}
                              </h5>
                              <p className="text-sm text-gray-600 mb-2">
                                {suggestion.suggested_outcome}
                              </p>
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span>🎯 {suggestion.action_prompt}</span>
                                <span className="status-badge bg-accent-100 text-accent-800">
                                  {suggestion.percentage_range}%
                                </span>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedSuggestion?.id === suggestion.id
                                ? 'border-accent-500 bg-accent-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedSuggestion?.id === suggestion.id && (
                                <CheckCircleIcon className="w-2 h-2 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleAddProgress} className="card bg-gray-50">
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    id="description"
                    required
                    value={newProgress.description}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    placeholder="What progress did you make?"
                  />
                </div>
                <div>
                  <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-1">
                    Progress Percentage *
                  </label>
                  <input
                    type="number"
                    id="percentage"
                    min="0"
                    max="100"
                    required
                    value={newProgress.percentage}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, percentage: e.target.value }))}
                    className="input-field"
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-1">
                    Outcome Achieved
                  </label>
                  <input
                    type="text"
                    id="outcome"
                    value={newProgress.outcome}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, outcome: e.target.value }))}
                    className="input-field"
                    placeholder="What specific outcome did you achieve?"
                  />
                </div>
                <div>
                  <label htmlFor="action_taken" className="block text-sm font-medium text-gray-700 mb-1">
                    Action Taken
                  </label>
                  <textarea
                    id="action_taken"
                    rows={2}
                    value={newProgress.action_taken}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, action_taken: e.target.value }))}
                    className="input-field resize-none"
                    placeholder="What specific actions did you take?"
                  />
                </div>
                <div>
                  <label htmlFor="next_steps" className="block text-sm font-medium text-gray-700 mb-1">
                    Next Steps
                  </label>
                  <textarea
                    id="next_steps"
                    rows={2}
                    value={newProgress.next_steps}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, next_steps: e.target.value }))}
                    className="input-field resize-none"
                    placeholder="What are your next steps?"
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={newProgress.notes}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, notes: e.target.value }))}
                    className="input-field resize-none"
                    placeholder="Any additional notes or reflections..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Progress
                  </button>
                </div>
              </div>
            </form>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-accent-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading progress...</p>
              </div>
            ) : progress.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No progress updates yet.</p>
                <p className="text-sm text-gray-400">Click "Add Progress" to get started.</p>
              </div>
            ) : (
              progress.map((p) => (
                <div key={p.id} className="card-solid border-l-4 border-accent-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="font-medium text-gray-900">{p.description}</h4>
                        <span className="status-badge bg-accent-100 text-accent-800">
                          {p.percentage}%
                        </span>
                      </div>
                      
                      {p.outcome && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-green-700 mb-1">🎯 Outcome Achieved</h5>
                          <p className="text-sm text-gray-700">{p.outcome}</p>
                        </div>
                      )}
                      
                      {p.action_taken && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-blue-700 mb-1">⚡ Action Taken</h5>
                          <p className="text-sm text-gray-700">{p.action_taken}</p>
                        </div>
                      )}
                      
                      {p.next_steps && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-purple-700 mb-1">🚀 Next Steps</h5>
                          <p className="text-sm text-gray-700">{p.next_steps}</p>
                        </div>
                      )}
                      
                      {p.notes && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-600 mb-1">📝 Additional Notes</h5>
                          <p className="text-sm text-gray-600">{p.notes}</p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500">{formatDate(p.created_at)}</p>
                    </div>
                      {/* Delete action removed from item for cleaner UI */}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;