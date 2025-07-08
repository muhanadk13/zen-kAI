import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, TouchableOpacity, Alert } from 'react-native';
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
  const navigationRef = useRef(null); // this will allow us to navigate no matter the screen

  useEffect(() => {
    const checkToken = async () => {
        const rawToken = await AsyncStorage.getItem('token');
        if (!rawToken) {
            navigationRef.current?.replace('LoginScreen');
            return;
        }

        try {
            const decoded = jwtDecode(rawToken);
            const nowInSeconds = Date.now() / 1000;

            if (decoded.exp > nowInSeconds) {
                navigationRef.current?.replace('MentalScore');
            } else {
                navigationRef.current?.replace('LoginScreen');
            }
        } catch (err) {
            navigationRef.current?.replace('LoginScreen');
        } 
    };

    checkToken();
  },[]);
  
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
    const permission = await Notifications.getPermissionsAsync(); // ask the user for permission to send notifications
    if (!permission) return;

    await Notifications.cancelAllScheduledNotificationsAsync(); // clear the old notifications
    const [t1, t2, t3] =  await Promise.all([ // I promise we will wait 
      AsyncStorage.getItem('checkIn1Time'),
      AsyncStorage.getItem('checkIn2Time'),
      AsyncStorage.getItem('checkIn3Time'),
    ]);

    // parse the time from storage or use default
    const {hour: h1, minute: m1} = parseTime(t1, 8, 0); 
    const {hour: h2, minute: m2} = parseTime(t2, 14, 0);
    const {hour: h3, minute: m3} = parseTime(t3, 21, 0);

    // Schedule the reminders
    await scheduleReminder('checkIn1', h1, m1); 
    await scheduleReminder('checkIn2', h2, m2);
    await scheduleReminder('checkIn3', h3, m3);
  }

  async function requestNotificationPermission() {
    if (!Device.isDevice) {
      Alert.alert('Error', 'This feature only works on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync(); // returns object but only save the status
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') { // if not granted permission
      const { status } = await Notifications.requestPermissionsAsync(); // we request permission from the user and save as status
      finalStatus = status; // the response is called status
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

  async function scheduleReminder(window, hour, minute) { 
    let message = ''; // empty
    try {
      message = await generatePersonalizedReminder(window); // check if there is a message for the window
    } catch (e) {
      message = `Don't miss your ${window} check-in!`; // fallback
   }

   const now = new Date(); // get current time
   const triggerDate = new Date() // create a new date object
   triggerDate.setHours(hour, minute, 0, 0); // set the time from the parameters
   if (triggerDate <= now) { // if the time has past
    triggerDate.setDate(triggerDate.getDate() + 1); // if the time is in the past, schedule for tomorrow
   }
   
   await Notifications.scheduleNotificationAsync({ // schedule the notification
    content: {
      title: 'zen-kAI',
      body: message,
      sound: true,
    },
    trigger: {
      type: 'date', // trigger on the date
      date: triggerDate,
    },

   });

   const labelMap = {checkIn1: 'morning', checkIn2: 'afternoon', checkIn3: 'evening'}; // to display
   const label = labelMap[window] || window; // make the label "morning", "afternoon", "evening"
   const timeStr = formatDisplayTime(hour, minute); // format the time for display
   console.log(`✅ GPT Reminder (${label}): "${message}" (${timeStr})`); // log the reminder
  }

  function formatDisplayTime(hour, minute) {
    const suffix = hour >= 12 ? 'pm' : 'am';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${minute.toString().padStart(2, '0')}${suffix}`;
  }

  function parseTime(str, defH, defM) {
    if (str) {
      const parts = str.split(':'); 
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return { hour: h, minute: m};
      }
    }
    return { hour: defH, minute: defM } // if the string is not valid, return the default time
 }

  return (
    <NavigationContainer ref={navigationRef}>
    <Stack.Navigator
      initialRouteName='Load'
      screenOptions={{ animation: 'fade', gestureEnabled: false}}>
        <Stack.Screen name='Onboarding' component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name='MentalScore' component={MentalScoreScreen} options={{ headerShown: false }} />
        <Stack.Screen name='CheckIn' component={CheckInScreen} options={{ headerShown: false }} />
        <Stack.Screen name='Chest' component={ChestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TestInsight" component={TestInsightScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Load" component={LoadScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}