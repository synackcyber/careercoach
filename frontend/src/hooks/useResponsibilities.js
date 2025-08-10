import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

export const useResponsibilities = (jobRoleId, category = '') => {
  const [responsibilities, setResponsibilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResponsibilities = async () => {
    if (!jobRoleId) {
      setResponsibilities([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const params = { job_role_id: jobRoleId };
      if (category) {
        params.category = category;
      }
      
      const response = await axios.get(`${API_BASE_URL}/responsibilities`, { params });
      setResponsibilities(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch responsibilities');
      console.error('Error fetching responsibilities:', err);
      setResponsibilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponsibilities();
  }, [jobRoleId, category]);

  return {
    responsibilities,
    loading,
    error,
    refetch: fetchResponsibilities
  };
};