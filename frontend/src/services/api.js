import axios from 'axios';
import { getAccessToken } from '../supabase/authClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if user is logged in
api.interceptors.request.use(async (config) => {
  try {
    const token = await getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Core API endpoints
export const jobRoleApi = {
  getAll: () => api.get('/job-roles'),
  getById: (id) => api.get(`/job-roles/${id}`),
  create: (data) => api.post('/job-roles', data),
};

export const responsibilityApi = {
  getAll: () => api.get('/responsibilities'),
  getByJobRole: (jobRoleId) => api.get(`/responsibilities/job-role/${jobRoleId}`),
  getById: (id) => api.get(`/responsibilities/${id}`),
};

export const goalApi = {
  getAll: (params = {}) => api.get('/goals', { params }),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const progressApi = {
  getByGoalId: (goalId) => api.get(`/goals/${goalId}/progress`),
  create: (goalId, data) => api.post(`/goals/${goalId}/progress`, data),
  update: (id, data) => api.put(`/progress/${id}`, data),
  delete: (id) => api.delete(`/progress/${id}`),
};

export const goalSuggestionApi = {
  getAll: () => api.get('/goal-suggestions'),
  getByResponsibility: (responsibilityId) => api.get(`/goal-suggestions/for-responsibility/${responsibilityId}`),
};

export const progressSuggestionApi = {
  getByGoal: (goalId) => api.get(`/progress-suggestions/for-goal/${goalId}`),
};

export const userProfileApi = {
  getOrCreate: () => api.get('/profiles/me'),
  create: (data) => api.post('/profiles', data),
  getById: (id) => api.get(`/profiles/${id}`),
  update: (id, data) => api.put(`/profiles/${id}`, data),
};

export const aiApi = {
  generateGoalSuggestions: (data) => api.post('/ai/goal-suggestions', data),
};

export default api;