import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROMPT_SHOWN_KEY = 'nvgo_location_prompt_shown';

/**
 * Requests foreground location permission.
 *
 * If the app has never asked before, a friendly rationale alert is shown
 * first (explaining why NVGo wants location access) before the native
 * system permission dialog appears. This avoids surprising the user with
 * an unexplained OS prompt right after install.
 *
 * Safe to call multiple times — once permission has been granted or the
 * rationale has already been shown once, it goes straight to checking /
 * requesting the native permission.
 *
 * @returns {Promise<boolean>} true if permission is granted
 */
export async function requestLocationPermission() {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const alreadyPrompted = await AsyncStorage.getItem(PROMPT_SHOWN_KEY);

    if (!alreadyPrompted) {
      await new Promise((resolve) => {
        Alert.alert(
          'Allow Location Access',
          'NVGo uses your location to show local weather updates and help responders locate you faster when you submit an emergency report.',
          [
            { text: 'Not Now', style: 'cancel', onPress: () => resolve() },
            { text: 'Continue', onPress: () => resolve() },
          ],
          { cancelable: false }
        );
      });
      await AsyncStorage.setItem(PROMPT_SHOWN_KEY, 'true');
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.log('Location permission error:', e);
    return false;
  }
}

export default requestLocationPermission;
