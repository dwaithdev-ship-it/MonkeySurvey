/**
 * Offline Synchronization Utility
 * Handles queuing and syncing survey responses when internet connection is restored.
 */

const QUEUE_KEY = 'offline_survey_responses';

export const offlineSync = {
    /**
     * Add a response to the offline queue
     */
    queueResponse: (response) => {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        queue.push({
            ...response,
            timestamp: new Date().toISOString(),
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        console.log(`[OfflineSync] Response queued. Total in queue: ${queue.length}`);
    },

    /**
     * Get all queued responses
     */
    getQueue: () => {
        return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    },

    /**
     * Remove a response from the queue by its unique offline ID
     */
    removeFromQueue: (offlineId) => {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        const updatedQueue = queue.filter(item => item.id !== offlineId);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    },

    /**
     * Attempt to sync all queued responses to the server
     */
    syncQueue: async (submitFn) => {
        const queue = offlineSync.getQueue();
        if (queue.length === 0) return { success: true, count: 0 };

        console.log(`[OfflineSync] Attempting to sync ${queue.length} responses...`);
        let successCount = 0;
        let failCount = 0;

        for (const response of queue) {
            try {
                // Remove the offline-specific ID before submission if necessary, 
                // but usually the backend ignored extra fields
                const { id, timestamp, ...data } = response;
                const result = await submitFn(data);

                if (result.success) {
                    offlineSync.removeFromQueue(response.id);
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                console.error(`[OfflineSync] Failed to sync response ${response.id}:`, err);
                failCount++;
                // Skip further sync attempts if it seems like we lost connection again
                if (err.message?.includes('Network Error') || !navigator.onLine) break;
            }
        }

        return {
            success: failCount === 0,
            synced: successCount,
            total: queue.length
        };
    },

    /**
     * Cache user credentials for offline login verification
     * NOTE: For a real app, we'd hash the password or use a more secure method.
     * Here we just store a reference to the last successful login.
     */
    cacheLogin: (identifier, password, userData) => {
        const cache = JSON.parse(localStorage.getItem('offline_auth_cache') || '{}');
        cache[identifier.toLowerCase()] = {
            password: btoa(password), // simple obfuscation
            userData,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('offline_auth_cache', JSON.stringify(cache));
    },

    /**
     * Verify credentials against the offline cache
     */
    verifyOffline: (identifier, password) => {
        const cache = JSON.parse(localStorage.getItem('offline_auth_cache') || '{}');
        const entry = cache[identifier.toLowerCase()];
        if (entry && entry.password === btoa(password)) {
            return {
                success: true,
                data: {
                    user: entry.userData,
                    token: 'offline_token' // Dummy token for offline mode
                }
            };
        }
        return { success: false, error: 'Invalid offline credentials' };
    }
};
