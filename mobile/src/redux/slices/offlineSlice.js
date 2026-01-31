import { createSlice } from '@reduxjs/toolkit';

const offlineSlice = createSlice({
  name: 'offline',
  initialState: {
    isOffline: false,
    syncStatus: 'idle', // 'idle', 'syncing', 'error', 'synced'
    lastSyncTime: null,
    offlineQueue: [], // Array of requests to be synced
  },
  reducers: {
    setOfflineStatus: (state, action) => {
      state.isOffline = action.payload;
    },
    setSyncStatus: (state, action) => {
      state.syncStatus = action.payload;
      if (action.payload === 'synced') {
        state.lastSyncTime = new Date().toISOString();
      }
    },
    addToOfflineQueue: (state, action) => {
      state.offlineQueue.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
    },
    removeFromOfflineQueue: (state, action) => {
      state.offlineQueue = state.offlineQueue.filter(req => req.id !== action.payload);
    },
    clearOfflineQueue: (state) => {
      state.offlineQueue = [];
    },
    updateQueueItemStatus: (state, action) => {
      const { id, status, error } = action.payload;
      const item = state.offlineQueue.find(req => req.id === id);
      if (item) {
        item.status = status;
        if (error) item.error = error;
      }
    }
  },
});

export const {
  setOfflineStatus,
  setSyncStatus,
  addToOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  updateQueueItemStatus
} = offlineSlice.actions;

export default offlineSlice.reducer;
