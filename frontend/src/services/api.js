import axios from 'axios';
import { getAccessToken } from '../supabase/authClient';

let API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';
try {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const port = window.location.port;
    // Force direct backend in local dev to avoid proxy issues
    if ((host === 'localhost' || host === '127.0.0.1') && port === '3000') {
      API_BASE_URL = 'http://localhost:8080/api/v1';
    }
  }
} catch (_) {}

// Debug: log base URL in development
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  try { console.debug('[api] baseURL =', API_BASE_URL); } catch (_) {}
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
    try { console.warn('[api] failed to get token', e); } catch (_) {}
  }
  try { console.debug('[api] request', config.method?.toUpperCase(), config.baseURL + (config.url || '')); } catch (_) {}
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