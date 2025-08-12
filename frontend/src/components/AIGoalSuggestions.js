import React, { useState, useEffect } from 'react';
import { SparklesIcon, ChartBarIcon, ClockIcon, AcademicCapIcon, TrophyIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const synthesizeFallback = ({ userProfile, responsibilityTitle = 'Core Responsibility', limit = 6 }) => {
  const role = userProfile?.current_role || 'Professional';
  const industry = userProfile?.industry || 'Technology';
  const exp = userProfile?.experience_level || 'mid';
  const tools = (() => {
    try { const t = JSON.parse(userProfile?.current_tools || '[]'); return Array.isArray(t) ? t.slice(0, 3) : []; } catch { return []; }
  })();
  const baseTags = [industry, role, ...tools].filter(Boolean);
  const presets = [
    {
      title: `Improve ${responsibilityTitle} outcomes in ${industry}`,
      days: exp === 'entry' || exp === 'junior' ? 30 : 21,
      desc: `Deliver measurable progress on ${responsibilityTitle} using ${tools.join(', ') || 'standard practices'}. Focus on quick wins aligned to your ${role} role.`
    },
    {
      title: `Create a 30/60/90 plan for ${responsibilityTitle}`,
      days: 60,
      desc: `Draft and execute a 30/60/90 plan to accelerate impact in ${responsibilityTitle}. Align with team priorities and stakeholder expectations.`
    },
    {
      title: `Document and standardize ${responsibilityTitle} process`,
      days: 21,
      desc: `Map current workflow, identify 3 bottlenecks, and propose improvements. Publish a short SOP and share with your team.`
    },
    {
      title: `Ship a small project demonstrating ${responsibilityTitle}`,
      days: 30,
      desc: `Select a contained use case, implement it end-to-end, and publish a short demo/readme that highlights outcomes.`
    },
    {
      title: `Measure and report ${responsibilityTitle} metrics`,
      days: 21,
      desc: `Define 2–3 leading indicators and set up a simple dashboard. Share weekly updates and drive one improvement per week.`
    },
    {
      title: `Upskill on ${responsibilityTitle} tools${tools.length ? ' ('+tools.join(', ')+')' : ''}`,
      days: 14,
      desc: `Complete one focused course or hands-on tutorial and apply learnings to a task at work. Capture notes and next steps.`
    }
  ];
  return presets.slice(0, limit).map(p => ({
    title: p.title,
    personalized_description: p.desc,
    learning_path: [
      'Define scope and success criteria',
      'Do a quick research pass and pick an approach',
      'Execute a focused iteration',
      'Share outcome and collect feedback'
    ],
    real_world_scenarios: [`Apply in a ${industry} context`, `Demonstrate value as a ${role}`],
    market_relevance_score: 0.7,
    difficulty_score: exp === 'entry' || exp === 'junior' ? 0.4 : 0.6,
    priority_score: 0.6,
    estimated_days: p.days,
    prerequisites: [],
    success_metrics: ['Show measurable improvement', 'Stakeholder feedback ≥ 4/5'],
    certification_path: '',
    career_impact: `Strengthens your ${responsibilityTitle} competency for ${role} roles in ${industry}.`,
    tags: baseTags,
  }));
};

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
      
      let data = [];
      try {
        const response = await axios.post(`${API_BASE_URL}/ai/goal-suggestions`, requestData);
        data = Array.isArray(response.data?.data) ? response.data.data : [];
      } catch (e) {
        // Ignore API error; fallback below
      }
      
      if (!data.length) {
        // Fallback: synthesize client-side suggestions
        const responsibilityTitle = 'Role Responsibility';
        const fallback = synthesizeFallback({ userProfile, responsibilityTitle, limit });
        setAiSuggestions(fallback);
        setMarketTrends(requestData.market_trends);
        return;
      }
      
      setAiSuggestions(limit ? data.slice(0, limit) : data);
      setMarketTrends(requestData.market_trends);
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
        priority: suggestion.priority || (suggestion.priority_score > 0.7 ? 'high' : suggestion.priority_score > 0.4 ? 'medium' : 'low'),
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

  // If we reached here, we either have API or fallback suggestions
  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-amber-700 to-accent-600 text-white rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-2">
          <SparklesIcon className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Personalized Suggestions</h3>
        </div>
        <p className="text-purple-100">
          Goals tailored to your profile and role context
        </p>
      </div>

      {marketTrends.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Current Market Trends
          </h4>
          <div className="flex flex-wrap gap-2">
            {marketTrends.map((trend, index) => (
              <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">📈 {trend}</span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {aiSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
              selectedSuggestion === suggestion ? 'border-accent-500 bg-accent-50' : 'border-gray-200 hover:border-accent-300 hover:bg-surface-100'
            }`}
            onClick={() => handleSelectSuggestion(suggestion)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{suggestion.title}</h4>
                <p className="text-gray-700 mb-3">{suggestion.personalized_description}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedSuggestion === suggestion ? 'border-accent-500 bg-accent-500' : 'border-gray-300'
                }`}>
                  {selectedSuggestion === suggestion && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-200">
              <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-1" />{formatDays(suggestion.estimated_days)}</span>
              <span className="text-purple-600 font-medium">Tap to use this goal</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIGoalSuggestions;
export default AIGoalSuggestions;