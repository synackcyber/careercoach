import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useJobRoles } from '../hooks/useJobRoles';
import { useResponsibilities } from '../hooks/useResponsibilities';
import { useGoalSuggestions } from '../hooks/useGoalSuggestions';
import AIGoalSuggestions from './AIGoalSuggestions';
import api, { aiApi } from '../services/api';

const SimpleGoalForm = ({ goal, onSubmit, onClose, isOpen }) => {
  const { jobRoles } = useJobRoles();
  const [selectedJobRoleId, setSelectedJobRoleId] = useState(goal?.job_role_id || '');
  const [selectedResponsibilityId, setSelectedResponsibilityId] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [goalType, setGoalType] = useState('general'); // 'general' or 'ai-powered'
  const [customGoal, setCustomGoal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { responsibilities, loading: respLoading } = useResponsibilities(selectedJobRoleId);
  const { suggestions, loading: suggestionsLoading } = useGoalSuggestions(selectedResponsibilityId);
  
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    priority: goal?.priority || 'medium',
    timeframe: '',
    due_date: goal?.due_date || ''
  });

  const calculateDueDate = (timeframe) => {
    if (!timeframe) return null;
    
    const now = new Date();
    let dueDate = new Date(now);
    
    switch (timeframe) {
      case '1_week':
        dueDate.setDate(now.getDate() + 7);
        break;
      case '2_weeks':
        dueDate.setDate(now.getDate() + 14);
        break;
      case '1_month':
        dueDate.setMonth(now.getMonth() + 1);
        break;
      case '2_months':
        dueDate.setMonth(now.getMonth() + 2);
        break;
      case '3_months':
        dueDate.setMonth(now.getMonth() + 3);
        break;
      case '6_months':
        dueDate.setMonth(now.getMonth() + 6);
        break;
      case '1_year':
        dueDate.setFullYear(now.getFullYear() + 1);
        break;
      default:
        return null;
    }
    
    return dueDate.toISOString();
  };

  useEffect(() => {
    if (goal) {
      setSelectedJobRoleId(goal.job_role_id || '');
      setCustomGoal(true);
    }
  }, [goal]);

  const handleJobRoleChange = (e) => {
    const jobRoleId = e.target.value;
    setSelectedJobRoleId(jobRoleId);
    setSelectedResponsibilityId('');
    setSelectedSuggestion(null);
    setCustomGoal(false);
  };

  const handleResponsibilityChange = (e) => {
    const responsibilityId = e.target.value;
    setSelectedResponsibilityId(responsibilityId);
    setSelectedSuggestion(null);
    setCustomGoal(false);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setFormData({
      ...formData,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority
    });
    setCustomGoal(false);
  };


  const handleCustomGoal = () => {
    setSelectedSuggestion(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: formData.due_date
    });
    setCustomGoal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJobRoleId || (!selectedSuggestion && !customGoal)) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        job_role_id: parseInt(selectedJobRoleId),
        status: goal?.status || 'active',
        due_date: formData.due_date || null
      };
      // If AI suggestion was chosen, refine SMART and pre-seed milestones metadata
      let metadata = null;
      if (selectedSuggestion && goalType === 'ai-powered') {
        try {
          // SMART refinement
          const smartResp = await api.post('/ai/refine-smart', {
            title: submitData.title,
            description: submitData.description,
            due_date: submitData.due_date || '',
            draft: { specific: '', achievable: '', relevant: '', time_bound: { due_date: submitData.due_date || '', review_cadence: 'weekly' } },
          });
          const smart = smartResp?.data?.data || {};
          // Milestones generation (5 phases by default)
          const msResp = await api.post('/ai/milestones', {
            title: submitData.title,
            description: submitData.description,
            due_date: (submitData.due_date || '').slice(0, 10),
            count: 5,
          });
          const milestones = msResp?.data?.data || [];
          metadata = { smart, milestones };
        } catch (err) {
          // Non-blocking; proceed without metadata if AI fails
          metadata = null;
        }
      }

      const finalData = metadata ? { ...submitData, metadata } : submitData;
      await onSubmit(finalData);
      onClose();
    } catch (error) {
      console.error('Error submitting goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepNumber = () => {
    if (!selectedJobRoleId) return 1;
    if (!selectedResponsibilityId) return 2;
    if (!selectedSuggestion && !customGoal) return 3;
    return 4;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 animate-fade-in flex items-center justify-center p-4 z-50">
      <div className="modal-panel rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step Progress */}
          <div className="flex items-center mb-8">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step <= getStepNumber() 
                    ? 'bg-accent-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step < getStepNumber() 
                      ? 'bg-accent-600' 
                      : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Job Role Selection */}
          <div className={`mb-6 ${selectedJobRoleId ? 'opacity-60' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. What's your job role?
            </label>
            <select
              value={selectedJobRoleId}
              onChange={handleJobRoleChange}
              className="input-field"
              required
            >
              <option value="">Select your job role</option>
              {jobRoles.map(role => (
                <option key={role.id} value={role.id}>{role.title}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Responsibility Selection */}
          {selectedJobRoleId && (
            <div className={`mb-6 animate-fade-in ${selectedResponsibilityId ? 'opacity-60' : ''}`}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. Which area do you want to focus on?
              </label>
              {respLoading ? (
                <div className="input-field flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full mr-2"></div>
                  Loading responsibilities...
                </div>
              ) : (
                <select
                  value={selectedResponsibilityId}
                  onChange={handleResponsibilityChange}
                  className="input-field"
                  required
                >
                  <option value="">Choose a focus area</option>
                  {responsibilities.map(resp => (
                    <option key={resp.id} value={resp.id}>{resp.title}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Step 3: Goal Type Selection */}
          {selectedResponsibilityId && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                3. Choose goal type
              </label>
              
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setGoalType('general')}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    goalType === 'general'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
                  }`}
                >
                  📚 General Skills
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType('ai-powered')}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    goalType === 'ai-powered'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  🤖 AI-Powered
                </button>
              </div>
              
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {goalType === 'ai-powered' ? 'AI-Powered goal suggestions' : 'General goal suggestions'}
              </label>
              
              {goalType === 'ai-powered' ? (
                <AIGoalSuggestions 
                  responsibilityId={selectedResponsibilityId}
                  onGoalSelect={(aiGoal) => {
                    setSelectedSuggestion(aiGoal);
                    setFormData({
                      ...formData,
                      title: aiGoal.title,
                      description: aiGoal.personalized_description || aiGoal.description,
                      priority: aiGoal.priority || 'medium'
                    });
                    setCustomGoal(false);
                  }}
                />
              ) : suggestionsLoading ? (
                <div className="border rounded-lg p-4 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-accent-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading suggestions...
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          selectedSuggestion?.id === suggestion.id
                            ? 'border-accent-500 bg-accent-50'
                            : 'border-gray-200 hover:border-accent-300 hover:bg-gray-50'
                        }`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">{suggestion.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                          <div className="flex items-center space-x-3 text-xs">
                            <span className={`status-badge ${
                              suggestion.priority === 'high' ? 'priority-high' :
                              suggestion.priority === 'medium' ? 'priority-medium' : 'priority-low'
                            }`}>
                              {suggestion.priority} priority
                            </span>
                            <span className="text-gray-500">📅 {suggestion.estimated_duration}</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedSuggestion?.id === suggestion.id
                            ? 'border-accent-500 bg-accent-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedSuggestion?.id === suggestion.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Custom Goal Option - available for all goal types */}
              {goalType !== 'ai-powered' && (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    customGoal
                      ? 'border-accent-500 bg-accent-50'
                      : 'border-gray-300 hover:border-accent-300'
                  }`}
                  onClick={handleCustomGoal}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <SparklesIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700 font-medium">Create my own custom goal</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Goal Details */}
          {(selectedSuggestion || customGoal) && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4. Finalize your goal
              </label>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="Enter your goal title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field resize-none"
                    placeholder="Describe your goal in more detail..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                      When do you want to complete this?
                    </label>
                    <select
                      id="timeframe"
                      value={formData.timeframe || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value, due_date: calculateDueDate(e.target.value) }))}
                      className="input-field"
                    >
                      <option value="">No specific deadline</option>
                      <option value="1_week">This week</option>
                      <option value="2_weeks">In 2 weeks</option>
                      <option value="1_month">Next month</option>
                      <option value="2_months">In 2 months</option>
                      <option value="3_months">In 3 months</option>
                      <option value="6_months">In 6 months</option>
                      <option value="1_year">This year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-wire"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-cta"
              disabled={loading || (!selectedSuggestion && !customGoal)}
            >
              {loading ? 'Creating...' : (goal ? 'Update Goal' : 'Create Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleGoalForm;