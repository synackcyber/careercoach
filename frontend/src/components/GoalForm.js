import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useJobRoles } from '../hooks/useJobRoles';
import { useGoalSuggestions } from '../hooks/useGoalSuggestions';
import GoalSuggestions from './GoalSuggestions';

const GoalForm = ({ goal, onSubmit, onClose, isOpen }) => {
  const { jobRoles } = useJobRoles();
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    job_role_id: goal?.job_role_id || '',
    status: goal?.status || 'active',
    priority: goal?.priority || 'medium',
    due_date: goal?.due_date ? goal.due_date.split('T')[0] : ''
  });
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { suggestions, loading: suggestionsLoading } = useGoalSuggestions(
    formData.job_role_id
  );

  useEffect(() => {
    // Show suggestions when job role is selected and we're creating a new goal
    setShowSuggestions(!goal && formData.job_role_id && !formData.title);
  }, [formData.job_role_id, formData.title, goal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        job_role_id: formData.job_role_id ? parseInt(formData.job_role_id) : null,
        due_date: formData.due_date || null
      };
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSuggestionSelect = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority
    }));
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        <div className={`${showSuggestions ? 'grid grid-cols-1 lg:grid-cols-2 h-full' : ''}`}>
          {showSuggestions && (
            <div className="bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
              <GoalSuggestions 
                suggestions={suggestions}
                loading={suggestionsLoading}
                onSelectSuggestion={handleSuggestionSelect}
              />
            </div>
          )}
          
          <div className="overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter goal title"
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
              onChange={handleChange}
              className="input-field resize-none"
              placeholder="Describe your goal..."
            />
          </div>

          <div>
            <label htmlFor="job_role_id" className="block text-sm font-medium text-gray-700 mb-1">
              Job Role
            </label>
            <select
              id="job_role_id"
              name="job_role_id"
              value={formData.job_role_id}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select a job role</option>
              {jobRoles.map(role => (
                <option key={role.id} value={role.id}>{role.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            {!goal && formData.job_role_id && (
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="btn-ghost text-sm flex items-center space-x-1"
              >
                <span>{showSuggestions ? 'Hide' : 'Show'} Suggestions</span>
              </button>
            )}
            
            <div className="flex space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (goal ? 'Update Goal' : 'Create Goal')}
              </button>
            </div>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalForm;