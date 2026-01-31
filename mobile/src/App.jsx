import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider as PaperProvider, Snackbar, Text } from 'react-native-paper';
import { Provider as StoreProvider, useSelector, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import store from './redux/store';
import AppNavigator from './navigation/AppNavigator';
import NetworkService from './services/NetworkService';
import { injectStore } from './services/api';
import { syncOfflineQueue } from './services/SyncService';

// Component to handle side effects and global UI for offline
const AppContent = () => {
    const isOffline = useSelector(state => state.offline.isOffline);
    const syncStatus = useSelector(state => state.offline.syncStatus);
    const dispatch = useDispatch();

    useEffect(() => {
        // Initialize services
        injectStore(store);
        NetworkService.init();

        return () => {
            NetworkService.cleanup();
        };
    }, []);

    useEffect(() => {
        if (!isOffline) {
            // Trigger sync when back online
            syncOfflineQueue();
        }
    }, [isOffline]);

    return (
        <View style={{ flex: 1 }}>
            <NavigationContainer>
                <AppNavigator />
            </NavigationContainer>

            <Snackbar
                visible={isOffline}
                onDismiss={() => { }}
                duration={3000}
                style={{ backgroundColor: '#B00020' }}
            >
                You are currently offline. Changes will be saved locally.
            </Snackbar>

            <Snackbar
                visible={!isOffline && syncStatus === 'syncing'}
                onDismiss={() => { }}
                duration={3000}
                style={{ backgroundColor: '#2196F3' }}
            >
                Syncing offline data...
            </Snackbar>
            <Snackbar
                visible={!isOffline && syncStatus === 'synced'}
                onDismiss={() => { }} // Auto dismiss?
                duration={2000}
                style={{ backgroundColor: '#4CAF50' }}
            >
                Sync complete!
            </Snackbar>
        </View>
    );
};

const App = () => {
    return (
        <StoreProvider store={store}>
            <PaperProvider>
                <SafeAreaProvider>
                    <AppContent />
                </SafeAreaProvider>
            </PaperProvider>
        </StoreProvider>
    );
};

export default App;
