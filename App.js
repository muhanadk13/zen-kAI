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

function getNextOccurrence(hour, minute) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  console.log(`🧠 getNextOccurrence(${hour}, ${minute}) → 
    Now: ${now.toLocaleString()} 
    Next: ${next.toLocaleString()} 
    Delay: ${Math.floor((next - now) / 1000)} seconds`);
  
  return next;
}

async function scheduleNotifications() {
  console.log('📆 scheduleNotifications() triggered');

  const storedFlag = await AsyncStorage.getItem('notificationsScheduled');
  console.log(`🧾 AsyncStorage.getItem('notificationsScheduled') → ${storedFlag}`);

  if (storedFlag) {
    console.log('⏩ Notifications already scheduled. Skipping...');
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('🧹 All scheduled notifications cancelled');

  const morningTrigger = getNextOccurrence(9, 0);
  const afternoonTrigger = getNextOccurrence(16, 0);
  const eveningTrigger = getNextOccurrence(23, 18);

  const morningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧘 Morning Check-In',
      body: 'Tap to complete your first check-in of the day.',
      data: { screen: 'CheckIn', window: 'checkIn1' },
    },
    trigger: { date: morningTrigger },
  });
  console.log(`✅ Morning scheduled → ${morningTrigger.toLocaleString()} | ID: ${morningId}`);

  const afternoonId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌞 Afternoon Check-In',
      body: 'Tap to complete your second check-in of the day.',
      data: { screen: 'CheckIn', window: 'checkIn2' },
    },
    trigger: { date: afternoonTrigger },
  });
  console.log(`✅ Afternoon scheduled → ${afternoonTrigger.toLocaleString()} | ID: ${afternoonId}`);

  const eveningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Evening Reflection',
      body: 'Tap to complete your final check-in and reflection.',
      data: { screen: 'CheckIn', window: 'checkIn3' },
    },
    trigger: { date: eveningTrigger },
  });
  console.log(`✅ Evening scheduled → ${eveningTrigger.toLocaleString()} | ID: ${eveningId}`);

  const idRecord = {
    morning: morningId,
    afternoon: afternoonId,
    evening: eveningId,
  };

  await AsyncStorage.setItem('notificationsScheduled', 'true');
  await AsyncStorage.setItem('notificationIds', JSON.stringify(idRecord));

  console.log(`📦 Stored AsyncStorage notificationIds: ${JSON.stringify(idRecord)}`);
}

async function rescheduleNotification(window, hour, minute) {
  const nextTrigger = getNextOccurrence(hour, minute);
  console.log(`🔁 Rescheduling '${window}' → ${nextTrigger.toLocaleString()}`);

  const newId = await Notifications.scheduleNotificationAsync({
    content: {
      title:
        window === 'checkIn1' ? '🧘 Morning Check-In' :
        window === 'checkIn2' ? '🌞 Afternoon Check-In' :
        '🌙 Evening Reflection',
      body:
        window === 'checkIn3'
          ? 'Tap to complete your final check-in and reflection.'
          : `Tap to complete your ${window === 'checkIn1' ? 'first' : 'second'} check-in of the day.`,
      data: { screen: 'CheckIn', window },
    },
    trigger: { date: nextTrigger },
  });

  console.log(`🆕 Rescheduled '${window}' for ${nextTrigger.toLocaleString()} with ID: ${newId}`);

  const stored = await AsyncStorage.getItem('notificationIds');
  const ids = stored ? JSON.parse(stored) : {};
  if (window === 'checkIn1') ids.morning = newId;
  if (window === 'checkIn2') ids.afternoon = newId;
  if (window === 'checkIn3') ids.evening = newId;
  await AsyncStorage.setItem('notificationIds', JSON.stringify(ids));

  console.log(`📦 Updated AsyncStorage.notificationIds → ${JSON.stringify(ids)}`);
}

async function registerForPushNotificationsAsync() {
  console.log('🚀 registerForPushNotificationsAsync() called');

  if (!Device.isDevice) {
    Alert.alert('⚠️ Error', 'Must use a physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log(`🔐 Existing notification permission: ${existingStatus}`);

  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log(`📨 Permission requested → Result: ${status}`);
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission Required', 'Please enable notifications in settings.');
    return false;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = projectId
      ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
      : (await Notifications.getExpoPushTokenAsync()).data;

    console.log('✅ Expo Push Token:', token);
  } catch (err) {
    console.error('❌ Failed to get push token:', err);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    console.log('📣 Android notification channel set');
  }

  return true;
}

export default function App() {
  const navigationRef = useRef();

  useEffect(() => {
    const setup = async () => {
      console.log('🧠 App mounted. Starting setup...');
      const granted = await registerForPushNotificationsAsync();
      if (granted) {
        await scheduleNotifications();
      } else {
        console.log('❌ Notifications not granted.');
      }

      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('📨 Notification response received:', response);
        const { screen, window } = response.notification.request.content.data;
        console.log(`➡️ Navigating to: ${screen}, window: ${window}`);

        if (screen === 'CheckIn' && window) {
          navigationRef.current?.navigate(screen, { window });

          // Reschedule after tap
          if (window === 'checkIn1') rescheduleNotification('checkIn1', 9, 0);
          if (window === 'checkIn2') rescheduleNotification('checkIn2', 16, 0);
          if (window === 'checkIn3') rescheduleNotification('checkIn3', 23, 18);
        }
      });

      Notifications.setNotificationHandler({
        handleNotification: async () => {
          console.log('🔊 Notification received in foreground');
          return {
            shouldShowBanner: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          };
        },
      });

      return () => {
        console.log('🧽 Cleanup: Removing notification listener');
        subscription.remove();
      };
    };

    setup();
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
