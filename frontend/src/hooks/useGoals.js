import { useState, useEffect } from 'react';
import { goalApi } from '../services/api';
import { getAccessToken, onAuthStateChange } from '../supabase/authClient';

export const useGoals = (filters = {}) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false); // Prevent duplicate requests
  const [initialized, setInitialized] = useState(false); // First-load guard to prevent empty-state flash

  const fetchGoals = async () => {
    // Prevent duplicate requests
    if (isFetching) {
      try { console.debug('[goals] already fetching, skipping duplicate request'); } catch (_) {}
      return;
    }

    try {
      // Check if user is authenticated before making the API call
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return; // Don't fetch if not authenticated
      }

      setIsFetching(true);
      setLoading(true);
      try { console.debug('[goals] fetching with filters =', filters); } catch (_) {}
      const response = await goalApi.getAll(filters);
      try { console.debug('[goals] response items =', Array.isArray(response?.data?.data) ? response.data.data.length : 'n/a'); } catch (_) {}
      if (!response?.data?.data) {
        throw new Error('Empty goals response');
      }
      setGoals(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch goals');
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
      try { console.debug('[goals] loading = false'); } catch (_) {}
      // Mark first load attempt as complete (success or fail)
      setInitialized(true);
    }
  };

  const createGoal = async (goalData) => {
    try {
      const response = await goalApi.create(goalData);
      setGoals(prev => [...prev, response.data.data]);
      return response.data.data;
    } catch (err) {
      setError('Failed to create goal');
      throw err;
    }
  };

  const updateGoal = async (id, goalData) => {
    try {
      const response = await goalApi.update(id, goalData);
      setGoals(prev => prev.map(goal => 
        goal.id === id ? response.data.data : goal
      ));
      return response.data.data;
    } catch (err) {
      setError('Failed to update goal');
      throw err;
    }
  };

  const deleteGoal = async (id) => {
    try {
      await goalApi.delete(id);
      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (err) {
      setError('Failed to delete goal');
      throw err;
    }
  };

  // Debounce function to prevent rapid successive calls
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Debounced fetch to prevent rapid successive calls
  const debouncedFetch = debounce(fetchGoals, 300);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const token = await getAccessToken();
      if (token) {
        setLoading(true);
        fetchGoals();
      } else {
        setLoading(false);
      }
      // Do not mark initialized here. We wait until the first fetch attempt completes
    };
    checkAuthAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  // Refetch when auth session changes (e.g., after magic link completes)
  useEffect(() => {
    const sub = onAuthStateChange(async (session) => {
      if (session) {
        // Use debounced fetch to prevent rapid successive calls
        debouncedFetch();
      }
    });
    return () => sub?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when any component dispatches a global goals change event
  useEffect(() => {
    const handler = () => {
      debouncedFetch();
    };
    try { window.addEventListener('goals:changed', handler); } catch (_) {}
    return () => {
      try { window.removeEventListener('goals:changed', handler); } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    goals,
    loading,
    error,
    initialized,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal
  };
};