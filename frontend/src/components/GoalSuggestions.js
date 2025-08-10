import React from 'react';
import { SparklesIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';

const GoalSuggestions = ({ suggestions, loading, onSelectSuggestion }) => {
  if (loading) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'skill':
        return <SparklesIcon className="w-4 h-4 text-amber-600" />;
      case 'project':
        return <TagIcon className="w-4 h-4 text-green-500" />;
      case 'certification':
        return <SparklesIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <TagIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'skill':
        return 'bg-amber-100 text-amber-800';
      case 'project':
        return 'bg-green-100 text-green-800';
      case 'certification':
        return 'bg-purple-100 text-purple-800';
      case 'career':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg bg-gradient-to-br from-amber-50 to-surface-100 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <SparklesIcon className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-gray-900">Suggested Goals</h3>
        <span className="text-sm text-gray-500">Based on your job role</span>
      </div>
      
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-white rounded-lg p-3 border border-white/50 hover:border-amber-200 transition-all duration-200 cursor-pointer hover:shadow-sm"
            onClick={() => onSelectSuggestion(suggestion)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(suggestion.category)}
                <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
              </div>
              <div className="flex space-x-1">
                <span className={`status-badge ${getCategoryColor(suggestion.category)} text-xs`}>
                  {suggestion.category}
                </span>
                <span className={`status-badge ${getPriorityColor(suggestion.priority)} text-xs`}>
                  {suggestion.priority}
                </span>
              </div>
            </div>
            
            {suggestion.description && (
              <p className="text-gray-600 text-xs mb-2 line-clamp-2">{suggestion.description}</p>
            )}
            
            {suggestion.estimated_duration && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{suggestion.estimated_duration}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-amber-100">
        <p className="text-xs text-gray-500">
          💡 Click on any suggestion to auto-fill your goal form
        </p>
      </div>
    </div>
  );
};

export default GoalSuggestions;