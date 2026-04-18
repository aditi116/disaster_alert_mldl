import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// Alert API
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (alertData) => api.post('/alerts', alertData),
  updateStatus: (id, status) => api.patch(`/alerts/${id}/status`, null, { params: { status } }),
  delete: (id) => api.delete(`/alerts/${id}`),
  vote: (id, isUpvote) => api.post(`/alerts/${id}/vote`, { isUpvote }),
  getVotes: (id) => api.get(`/alerts/${id}/votes`),
};

// Resource API
export const resourceAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
  create: (resourceData) => api.post('/resources', resourceData),
  updateStatus: (id, status) => api.patch(`/resources/${id}/status`, null, { params: { status } }),
  delete: (id) => api.delete(`/resources/${id}`),
};

export default api;
