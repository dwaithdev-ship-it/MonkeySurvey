import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // API Gateway

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// User Service APIs
export const userAPI = {
  register: (data) => api.post('/users/register', data),
  msrRegister: (data) => api.post('/users/msr-register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getMSRUsers: () => api.get('/users/msr-users'),
  createMSRUser: (data) => api.post('/users/msr-users', data),
  updateMSRUser: (id, data) => api.put(`/users/msr-users/${id}`, data),
  updateMSRStatus: (id, isActive) => api.patch(`/users/msr-users/${id}/status`, { isActive }),
  updateMSRPassword: (id, password) => api.patch(`/users/msr-users/${id}/password`, { password }),
};

// Survey Service APIs
export const surveyAPI = {
  getAll: (params) => api.get('/surveys', { params }),
  getById: (id) => api.get(`/surveys/${id}`),
  create: (data) => api.post('/surveys', data),
  update: (id, data) => api.put(`/surveys/${id}`, data),
  delete: (id) => api.delete(`/surveys/${id}`),
  publish: (id) => api.post(`/surveys/${id}/publish`),
  getTemplates: (params) => api.get('/surveys/templates', { params }),
};

// Response Service APIs
export const responseAPI = {
  submit: (data) => api.post('/responses', data),
  savePartial: (data) => api.post('/responses/partial', data),
  getAll: (params) => api.get('/responses', { params }),
};

// ParlCons APIs (hosted on survey service)
export const parlConsAPI = {
  getParliaments: () => api.get('/parl-cons/parliaments'),
  getMunicipalities: (parlName) => api.get(`/parl-cons/municipalities/${parlName}`),
};

export default api;
