import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import axios from 'axios';

// Import your screens
import LoginScreen from './Screen/LoginScreen';
import MapScreen from './Screen/MapScreen';
import HomeScreen from './Screen/HomeScreen';
import MedicinesScreen from './Screen/MedicinesScreen';
import NotificationPage from './Screen/NotificationPage';
import OnlineMedicinePurchase from './Screen/OnlineMedicinePurchase';
import PersonalDataScreen from './Screen/PersonalDataScreen';
import SettingsScreen from './Screen/SettingsScreen';
import SignUpScreen from './Screen/SignUpScreen';
import ProfileScreen from './Screen/ProfileScreen';
import PrivacyPolicyScreen from './Screen/PrivacyPolicyScreen';
import HomeopathyScreen from './Screen/HomeopathyScreen';
import HerbalScreen from './Screen/HerbalScreen';
import HealthDevicesScreen from './Screen/HealthDevicesScreen';
import DentalCareScreen from './Screen/DentalCareScreen';
import CoronaHelpScreen from './Screen/CoronaHelpScreen';
import MedicalKitScreen from './Screen/MedicalKitScreen';
import SkinCareScreen from './Screen/SkinCareScreen';
import KitsScreen from './Screen/Kits';
import KitDetails from './Screen/KitDetails';
import MedicineRecommendationScreen from './Screen/MedicineRecommendationScreen';
import HelpAndSupport from './Screen/HelpAndSupportScreen';
import OrderHistoryScreen from './Screen/OrderHistoryScreen';
import ChangePasswordScreen from './Screen/ChangePasswordScreen';
import TermsAndConditionsScreen from './Screen/TermsAndConditionsScreen';
import FeedbackScreen from './Screen/FeedbackScreen';
import DeviceDetailScreen from './Screen/DeviceDetailScreen';
import DentalCareDetailScreen from './Screen/DentalCareDetailScreen';
import PurchaseConfirmation from './Screen/PurchaseConfirmationScreen';
import InventoryManagement from './Screen/InventoryManagement';
import PatientRecords from './Screen/PatientRecords';
import MedicineDescription from './Screen/MedicineDetails';
import LocationScreen from './Screen/LocationScreen';
import ConfirmationScreen from './Screen/ConfirmationScreen';
import JazzCashPayment from './Screen/JazzCashPayment';
import StripePaymentScreen from './Screen/StripePaymentScreen';
import FAQScreen from './Screen/FAQScreen';
import TransactionHistory from './Screen/TransactionHistory';
import UserFeedbackScreen from './Screen/UserFeedbackScreen';
import VerifyOTPScreen from './Screen/VerifyOTPScreen';
import OnboardingNavigator from './Screen/OnboardingNavigator'; // Import the onboarding navigator
import ResetScreen from './Screen/ResetScreen';
import MedicineReminderScreen from './Screen/MedicineReminderScreen';
import ReminderScheduleScreen from './Screen/ReminderScheduleScreen';
import SmartInteractionScreen from './Screen/SmartInteractionScreen';
import MedicineMatchGame from './Screen/MedicineMatchGame';
import Chat from './Screen/Chat'; // Import the chat screen
import MediAppAI from './Screen/MediAppAI';

// Import providers
import { ThemeProvider } from './Screen/ThemeContext';
import CartProvider from './Screen/CartContext';
import { AuthProvider } from './Screen/AuthContext'; // Import AuthProvider
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

const Stack = createStackNavigator();

import PremiumSplash from './Screen/PremiumSplash';

