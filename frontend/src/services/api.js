import axios from 'axios';
import { getAccessToken, onAuthStateChange, supabase } from '../supabase/authClient';

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

// Cache bearer token and update via auth events for reliability
let bearerToken = null;
try { supabase?.auth?.getSession?.().then(({ data }) => { bearerToken = data?.session?.access_token || null; }); } catch (_) {}
try { onAuthStateChange?.((session) => { bearerToken = session?.access_token || null; }); } catch (_) {}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token management
let csrfToken = null;

// Get CSRF token from server
const getCSRFToken = async () => {
  if (csrfToken) return csrfToken;
  
  try {
    const response = await axios.get(`${API_BASE_URL}/csrf-token`);
    csrfToken = response.data.csrf_token;
    return csrfToken;
  } catch (error) {
    console.warn('[api] failed to get CSRF token', error);
    return null;
  }
};

// Attach Authorization header and CSRF token if user is logged in
api.interceptors.request.use(async (config) => {
  try {
    // Prefer cached token; fallback to quick lookup
    let token = bearerToken;
    if (!token) {
      token = await Promise.race([
        getAccessToken(),
        new Promise((resolve) => setTimeout(() => resolve(null), 500)),
      ]);
      if (token) bearerToken = token;
    }
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      
      // Add CSRF token for state-changing operations
      if (config.method && config.method.toLowerCase() !== 'get' && config.method.toLowerCase() !== 'head') {
        const csrf = await getCSRFToken();
        if (csrf) {
          config.headers['X-CSRF-Token'] = csrf;
        }
      }
    }
  } catch (e) {
    try { console.warn('[api] failed to get token', e); } catch (_) {}
  }
  try { console.debug('[api] request', config.method?.toUpperCase(), config.baseURL + (config.url || '')); } catch (_) {}
  return config;
});

// Log responses and handle CSRF token refresh
api.interceptors.response.use(
  (response) => {
    try { console.debug('[api] response', response.status, response.config.method?.toUpperCase(), response.config.baseURL + (response.config.url || '')); } catch (_) {}
    return response;
  },
  async (error) => {
    try {
      const { response, config } = error || {};
      console.error('[api] error', response?.status, config?.method?.toUpperCase(), (config?.baseURL || '') + (config?.url || ''), response?.data || error?.message);
      
      // Handle CSRF token expiration
      if (response?.status === 403 && response?.data?.error?.includes('CSRF')) {
        // Clear cached CSRF token and retry once
        csrfToken = null;
        if (!config._retried) {
          config._retried = true;
          return api(config);
        }
      }
    } catch (_) {}
    return Promise.reject(error);
  }
);

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
  create: (data) =>
    api.post('/goals', data).then((response) => {
      try { window.dispatchEvent(new Event('goals:changed')); } catch (_) {}
      return response;
    }),
  update: (id, data) =>
    api.put(`/goals/${id}`, data).then((response) => {
      try { window.dispatchEvent(new Event('goals:changed')); } catch (_) {}
      return response;
    }),
  delete: (id) =>
    api.delete(`/goals/${id}`).then((response) => {
      try { window.dispatchEvent(new Event('goals:changed')); } catch (_) {}
      return response;
    }),
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
  refineSMART: (data) => api.post('/ai/refine-smart', data),
  milestones: (data) => api.post('/ai/milestones', data),
};

export default api;