import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MapScreen from './src/screens/MapScreen';
import BookingScreen from './src/screens/BookingScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ReportScreen from './src/screens/ReportScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MapHome" component={MapScreen} options={{ title: 'Find Parking' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book Now' }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Report Issue' }} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Map" component={MapStack} options={{ headerShown: false }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Booking History' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign Up' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    setLoading(false);
    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
