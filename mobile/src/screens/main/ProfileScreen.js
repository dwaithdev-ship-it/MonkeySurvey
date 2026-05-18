import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const ProfileScreen = () => {
    const dispatch = useDispatch();
    const { token, user } = useSelector((state) => state.auth);
    const webViewRef = useRef(null);

    // ─── URL CONFIG ────────────────────────────────────────────────────────────
    // Cloud server (bodhasurvey.duckdns.org) is CURRENTLY OFFLINE.
    // Using the local dev frontend which is running on the same WiFi network.
    // When cloud server is back: change to 'https://bodhasurvey.duckdns.org/profile'
    const PROFILE_URL = 'http://192.168.29.108:5173/profile';

    // Inject authentication credentials before the document loads to bypass login screens
    const injectedJS = `
        try {
            localStorage.setItem('token', ${JSON.stringify(token)});
            localStorage.setItem('user', JSON.stringify(${JSON.stringify(user)}));
        } catch (e) {
            console.error('[WebView] Auth injection failed:', e);
        }
        true;
    `;

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'LOGOUT') {
                dispatch(logout());
            }
        } catch (e) {
            // Ignore other messages
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ uri: PROFILE_URL }}
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
            {/* Native safety logout button at the bottom */}
            <View style={styles.buttonContainer}>
                <Button title="Logout App Session" color="#B00020" onPress={() => dispatch(logout())} />
            </View>
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
    buttonContainer: {
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    }
});

export default ProfileScreen;
