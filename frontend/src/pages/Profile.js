import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userProfileApi } from '../services/api';
import PageTitle from '../components/PageTitle';

const experienceOptions = [
  { value: 'entry', label: '0-2 years', description: 'Just getting started' },
  { value: 'junior', label: '2-5 years', description: 'Building experience' },
  { value: 'mid', label: '5-10 years', description: 'Established professional' },
  { value: 'senior', label: '10+ years', description: 'Seasoned expert' }
];

const industryOptions = [
  { value: 'Technology', label: 'Technology', icon: '💻' },
  { value: 'Healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'Finance', label: 'Finance', icon: '💰' },
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Manufacturing', label: 'Manufacturing', icon: '🏭' },
  { value: 'Consulting', label: 'Consulting', icon: '💼' }
];

export default function Profile() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [profile, setProfile] = useState({
    current_role: '',
    experience_level: '',
    industry: 'Technology'
  });

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await userProfileApi.getOrCreate();
        const p = result?.data?.data || {};
        setProfile({
          current_role: p.current_role || '',
          experience_level: p.experience_level || '',
          industry: p.industry || 'Technology'
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Autosave with debouncing
  useEffect(() => {
    if (!profile.current_role || !profile.experience_level) return;
    
    const timer = setTimeout(async () => {
      try {
        setSaving(true);
        setSaveStatus('saving');
        
        // Get or create profile first
        const result = await userProfileApi.getOrCreate();
        const profileId = result?.data?.data?.id;
        
        if (profileId) {
          await userProfileApi.update(profileId, {
            current_role: profile.current_role,
            experience_level: profile.experience_level,
            industry: profile.industry
          });
          setSaveStatus('saved');
          
          // Clear saved status after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch (error) {
        console.error('Failed to save profile:', error);
        setSaveStatus('error');
      } finally {
        setSaving(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [profile.current_role, profile.experience_level, profile.industry]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete - redirect to dashboard
      window.location.hash = '#/';
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return profile.current_role.trim().length > 0;
      case 2: return profile.experience_level;
      case 3: return true; // Advanced step is optional
      default: return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "What do you do?";
      case 2: return "How long have you been doing it?";
      case 3: return "Tell us more (optional)";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "This helps us suggest goals that match your role";
      case 2: return "We'll tailor suggestions to your experience level";
      case 3: return "Add details to get more personalized goal suggestions";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-zinc-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <div className="w-full px-6 pt-8 pb-6">
        <PageTitle className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 text-center">
          Profile
        </PageTitle>
      </div>

      {/* Progress indicator */}
      <div className="w-full max-w-md mx-auto px-6 mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                step < currentStep 
                  ? 'bg-accent-500 text-white' 
                  : step === currentStep 
                    ? 'bg-accent-600 text-white ring-4 ring-accent-200' 
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400'
              }`}>
                {step < currentStep ? '✓' : step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-1 mx-2 transition-all duration-300 ${
                  step < currentStep ? 'bg-accent-500' : 'bg-gray-200 dark:bg-zinc-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8"
          >
            {/* Step header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                {getStepTitle()}
              </h2>
              <p className="text-gray-600 dark:text-zinc-400">
                {getStepDescription()}
              </p>
            </div>

            {/* Step content */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                    Your current or desired role
                  </label>
                  <input
                    type="text"
                    value={profile.current_role}
                    onChange={(e) => setProfile({ ...profile, current_role: e.target.value })}
                    placeholder="e.g., Software Engineer, DevOps Engineer, Product Manager..."
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 placeholder-gray-400 dark:placeholder-zinc-500"
                    autoFocus
                  />
                </div>
                
                {/* Save status */}
                {saveStatus === 'saving' && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-zinc-400">
                    <div className="animate-spin w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Save failed
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {experienceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfile({ ...profile, experience_level: option.value })}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                        profile.experience_level === option.value
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 ring-2 ring-accent-200 dark:ring-accent-700/50'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-accent-300 dark:hover:border-accent-600 hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                    Industry (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {industryOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProfile({ ...profile, industry: option.value })}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 ${
                          profile.industry === option.value
                            ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 ring-2 ring-accent-200 dark:ring-accent-700/50'
                            : 'border-gray-200 dark:border-zinc-700 hover:border-accent-300 dark:hover:border-accent-600 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="text-center text-sm text-gray-600 dark:text-zinc-400">
                  You can always update these details later in your profile settings
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentStep === 1
                    ? 'text-gray-400 dark:text-zinc-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  canProceed()
                    ? 'bg-accent-600 hover:bg-accent-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                {currentStep === 3 ? 'Complete' : 'Next'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
