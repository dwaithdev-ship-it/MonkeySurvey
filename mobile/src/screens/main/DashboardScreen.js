import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { getOrGenerateDeviceId } from '../../services/device';

const DashboardScreen = () => {
    const { token, user } = useSelector((state) => state.auth);
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
    // When cloud server is back: change to 'https://bodhasurvey.duckdns.org/'
    const BASE_URL = 'http://192.168.29.108:5173/';

    // Inject authentication credentials before the document loads to bypass login screens
    const injectedJS = deviceId ? `
        try {
            localStorage.setItem('token', ${JSON.stringify(token)});
            localStorage.setItem('user', JSON.stringify(${JSON.stringify(user)}));
            localStorage.setItem('deviceId', '${deviceId}');
        } catch (e) {
            console.error('[WebView] Auth injection failed:', e);
        }
        true;
    ` : 'true;';

    return (
        <View style={styles.container}>
            {deviceId ? (
                <WebView
                    ref={webViewRef}
                    source={{ uri: BASE_URL }}
                    injectedJavaScriptBeforeContentLoaded={injectedJS}
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

export default DashboardScreen;
