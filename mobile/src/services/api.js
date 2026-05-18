import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addToOfflineQueue } from '../redux/slices/offlineSlice';

// ─── PRODUCTION CONFIG ─────────────────────────────────────────────────────
// Primary: LAN API Gateway (running locally, reachable by all devices on same WiFi)
// The production cloud server (bodhasurvey.duckdns.org) is currently OFFLINE.
// When cloud server is back online, change this to: 'https://bodhasurvey.duckdns.org/api'
const API_BASE_URL = 'http://192.168.29.108:3000';

// ─── STARTUP LOG ───────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════');
console.log('[API] BASE URL:', API_BASE_URL);
console.log('[API] Test connectivity at:', API_BASE_URL + '/test');
console.log('═══════════════════════════════════════════');

// Store reference injection to avoid circular dependency
let reduxStore = null;
export const injectStore = (store) => {
  reduxStore = store;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,  // 15 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // ── Deep Debug Logging ──────────────────────────────────────────────────
    const fullUrl = `${config.baseURL || API_BASE_URL}${config.url}`;
    console.log('────────────────────────────────────────');
    console.log('[API REQUEST]', config.method?.toUpperCase(), fullUrl);
    if (config.data) {
      const safeData = { ...config.data };
      if (safeData.password) safeData.password = '[HIDDEN]';
      console.log('[API PAYLOAD]', JSON.stringify(safeData));
    }
    console.log('────────────────────────────────────────');

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
    // ── Deep Debug: Log success response ───────────────────────────────────
    console.log('[API RESPONSE]', response.status, response.config?.url);
    console.log('[API RESPONSE BODY]', JSON.stringify(response.data)?.substring(0, 300));

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
    // ── Deep Debug: Log full error ─────────────────────────────────────────
    console.log('════════════════ API ERROR ════════════════');
    console.log('[API ERROR] URL:', error.config?.url);
    console.log('[API ERROR] Method:', error.config?.method?.toUpperCase());
    console.log('[API ERROR] Code:', error.code);
    console.log('[API ERROR] Message:', error.message);
    if (error.response) {
      console.log('[API ERROR] Status:', error.response.status);
      console.log('[API ERROR] Response Body:', JSON.stringify(error.response.data));
    } else {
      console.log('[API ERROR] No response — server unreachable or network blocked');
      console.log('[API ERROR] Is this a network timeout? Check if server is on same WiFi');
    }
    console.log('═══════════════════════════════════════════');

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// User API
export const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  msrRegister: (userData) => {
    console.log('[userAPI.msrRegister] Calling POST /users/msr-register');
    console.log('[userAPI.msrRegister] Base URL:', API_BASE_URL);
    return api.post('/users/msr-register', userData);
  },
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
