import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addToOfflineQueue } from '../redux/slices/offlineSlice';

const API_BASE_URL = 'https://api.bodhasurvey.duckdns.org/v1';

// Store reference injection to avoid circular dependency
let reduxStore = null;
export const injectStore = (store) => {
  reduxStore = store;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add Auth Token
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check Offline Status
    const netState = await NetInfo.fetch();
    const isOffline = !(netState.isConnected && netState.isInternetReachable !== false);

    if (isOffline) {
      config.adapter = async (cfg) => {
        return new Promise(async (resolve, reject) => {
          const { url, method, data, params } = cfg;

          if (method.toLowerCase() === 'get') {
            // Try to read from cache
            try {
              const cacheKey = `API_CACHE_${url}_${JSON.stringify(params || {})}`;
              const cachedData = await AsyncStorage.getItem(cacheKey);

              if (cachedData) {
                console.log(`[Offline] Serving cached data for ${url}`);
                resolve({
                  data: JSON.parse(cachedData),
                  status: 200,
                  statusText: 'OK',
                  headers: {},
                  config: cfg,
                  request: {}
                });
              } else {
                reject({ message: 'No internet connection and no cached data available.' });
              }
            } catch (e) {
              reject(e);
            }
          } else {
            // Write operation: Queue it
            console.log(`[Offline] Queuing request for ${url}`);

            if (reduxStore) {
              reduxStore.dispatch(addToOfflineQueue({
                url,
                method,
                data,
                params
              }));
            }

            // Return a success mock
            resolve({
              data: { message: 'Saved locally. Will sync when online.', _offline: true },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: cfg,
              request: {}
            });
          }
        });
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  async (response) => {
    // Cache GET requests
    if (response.config.method.toLowerCase() === 'get') {
      try {
        const { url, params } = response.config;
        const cacheKey = `API_CACHE_${url}_${JSON.stringify(params || {})}`;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
      } catch (e) {
        console.warn('Failed to cache response', e);
      }
    }
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      // Navigate to login handled by App state usually
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
