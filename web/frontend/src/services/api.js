
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
  list: () => api.get('/users')
};

export const surveys = {
  list: (params) => api.get('/surveys', { params }),
  get: (id) => api.get(`/surveys/${id}`),
  getById: (id) => api.get(`/surveys/${id}`), // Added for compatibility
  create: (data) => api.post('/surveys', data),
  update: (id, data) => api.put(`/surveys/${id}`, data),
  delete: (id) => api.delete(`/surveys/${id}`),
  publish: (id) => api.post(`/surveys/${id}/publish`)
};

export const responses = {
  submit: (data) => api.post('/responses', data),
  list: (params) => api.get('/responses', { params }),
  getAll: (params) => api.get('/responses', { params }) // Added for compatibility
};

export const parlConsAPI = {
  getParliaments: () => api.get('/parl-cons/parliaments'),
  getMunicipalities: (parlName) => api.get(`/parl-cons/municipalities/${parlName}`),
};

export const ai = {
  generate: (data) => api.post('/ai/generate', data)
};

// Aliases for compatibility with other components if needed
export const surveyAPI = surveys;
export const responseAPI = responses;

export default api;
