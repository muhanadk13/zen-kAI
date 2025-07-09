import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

// Screens
import MentalScoreScreen from './MentalScoreScreen';
import CheckInScreen from './CheckInScreen';
import ReflectionScreen from './ReflectionScreen';
import TestInsightScreen from './TestInsightScreen';
import HistoryScreen from './HistoryScreen';
import LoadScreen from './LoadScreen';
import OnboardingScreen from './OnboardingScreen';
import ChestScreen from './ChestScreen';
import LoginScreen from './LoginScreen';

// GPT Reminder Helper
import { generatePersonalizedReminder } from './utils/generatePersonalizedReminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef(null);
  const [initialScreen, setInitialScreen] = useState(null);


    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      console.log("🚀 Token:", token);
      console.log("✅ Onboarding complete:", onboardingComplete);
  
      if (!token) {
        console.log("🔑 No token found. Redirecting...");
        if (onboardingComplete) {
          console.log("reaching the login");
          navigationRef.current?.replace('LoginScreen');
        } else {
          navigationRef.current?.replace('Onboarding');
        }
        return;
      }
      try {
        const decoded = jwtDecode(token);
        console.log("🔓 Decoded token:", decoded);
        const nowInSeconds = Date.now() / 1000;
  
        if (decoded.exp > nowInSeconds) {
          console.log("✅ Token is valid. Going to MentalScore...");
          await initializeNotifications();
          navigationRef.current?.replace('MentalScore');
        } else {
          console.log("❌ Token expired. Removing and going to Login...");
          await AsyncStorage.removeItem('token');
          navigationRef.current?.replace('LoginScreen');
        }
      } catch (err) {
        console.error("❌ Token decode failed:", err);
        navigationRef.current?.replace('LoginScreen');
      }
    };
  

  
  

  async function initializeNotifications() {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const [t1, t2, t3] = await Promise.all([
      AsyncStorage.getItem('checkIn1Time'),
      AsyncStorage.getItem('checkIn2Time'),
      AsyncStorage.getItem('checkIn3Time'),
    ]);

    const { hour: h1, minute: m1 } = parseTime(t1, 8, 0);
    const { hour: h2, minute: m2 } = parseTime(t2, 14, 0);
    const { hour: h3, minute: m3 } = parseTime(t3, 21, 0);

    await scheduleReminder('checkIn1', h1, m1);
    await scheduleReminder('checkIn2', h2, m2);
    await scheduleReminder('checkIn3', h3, m3);
  }

  async function scheduleReminder(window, hour, minute) {
    let message = '';
    try {
      message = await generatePersonalizedReminder(window);
    } catch {
      message = `Don't miss your ${window} check-in!`;
    }

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'zen-kAI',
        body: message,
        sound: true,
      },
      trigger: {
        type: 'date',
        date: triggerDate,
      },
    });

    const labelMap = { checkIn1: 'morning', checkIn2: 'afternoon', checkIn3: 'evening' };
    const label = labelMap[window] || window;
    const timeStr = formatDisplayTime(hour, minute);
    console.log(`✅ GPT Reminder (${label}): "${message}" (${timeStr})`);
  }

  function parseTime(str, defH, defM) {
    if (str) {
      const parts = str.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return { hour: h, minute: m };
      }
    }
    return { hour: defH, minute: defM };
  }

  function formatDisplayTime(hour, minute) {
    const suffix = hour >= 12 ? 'pm' : 'am';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${minute.toString().padStart(2, '0')}${suffix}`;
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={checkToken}>
      <Stack.Navigator initialRouteName="Load" screenOptions={{ animation: 'fade', gestureEnabled: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MentalScore" component={MentalScoreScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chest" component={ChestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TestInsight" component={TestInsightScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Load" component={LoadScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
