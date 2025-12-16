import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { surveyAPI } from '../../services/api';

// Async thunks
export const fetchSurveys = createAsyncThunk(
  'survey/fetchSurveys',
  async (params, { rejectWithValue }) => {
    try {
      const response = await surveyAPI.getSurveys(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createSurvey = createAsyncThunk(
  'survey/createSurvey',
  async (surveyData, { rejectWithValue }) => {
    try {
      const response = await surveyAPI.createSurvey(surveyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateSurvey = createAsyncThunk(
  'survey/updateSurvey',
  async ({ surveyId, data }, { rejectWithValue }) => {
    try {
      const response = await surveyAPI.updateSurvey(surveyId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteSurvey = createAsyncThunk(
  'survey/deleteSurvey',
  async (surveyId, { rejectWithValue }) => {
    try {
      await surveyAPI.deleteSurvey(surveyId);
      return surveyId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const surveySlice = createSlice({
  name: 'survey',
  initialState: {
    surveys: [],
    currentSurvey: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    }
  },
  reducers: {
    setCurrentSurvey: (state, action) => {
      state.currentSurvey = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch surveys
      .addCase(fetchSurveys.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSurveys.fulfilled, (state, action) => {
        state.loading = false;
        state.surveys = action.payload.surveys;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSurveys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create survey
      .addCase(createSurvey.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSurvey.fulfilled, (state, action) => {
        state.loading = false;
        state.surveys.unshift(action.payload);
      })
      .addCase(createSurvey.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update survey
      .addCase(updateSurvey.fulfilled, (state, action) => {
        const index = state.surveys.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.surveys[index] = action.payload;
        }
      })
      // Delete survey
      .addCase(deleteSurvey.fulfilled, (state, action) => {
        state.surveys = state.surveys.filter(s => s.id !== action.payload);
      });
  }
});

export const { setCurrentSurvey, clearError } = surveySlice.actions;
export default surveySlice.reducer;
