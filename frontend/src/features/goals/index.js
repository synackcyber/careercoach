// Goals feature barrel export
// This file will export all goal-related components, hooks, and services

export { default as GoalCard } from './components/GoalCard';
export { default as GoalForm } from './components/GoalForm';
export { default as SimpleGoalForm } from './components/SimpleGoalForm';
export { useGoals } from './hooks/useGoals';
export { goalApi } from './services/goalApi';

// Feature boundaries - other features should import from this index
// Example: import { GoalCard, useGoals } from '../features/goals';