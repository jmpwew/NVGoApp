import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import ReportScreen from './screens/ReportScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import LoginScreen from './screens/LoginScreen';
import NewsScreen from './screens/NewsScreen';
import NewsDetailScreen from './screens/NewsDetailScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ProfileDetails from './screens/ProfileDetailsScreen';
import MyReportsScreen from './screens/MyReportsScreen';  
import TabNavigator from './navigation/TabNavigator';
import ChangePasswordScreen from './screens/ChangePasswordScreen';




const Stack = createNativeStackNavigator();

export default function App() {
  return (
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
     


      </Stack.Navigator>
    </NavigationContainer>
  );
}
   