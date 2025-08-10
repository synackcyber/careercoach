import { useState, useEffect } from 'react';
import { jobRoleApi } from '../services/api';

export const useJobRoles = () => {
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobRoles = async () => {
    try {
      setLoading(true);
      const response = await jobRoleApi.getAll();
      setJobRoles(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch job roles');
      console.error('Error fetching job roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobRoles();
  }, []);

  return {
    jobRoles,
    loading,
    error,
    refetch: fetchJobRoles
  };
};