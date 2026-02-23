import axios from 'axios';

// Dynamic API URL for LAN access
const getBaseUrl = (port) => {
  const hostname = window.location.hostname;
  return `http://${hostname}:${port}`;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || getBaseUrl(3000);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for offline queue
const addToOfflineQueue = (config) => {
  const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
  queue.push({
    id: Date.now(),
    url: config.url,
    method: config.method,
    data: config.data,
    params: config.params,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('offline_queue', JSON.stringify(queue));
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!navigator.onLine) {
      // Offline handling
      if (config.method.toLowerCase() === 'get') {
        const cacheKey = `API_CACHE_${config.url}_${JSON.stringify(config.params || {})}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          // Return cached response via adapter
          config.adapter = () => {
            return Promise.resolve({
              data: JSON.parse(cached),
              status: 200,
              statusText: 'OK',
              headers: {},
              config: config,
              request: {}
            });
          };
        }
      } else {
        // Queue write operations
        addToOfflineQueue(config);
        // Return fake success
        config.adapter = () => {
          return Promise.resolve({
            data: { success: true, message: 'Saved offline', _offline: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config,
            request: {}
          });
        };
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Cache GET requests
    if (response.config.method.toLowerCase() === 'get') {
      try {
        const cacheKey = `api_cache_${response.config.url}_${JSON.stringify(response.config.params || {})}`;
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
      } catch (e) {
        console.warn('Cache failed', e);
      }
    }
    return response.data;
  },
  (error) => {
    const originalRequest = error.config;

    // Check for offline/network error on a GET request
    const isNetworkError = !navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK';
    if (isNetworkError && originalRequest?.method?.toLowerCase() === 'get') {
      const cacheKey = `api_cache_${originalRequest.url}_${JSON.stringify(originalRequest.params || {})}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        console.warn(`[API Cache] Returning cached data for: ${originalRequest.url}`);
        return JSON.parse(cachedData);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Sync Logic
export const syncOfflineQueue = async () => {
  if (!navigator.onLine) return;

  const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
  if (queue.length === 0) return;

  console.log(`Syncing ${queue.length} items...`);
  const newQueue = [];

  for (const item of queue) {
    try {
      // Use a clean axios instance to bypass interceptors (or just make sure we don't double queue)
      // Actually, if we use 'api', the interceptor checks navigator.onLine. If true, it proceeds.
      await api.request({
        method: item.method,
        url: item.url,
        data: item.data,
        params: item.params
      });
      console.log(`Synced ${item.url}`);
    } catch (e) {
      console.error(`Sync failed for ${item.url}`, e);
      // Keep in queue if it's a network error? 
      // For now, removing to prevent block, or implement retry count.
      // Let's keep it if network error, remove if 4xx.
      if (!e.response) { // Network error likely
        newQueue.push(item);
      }
    }
  }

  localStorage.setItem('offline_queue', JSON.stringify(newQueue));
  if (queue.length > 0 && newQueue.length === 0) {
    // All synced
    // Optionally trigger a UI refresh or alert?
    console.log('Sync Complete');
  }
};

// Listen for online
window.addEventListener('online', syncOfflineQueue);


// User Service APIs
export const userAPI = {
  register: (data) => api.post('/users/register', data),
  msrRegister: (data) => api.post('/users/msr-register', data),
  // Login through API Gateway
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateProfileById: (id, data) => api.put(`/users/profile/${id}`, data),
  getUsers: () => api.get('/users'),
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
  unpublish: (id) => api.post(`/surveys/${id}/unpublish`),
  getPublished: () => api.get('/surveys', { params: { status: 'Published' } }),
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
  // New hierarchy support
  getHierarchyParliaments: () => api.get('/parl-cons/hierarchy/parliaments'),
  getAssemblies: (parl) => api.get(`/parl-cons/hierarchy/assemblies/${parl}`),
  getMandals: (parl, assembly) => api.get(`/parl-cons/hierarchy/mandals/${parl}/${assembly}`),
};

export default api;
