import React from 'react';
import { 
  CogIcon, 
  SparklesIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const AISettings = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CogIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircleIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Current AI Provider */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active AI Provider</h3>
            <div className="border-2 rounded-lg p-4 border-green-200 bg-green-50">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">Rule-Based AI (Active)</h4>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Intelligent algorithmic goal generation. Always available, no API key needed.
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600 font-medium">Cost: Free</span>
                <span className="text-green-700 font-medium">Quality: Good</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="px-2 py-1 bg-green-100 text-xs text-green-800 rounded">
                  Fast response
                </span>
                <span className="px-2 py-1 bg-green-100 text-xs text-green-800 rounded">
                  Privacy-focused
                </span>
                <span className="px-2 py-1 bg-green-100 text-xs text-green-800 rounded">
                  No external dependencies
                </span>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">About Rule-Based AI</p>
                <p>
                  This goal tracker uses sophisticated algorithms to generate personalized goal suggestions 
                  based on your job role, responsibilities, and career preferences. It provides intelligent 
                  recommendations without requiring external AI services.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Features</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-medium text-gray-900">Personalized Goal Suggestions</span>
                  <p className="text-sm text-gray-600">Tailored recommendations based on your role and experience</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-medium text-gray-900">Learning Path Generation</span>
                  <p className="text-sm text-gray-600">Step-by-step guidance for achieving your goals</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-medium text-gray-900">Market-Aware Suggestions</span>
                  <p className="text-sm text-gray-600">Goals aligned with current industry trends</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Active Provider:</strong> Rule-Based AI (Default)</p>
              <p><strong>Status:</strong> ✅ Operational</p>
              <p><strong>Privacy:</strong> ✅ No data sent to external services</p>
              <p><strong>Cost:</strong> ✅ Completely free</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings;