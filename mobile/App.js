import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import ReportScreen from './screens/ReportScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import LoginScreen from './screens/LoginScreen';
import NewsScreen from './screens/NewsScreen';
import NewsDetailScreen from './screens/NewsDetailScreen';
import AnnouncementDetailScreen from './screens/AnnouncementDetailScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ProfileDetails from './screens/ProfileDetailsScreen';
import MyReportsScreen from './screens/MyReportsScreen';
import TabNavigator from './navigation/TabNavigator';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import NotificationDetailScreen from './screens/NotificationDetailScreen';
import ContactSupportScreen from './screens/ContactSupportScreen';
import MoreFeaturesScreen from './screens/MoreFeaturesScreen';
import DeleteAccountScreen from './screens/DeleteAccountScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import VerifyOTPScreen from './screens/VerifyOTPScreen';
import VerifyRegisterOtpScreen from './screens/VerifyRegisterOtpScreen';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { requestLocationPermission } from './utils/locationPermission';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();


export default function App() {
  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}  edges={['top']}>
      <NavigationContainer>
        <Stack.Navigator>

          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />

          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ProfileDetails"
            component={ProfileDetails}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="MyReports"
            component={MyReportsScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="NewsDetail"
            component={NewsDetailScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="AnnouncementDetail"
            component={AnnouncementDetailScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="NotificationDetail"
            component={NotificationDetailScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ContactSupport"
            component={ContactSupportScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="MoreFeatures"
            component={MoreFeaturesScreen} options={{ headerShown: false }}
          />

          <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VerifyOtp" component={VerifyOTPScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VerifyRegisterOtp" component={VerifyRegisterOtpScreen} options={{ headerShown: false }} />

        </Stack.Navigator>
      </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}