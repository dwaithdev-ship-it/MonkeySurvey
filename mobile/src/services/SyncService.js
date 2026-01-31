import api from './api';
import { store } from '../redux/store';
import { removeFromOfflineQueue, setSyncStatus, updateQueueItemStatus } from '../redux/slices/offlineSlice';
import NetInfo from '@react-native-community/netinfo';

export const syncOfflineQueue = async () => {
    const state = store.getState();
    const queue = state.offline.offlineQueue;

    if (queue.length === 0) return;

    // Check connection again just to be sure
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    console.log(`[Sync] Starting sync of ${queue.length} items`);
    store.dispatch(setSyncStatus('syncing'));

    let successCount = 0;
    let failCount = 0;

    // Process sequentially to maintain order
    for (const item of queue) {
        try {
            store.dispatch(updateQueueItemStatus({ id: item.id, status: 'processing' }));

            console.log(`[Sync] Processing ${item.method} ${item.url}`);

            // Use the raw axios instance from api default export, but we need to bypass the offline check 
            // defined in the interceptor. 
            // However, the interceptor checks NetInfo. If we are online, it should pass through.

            await api.request({
                method: item.method,
                url: item.url,
                data: item.data,
                params: item.params
            });

            console.log(`[Sync] Success for ${item.id}`);
            store.dispatch(removeFromOfflineQueue(item.id));
            successCount++;

        } catch (error) {
            console.error(`[Sync] Failed to sync item ${item.id}`, error);
            store.dispatch(updateQueueItemStatus({ id: item.id, status: 'failed', error: error.message }));
            failCount++;
            // If it's a 4xx error (bad request), we might want to remove it or flag it. 
            // If it's 5xx or network, keep it.
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                // Invalid request, maybe remove it to unblock
                // store.dispatch(removeFromOfflineQueue(item.id));
            }
        }
    }

    if (queue.length === 0 || successCount > 0) {
        store.dispatch(setSyncStatus('synced'));
    } else if (failCount > 0) {
        store.dispatch(setSyncStatus('error'));
    } else {
        store.dispatch(setSyncStatus('idle'));
    }

    console.log(`[Sync] Completed. Success: ${successCount}, Failed: ${failCount}`);
};
