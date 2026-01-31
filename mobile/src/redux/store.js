import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import surveyReducer from './slices/surveySlice';
import analyticsReducer from './slices/analyticsSlice';
import offlineReducer from './slices/offlineSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    survey: surveyReducer,
    analytics: analyticsReducer,
    offline: offlineReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
