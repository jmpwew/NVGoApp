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




const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        {/* Main App (Tabs) */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        

        {/* Other Screens (outside tabs) */}
        <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
        <Stack.Screen name="MyReports" component={MyReportsScreen}/>


      </Stack.Navigator>
    </NavigationContainer>
  );
}
   