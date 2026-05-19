import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch } from 'react-redux';
import { setAuth } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrGenerateDeviceId } from '../../services/device';

const LoginScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const webViewRef = useRef(null);
    const [deviceId, setDeviceId] = useState(null);

    useEffect(() => {
        const initDevice = async () => {
            const id = await getOrGenerateDeviceId();
            setDeviceId(id);
        };
        initDevice();
    }, []);

    // ─── URL CONFIG ────────────────────────────────────────────────────────────
    // Cloud server (bodhasurvey.duckdns.org) is CURRENTLY OFFLINE.
    // Using the local dev frontend which is running on the same WiFi network.
    // When cloud server is back: change to 'https://bodhasurvey.duckdns.org/login'
    const LOGIN_URL = 'http://192.168.29.108:5173/login';

    const handleMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'AUTH_SUCCESS') {
                const { token, user } = data.payload;
                // Securely persist token to AsyncStorage for native sync/session loading
                await AsyncStorage.setItem('authToken', token);
                // Dispatch setAuth to Redux store synchronously to transition state immediately
                dispatch(setAuth({ user, token }));
            }
        } catch (error) {
            console.error('Error parsing message from WebView:', error);
        }
    };

    const injectedJS = deviceId ? `
        try {
            localStorage.setItem('deviceId', '${deviceId}');
        } catch (e) {
            console.error('[WebView] DeviceId injection failed:', e);
        }
        true;
    ` : 'true;';

    return (
        <View style={styles.container}>
            {deviceId ? (
                <WebView
                    ref={webViewRef}
                    source={{ uri: LOGIN_URL }}
                    injectedJavaScriptBeforeContentLoaded={injectedJS}
                    onMessage={handleMessage}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="#6200ee" />
                        </View>
                    )}
                    style={styles.webview}
                />
            ) : (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#6200ee" />
                </View>
            )}
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
