import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

export const useGoalSuggestions = (responsibilityId, category = '') => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuggestions = async () => {
    if (!responsibilityId) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const params = { responsibility_id: responsibilityId };
      if (category) {
        params.category = category;
      }
      
      const response = await axios.get(`${API_BASE_URL}/suggestions`, { params });
      setSuggestions(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch goal suggestions');
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [responsibilityId, category]);

  return {
    suggestions,
    loading,
    error,
    refetch: fetchSuggestions
  };
};