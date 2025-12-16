import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';

// Async thunks
export const fetchDashboard = createAsyncThunk(
  'analytics/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSurveyAnalytics = createAsyncThunk(
  'analytics/fetchSurveyAnalytics',
  async (surveyId, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getSurveyAnalytics(surveyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createCustomReport = createAsyncThunk(
  'analytics/createCustomReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.createCustomReport(reportData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    dashboard: null,
    surveyAnalytics: null,
    customReports: [],
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch survey analytics
      .addCase(fetchSurveyAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSurveyAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.surveyAnalytics = action.payload;
      })
      .addCase(fetchSurveyAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create custom report
      .addCase(createCustomReport.fulfilled, (state, action) => {
        state.customReports.push(action.payload);
      });
  }
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
