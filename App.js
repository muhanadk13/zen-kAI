import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MentalScoreScreen from './MentalScoreScreen';
import CheckInScreen from './CheckInScreen';
import InsightPlaceholderScreen from './InsightPlaceholderScreen';
import ReflectionScreen from './ReflectionScreen';

const Stack = createNativeStackNavigator();

// Helper function to calculate the next occurrence of a specific time
function getNextOccurrence(hour, minute) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0); // Set to the desired time today

  // If the time has already passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

// Schedule notifications for check-ins
async function scheduleNotifications() {
  // Reset the scheduled flag for testing (remove this in production)
  await AsyncStorage.removeItem('notificationsScheduled');
  await AsyncStorage.removeItem('notificationIds');

  // Check if notifications are already scheduled to avoid duplicates
  const hasScheduled = await AsyncStorage.getItem('notificationsScheduled');
  if (hasScheduled) {
    console.log('Notifications already scheduled, skipping...');
    return;
  }

  // Cancel all previous notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('Cleared all previous notifications');

  const now = new Date();

  // Schedule Check-In 1 at 9 AM
  const morningTrigger = getNextOccurrence(9, 0);
  const morningSeconds = Math.floor((morningTrigger - now) / 1000);
  const morningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧘 Morning Check-In',
      body: 'Tap to complete your first check-in of the day.',
      data: { screen: 'CheckIn', window: 'checkIn1' },
    },
    trigger: {
      seconds: morningSeconds,
    },
  });
  console.log(`Scheduled Morning Check-In for ${morningTrigger.toLocaleString()} (ID: ${morningId}, Seconds: ${morningSeconds})`);

  // Schedule Check-In 2 at 4 PM
  const afternoonTrigger = getNextOccurrence(16, 0);
  const afternoonSeconds = Math.floor((afternoonTrigger - now) / 1000);
  const afternoonId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌞 Afternoon Check-In',
      body: 'Tap to complete your second check-in of the day.',
      data: { screen: 'CheckIn', window: 'checkIn2' },
    },
    trigger: {
      seconds: afternoonSeconds,
    },
  });
  console.log(`Scheduled Afternoon Check-In for ${afternoonTrigger.toLocaleString()} (ID: ${afternoonId}, Seconds: ${afternoonSeconds})`);

  // Schedule Check-In 3 and Reflection at 10:44 PM (for testing)
  const eveningTrigger = getNextOccurrence(22, 44); // Set to 10:44 PM for testing
  const eveningSeconds = Math.floor((eveningTrigger - now) / 1000);
  const eveningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Evening Reflection',
      body: 'Tap to complete your final check-in and reflection.',
      data: { screen: 'CheckIn', window: 'checkIn3' },
    },
    trigger: {
      seconds: eveningSeconds,
    },
  });
  console.log(`Scheduled Evening Reflection for ${eveningTrigger.toLocaleString()} (ID: ${eveningId}, Seconds: ${eveningSeconds})`);

  // Store the scheduled notification IDs and mark as scheduled
  await AsyncStorage.setItem('notificationsScheduled', 'true');
  await AsyncStorage.setItem('notificationIds', JSON.stringify({
    morning: morningId,
    afternoon: afternoonId,
    evening: eveningId,
  }));
}

// Reschedule a notification after it fires
async function rescheduleNotification(window, hour, minute) {
  const now = new Date();
  const nextTrigger = getNextOccurrence(hour, minute);
  const seconds = Math.floor((nextTrigger - now) / 1000);

  const newId = await Notifications.scheduleNotificationAsync({
    content: {
      title: window === 'checkIn1' ? '🧘 Morning Check-In' :
             window === 'checkIn2' ? '🌞 Afternoon Check-In' :
             '🌙 Evening Reflection',
      body: window === 'checkIn3' ? 'Tap to complete your final check-in and reflection.' :
             'Tap to complete your ' + (window === 'checkIn1' ? 'first' : 'second') + ' check-in of the day.',
      data: { screen: 'CheckIn', window },
    },
    trigger: {
      seconds: seconds,
    },
  });

  // Update the stored notification ID
  const storedIds = await AsyncStorage.getItem('notificationIds');
  const ids = storedIds ? JSON.parse(storedIds) : {};
  if (window === 'checkIn1') ids.morning = newId;
  if (window === 'checkIn2') ids.afternoon = newId;
  if (window === 'checkIn3') ids.evening = newId;
  await AsyncStorage.setItem('notificationIds', JSON.stringify(ids));

  console.log(`Rescheduled ${window} for ${nextTrigger.toLocaleString()} (ID: ${newId}, Seconds: ${seconds})`);
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert('Error', 'Must use a physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission Required', 'Please enable notifications in your settings.');
    return false;
  }

  try {
    let token;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (projectId) {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } else {
      console.warn('projectId not found in app.config.js. Attempting to get token without projectId (may fail in some cases).');
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }
    console.log('Expo Push Token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    console.log('Android notification channel set');
  }

  return true;
}

export default function App() {
  const navigationRef = useRef();

  useEffect(() => {
    const setupNotifications = async () => {
      // Register for push notifications and get permission status
      const hasPermission = await registerForPushNotificationsAsync();
      if (hasPermission) {
        // Schedule notifications only if permissions are granted
        await scheduleNotifications();
      }

      // Handle notification taps and reschedule
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const { screen, window } = response.notification.request.content.data;
        if (screen === 'CheckIn' && window) {
          console.log(`Notification tapped: Navigating to ${screen} with window ${window}`);
          navigationRef.current?.navigate(screen, { window });
          // Reschedule the notification for the next day
          if (window === 'checkIn1') rescheduleNotification('checkIn1', 9, 0);
          if (window === 'checkIn2') rescheduleNotification('checkIn2', 16, 0);
          if (window === 'checkIn3') rescheduleNotification('checkIn3', 22, 44); // Updated to 10:44 PM
        }
      });

      // Handle notifications received while app is in foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      return () => subscription.remove();
    };

    setupNotifications();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="MentalScore">
        <Stack.Screen name="MentalScore" component={MentalScoreScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
        <Stack.Screen name="InsightPlaceholder" component={InsightPlaceholderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}