import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.monkeysurvey.com/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      await AsyncStorage.removeItem('authToken');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

// User API
export const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data)
};

// Survey API
export const surveyAPI = {
  createSurvey: (surveyData) => api.post('/surveys', surveyData),
  getSurveys: (params) => api.get('/surveys', { params }),
  getSurveyById: (surveyId) => api.get(`/surveys/${surveyId}`),
  updateSurvey: (surveyId, data) => api.put(`/surveys/${surveyId}`, data),
  deleteSurvey: (surveyId) => api.delete(`/surveys/${surveyId}`),
  publishSurvey: (surveyId) => api.post(`/surveys/${surveyId}/publish`),
  getTemplates: (params) => api.get('/surveys/templates', { params })
};

// Response API
export const responseAPI = {
  submitResponse: (responseData) => api.post('/responses', responseData),
  savePartialResponse: (responseData) => api.post('/responses/partial', responseData),
  getResponses: (params) => api.get('/responses', { params })
};

// Analytics API
export const analyticsAPI = {
  getSurveyAnalytics: (surveyId) => api.get(`/analytics/surveys/${surveyId}`),
  getQuestionAnalytics: (questionId) => api.get(`/analytics/questions/${questionId}`),
  createCustomReport: (reportData) => api.post('/analytics/reports/custom', reportData),
  exportData: (exportConfig) => api.post('/analytics/export', exportConfig),
  getDashboard: () => api.get('/analytics/dashboard')
};

// Notification API
export const notificationAPI = {
  sendInvitation: (inviteData) => api.post('/notifications/invite', inviteData),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (settings) => api.put('/notifications/settings', settings)
};

export default api;
