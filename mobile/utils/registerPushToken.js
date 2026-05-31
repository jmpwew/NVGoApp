import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api_url from './api';

export async function registerPushToken() {
  // push notifications only work on real devices
  if (!Device.isDevice) {
    console.log('Push notifications require a real device');
    return;
  }

  // ask user for permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permission denied');
    return;
  }

  // get the unique push token for this device
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId
  })).data;

  console.log('Push token:', token);

  // send token to your backend to save it
  const authToken = await AsyncStorage.getItem('token');
  await fetch(`${api_url}/api/notifications/push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ push_token: token })
  });
}