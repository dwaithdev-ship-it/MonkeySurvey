import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/slices/authSlice';

const LoginScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const webViewRef = useRef(null);

    // Production URL: https://bodhasurvey.duckdns.org/login
    // Development URL: http://192.168.29.122:5173/login
    // We'll use the duckdns URL as it represents the "all platform" goal
    const LOGIN_URL = 'https://bodhasurvey.duckdns.org/login';

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'AUTH_SUCCESS') {
                const { token, user } = data.payload;
                // Dispatch login to Redux store to update app state
                dispatch(login({ user, token }));
            }
        } catch (error) {
            console.error('Error parsing message from WebView:', error);
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ uri: LOGIN_URL }}
                onMessage={handleMessage}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#6200ee" />
                    </View>
                )}
                style={styles.webview}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    webview: {
        flex: 1,
    },
    loading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

export default LoginScreen;