const API_BASE = 'https://dashboard-backend-xrss.vercel.app';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NotificationManager = () => {
  const pollRef = useRef(null);
  const registerRef = useRef(null);
  const registeredRef = useRef(false);

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) return;
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const request = await Notifications.requestPermissionsAsync();
        finalStatus = request.status;
      }
      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0d6efd',
        });
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;
      if (!projectId) return;

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const pushToken = tokenData?.data;
      if (!pushToken) return;

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      await axios.post(
        `${API_BASE}/api/notifications/register`,
        { token: pushToken, platform: Platform.OS },
        { headers: { Authorization: `Bearer ${authToken}` }, timeout: 15000 }
      );
      registeredRef.current = true;
    } catch (err) {
      console.error('Push registration failed', err?.message || err);
    }
  };

  const pollNotifications = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;
      const resp = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 15000,
      });
      const list = Array.isArray(resp.data) ? resp.data : [];
      if (!list.length) return;

      const lastSeenRaw = await AsyncStorage.getItem('lastNotifiedAt');
      const newest = list[0]?.date ? new Date(list[0].date).getTime() : 0;
      if (!lastSeenRaw && newest) {
        await AsyncStorage.setItem('lastNotifiedAt', new Date(newest).toISOString());
      }

      const lastSeen = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0;
      if (!Number.isFinite(lastSeen)) return;

      const fresh = list.filter((n) => {
        const t = n?.date ? new Date(n.date).getTime() : 0;
        return t > lastSeen;
      });
      if (!fresh.length) return;

      const latestTime = Math.max(...fresh.map((n) => new Date(n.date).getTime()).filter(Boolean));
      if (latestTime) {
        await AsyncStorage.setItem('lastNotifiedAt', new Date(latestTime).toISOString());
      }

      for (const n of fresh.slice(0, 3)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: n.title || 'MediApp',
            body: n.message || '',
            sound: 'default',
          },
          trigger: null,
        });
      }
    } catch (err) {
      console.error('Notification poll failed', err?.message || err);
    }
  };

  useEffect(() => {
    registerForPushNotifications();
    registerRef.current = setInterval(() => {
      if (!registeredRef.current) registerForPushNotifications();
    }, 30000);
    return () => {
      if (registerRef.current) clearInterval(registerRef.current);
    };
  }, []);

  useEffect(() => {
    pollNotifications();
    pollRef.current = setInterval(pollNotifications, 60000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') pollNotifications();
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      sub?.remove?.();
    };
  }, []);

  return null;
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding !== 'true') {
          setInitialRoute('Onboarding');
        } else {
          const token = await AsyncStorage.getItem('authToken');
          setInitialRoute(token ? 'Home' : 'Login');
        }
      } catch (error) {
        console.error('Error checking session status:', error);
        setInitialRoute('Login');
      }
    };

    checkSessionStatus();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <NotificationManager />
              <NavigationContainer>
                <StatusBar style="auto" />
                <StripeProvider publishableKey="pk_test_51Pzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz">
                  {(initialRoute === null || showSplash) ? (
                    <PremiumSplash onFinish={() => setShowSplash(false)} />
                  ) : (
                    <Stack.Navigator initialRouteName={initialRoute}>
                      <Stack.Screen
                        name="Onboarding"
                        component={OnboardingNavigator}
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Signup" component={SignUpScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Medicine" component={MedicinesScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="PersonalData" component={PersonalDataScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="OnlineMedicinePurchase" component={OnlineMedicinePurchase} options={{ headerShown: false }} />
                      <Stack.Screen name="NotificationPage" component={NotificationPage} options={{ headerShown: false }} />
                      <Stack.Screen name="MapLocation" component={MapScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Homeopathy" component={HomeopathyScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Herbal" component={HerbalScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="HealthDevices" component={HealthDevicesScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="DentalCare" component={DentalCareScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="CoronaHelp" component={CoronaHelpScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="MedicalKit" component={MedicalKitScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="SkinCare" component={SkinCareScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Kits" component={KitsScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="KitDetails" component={KitDetails} options={{ headerShown: false }} />
                      <Stack.Screen name="MedicineRecommendation" component={MedicineRecommendationScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="HelpAndSupport" component={HelpAndSupport} options={{ headerShown: false }} />
                      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="DentalCareDetail" component={DentalCareDetailScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="PurchaseConfirmation" component={PurchaseConfirmation} options={{ headerShown: false }} />
                      <Stack.Screen name="InventoryManagement" component={InventoryManagement} options={{ headerShown: false }} />
                      <Stack.Screen name="PatientRecords" component={PatientRecords} options={{ headerShown: false }} />
                      <Stack.Screen name="MedicineDetail" component={MedicineDescription} options={{ headerShown: false }} />
                      <Stack.Screen name="Location" component={LocationScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Confirmation" component={ConfirmationScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="JazzCashPayment" component={JazzCashPayment} options={{ headerShown: false }} />
                      <Stack.Screen name="StripePaymentScreen" component={StripePaymentScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="FAQScreen" component={FAQScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="TransactionHistory" component={TransactionHistory} options={{ headerShown: false }} />
                      <Stack.Screen name="UserFeedback" component={UserFeedbackScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Reset" component={ResetScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="MedicineReminder" component={MedicineReminderScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="SmartInteraction" component={SmartInteractionScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="MedicineMatchGame" component={MedicineMatchGame} options={{ headerShown: false }} />
                      <Stack.Screen name="MediAppAI" component={MediAppAI} options={{ headerShown: false }} />
                      <Stack.Screen name="ReminderSchedule" component={ReminderScheduleScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
                    </Stack.Navigator>
                  )}
                </StripeProvider>
              </NavigationContainer>
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
