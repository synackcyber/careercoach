import React, { useState, useEffect } from 'react';
import { SparklesIcon, ChartBarIcon, ClockIcon, AcademicCapIcon, TrophyIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const AIGoalSuggestions = ({ responsibilityId, onGoalSelect, userProfile: userProfileProp, limit = 6 }) => {
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marketTrends, setMarketTrends] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  useEffect(() => {
    if (responsibilityId) {
      fetchAISuggestions();
    }
  }, [responsibilityId]);

  const fetchAISuggestions = async () => {
    try {
      setLoading(true);
      
      // Build a user profile: prefer provided prop, fallback to a reasonable default
      const userProfile = userProfileProp || {
        current_role: 'Professional',
        experience_level: 'mid',
        industry: 'Technology',
        company_size: 'mid-size',
        learning_style: 'balanced',
        available_hours_week: 10,
        career_goals: 'Advance in current role and develop new skills',
        current_tools: '[]',
        skill_gaps: '[]'
      };
      
      const requestData = {
        user_profile: userProfile,
        responsibility_id: parseInt(responsibilityId),
        market_trends: [
          'AI/ML Engineering',
          'Cloud-Native Development',
          'DevOps Practices',
          'Security-First Approach'
        ],
        company_context: 'Modern technology company focusing on growth and innovation'
      };
      
      const response = await axios.post(`${API_BASE_URL}/ai/goal-suggestions`, requestData);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setAiSuggestions(limit ? data.slice(0, limit) : data);
      setMarketTrends(requestData.market_trends);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDays = (days) => {
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days/7)} weeks`;
    return `${Math.ceil(days/30)} months`;
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
    if (onGoalSelect) {
      onGoalSelect({
        title: suggestion.title,
        description: suggestion.personalized_description,
        priority: suggestion.priority_score > 0.7 ? 'high' : suggestion.priority_score > 0.4 ? 'medium' : 'low',
        ai_generated: true,
        learning_path: suggestion.learning_path,
        success_metrics: suggestion.success_metrics,
        estimated_days: suggestion.estimated_days,
        tags: suggestion.tags || []
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-surface-100 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          <h3 className="text-lg font-semibold text-purple-900">AI is analyzing your profile...</h3>
        </div>
        <p className="text-purple-700">
          Generating personalized goals based on market trends, your experience, and career objectives.
        </p>
      </div>
    );
  }

  if (aiSuggestions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Suggestions Available</h3>
        <p className="text-gray-600">
          Complete your profile to get personalized, market-aware goal suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-amber-700 to-accent-600 text-white rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-2">
          <SparklesIcon className="w-6 h-6" />
          <h3 className="text-lg font-semibold">AI-Powered Suggestions</h3>
        </div>
        <p className="text-purple-100">
          Personalized goals based on current market trends and your career profile
        </p>
      </div>

      {/* Market Trends */}
      {marketTrends.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Current Market Trends
          </h4>
          <div className="flex flex-wrap gap-2">
            {marketTrends.map((trend, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full"
              >
                📈 {trend}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      <div className="space-y-4">
        {aiSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
              selectedSuggestion === suggestion
                ? 'border-accent-500 bg-accent-50'
                : 'border-gray-200 hover:border-accent-300 hover:bg-surface-100'
            }`}
            onClick={() => handleSelectSuggestion(suggestion)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {suggestion.title}
                </h4>
                <p className="text-gray-700 mb-3">
                  {suggestion.personalized_description}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedSuggestion === suggestion
                    ? 'border-accent-500 bg-accent-500'
                    : 'border-gray-300'
                }`}>
                  {selectedSuggestion === suggestion && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Scores */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(suggestion.market_relevance_score)}`}>
                  📈 {Math.round(suggestion.market_relevance_score * 100)}%
                </div>
                <p className="text-xs text-gray-600 mt-1">Market Relevance</p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(1 - suggestion.difficulty_score)}`}>
                  🎯 {Math.round((1 - suggestion.difficulty_score) * 100)}%
                </div>
                <p className="text-xs text-gray-600 mt-1">Achievability</p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(suggestion.priority_score)}`}>
                  ⚡ {Math.round(suggestion.priority_score * 100)}%
                </div>
                <p className="text-xs text-gray-600 mt-1">Career Impact</p>
              </div>
            </div>

            {/* Learning Path Preview */}
            {suggestion.learning_path && suggestion.learning_path.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                  <AcademicCapIcon className="w-4 h-4 mr-1" />
                  AI-Generated Learning Path
                </h5>
                <div className="bg-white rounded-lg p-3 border">
                  <ol className="text-sm text-gray-700 space-y-1">
                    {suggestion.learning_path.slice(0, 3).map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start">
                        <span className="text-purple-600 font-medium mr-2">{stepIndex + 1}.</span>
                        {step}
                      </li>
                    ))}
                    {suggestion.learning_path.length > 3 && (
                      <li className="text-gray-500 italic">
                        +{suggestion.learning_path.length - 3} more steps...
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            )}

            {/* Real-world Scenarios */}
            {suggestion.real_world_scenarios && suggestion.real_world_scenarios.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                  <TrophyIcon className="w-4 h-4 mr-1" />
                  Real-World Applications
                </h5>
                <div className="space-y-2">
                  {suggestion.real_world_scenarios.map((scenario, scenarioIndex) => (
                    <div key={scenarioIndex} className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                      <p className="text-sm text-amber-800">💼 {scenario}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Info */}
            <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {formatDays(suggestion.estimated_days)}
                </span>
                {suggestion.certification_path && (
                  <span className="text-blue-600">
                    🏆 {suggestion.certification_path}
                  </span>
                )}
              </div>
              <div className="text-purple-600 font-medium">
                AI Confidence: {Math.round((suggestion.market_relevance_score + suggestion.priority_score) / 2 * 100)}%
              </div>
            </div>

            {/* Career Impact */}
            {suggestion.career_impact && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <p className="text-sm text-green-800">
                  <strong>Career Impact:</strong> {suggestion.career_impact}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIGoalSuggestions;