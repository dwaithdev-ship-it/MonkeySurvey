import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import store from './redux/store';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
    return (
        <StoreProvider store={store}>
            <PaperProvider>
                <SafeAreaProvider>
                    <NavigationContainer>
                        <AppNavigator />
                    </NavigationContainer>
                </SafeAreaProvider>
            </PaperProvider>
        </StoreProvider>
    );
};

export default App;
