import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Gets the persistent native device ID or generates one if it doesn't exist yet.
 * Saves the generated device ID to native AsyncStorage to survive app restarts,
 * updates, and cache clearing.
 */
export const getOrGenerateDeviceId = async () => {
  try {
    let id = await AsyncStorage.getItem('deviceId');
    if (!id) {
      id = 'native_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      await AsyncStorage.setItem('deviceId', id);
      console.log('Generated new persistent native device ID:', id);
    } else {
      console.log('Retrieved existing persistent native device ID:', id);
    }
    return id;
  } catch (e) {
    console.error('Error getting/generating persistent device ID:', e);
    return 'fallback_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
  }
};
