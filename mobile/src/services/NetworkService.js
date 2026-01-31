import NetInfo from '@react-native-community/netinfo';
import { store } from '../redux/store';
import { setOfflineStatus } from '../redux/slices/offlineSlice';
// import { syncOfflineQueue } from './SyncService'; // Circular dependency risk, will handle in App.jsx or via thunk

class NetworkService {
    constructor() {
        this.unsubscribe = null;
    }

    init() {
        // Unsubscribe if already subscribed to avoid duplicates
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.unsubscribe = NetInfo.addEventListener(state => {
            const isOffline = !(state.isConnected && state.isInternetReachable !== false);

            console.log('Network State Changed:', {
                isConnected: state.isConnected,
                isInternetReachable: state.isInternetReachable,
                determinedOffline: isOffline
            });

            // Dispatch to Redux
            store.dispatch(setOfflineStatus(isOffline));

            // If we came back online, we might want to trigger sync
            // This is often better handled in a separate "reaction" or listener in App.jsx/SyncService
            // to keep this service focused on detection.
        });
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    async getCurrentState() {
        return await NetInfo.fetch();
    }
}

export default new NetworkService();
