import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';


import MentalScoreScreen from './MentalScoreScreen';
import CheckInScreen from './CheckInScreen';
import ReflectionScreen from './ReflectionScreen';
import TestInsightScreen from './TestInsightScreen';
import HistoryScreen from './HistoryScreen';
import LoadScreen from './LoadScreen';
import OnboardingScreen from './OnboardingScreen';


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

  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem('onboardingComplete');
      if (done) {
        initializeNotifications();
        navigationRef.current?.replace('MentalScore')
      }
      else {
        navigationRef.current?.replace('Onboarding');
      }
    })();
},[]);


  async function initializeNotifications() {
    const permission = await Notifications.getPermissionsAsync(); 
    if (!permission) return;

    await Notifications.cancelAllScheduledNotificationsAsync(); 
    const [t1, t2, t3] =  await Promise.all([ 
      AsyncStorage.getItem('checkIn1Time'),
      AsyncStorage.getItem('checkIn2Time'),
      AsyncStorage.getItem('checkIn3Time'),
    ]);

    
    const {hour: h1, minute: m1} = parseTimeOrDefault(t1, 8, 0); 
    const {hour: h2, minute: m2} = parseTimeOrDefault(t2, 14, 0);
    const {hour: h3, minute: m3} = parseTimeOrDefault(t3, 21, 0);

    
    await scheduleCheckInReminder('checkIn1', h1, m1); 
    await scheduleCheckInReminder('checkIn2', h2, m2);
    await scheduleCheckInReminder('checkIn3', h3, m3);
  }

  async function ensureNotificationPermission() {
    if (!Device.isDevice) {
      Alert.alert('Error', 'This feature only works on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync(); 
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') { 
      const { status } = await Notifications.requestPermissionsAsync(); 
      finalStatus = status; 
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Permission Required', 'You need to enable notifications for this feature to work.');
      return false;
    }

    try {
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
    } catch (e) {}

    return true; 
  }

  async function scheduleCheckInReminder(window, hour, minute) { 
    let message = ''; 
    try {
      message = await generatePersonalizedReminder(window); 
    } catch (e) {
      message = `Don't miss your ${window} check-in!`; 
   }

   const now = new Date(); 
   const triggerDate = new Date() 
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

   const labelMap = {checkIn1: 'morning', checkIn2: 'afternoon', checkIn3: 'evening'}; 
   const label = labelMap[window] || window; 
   const timeStr = formatDisplayTime(hour, minute); 
   console.log(`✅ GPT Reminder (${label}): "${message}" (${timeStr})`); 
  }

  function formatDisplayTime(hour, minute) {
    const suffix = hour >= 12 ? 'pm' : 'am';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${minute.toString().padStart(2, '0')}${suffix}`;
  }

  function parseTimeOrDefault(str, defH, defM) {
    if (str) {
      const parts = str.split(':'); 
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return { hour: h, minute: m};
      }
    }
    return { hour: defH, minute: defM } 
 }

  return (
    <NavigationContainer ref={navigationRef}>
    <Stack.Navigator
      initialRouteName='Load'
      screenOptions={{ animation: 'fade', gestureEnabled: false}}>
        <Stack.Screen name='Onboarding' component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name='MentalScore' component={MentalScoreScreen} options={{ headerShown: false }} />
        <Stack.Screen name='CheckIn' component={CheckInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TestInsight" component={TestInsightScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Load" component={LoadScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}