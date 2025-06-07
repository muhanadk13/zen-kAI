import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Platform, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import MentalScoreScreen from './MentalScoreScreen';
import CheckInScreen from './CheckInScreen';
import ReflectionScreen from './ReflectionScreen';
import InsightPlaceholderScreen from './InsightPlaceholderScreen';
import HistoryScreen from './HistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function getNextOccurrence(hour, minute) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

async function scheduleNotifications() {
  const storedFlag = await AsyncStorage.getItem('notificationsScheduled');
  if (storedFlag === 'true') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const triggers = [
    { hour: 10, minute: 0, title: '🧘 Morning Check-In', body: 'Start your day with a check-in.', window: 'checkIn1' },
    { hour: 16, minute: 0, title: '🌞 Afternoon Check-In', body: 'Complete your second check-in.', window: 'checkIn2' },
    { hour: 21, minute: 0, title: '🌙 Evening Reflection', body: 'Finish with your final check-in.', window: 'checkIn3' },
  ];

  const idRecord = {};
  for (const { hour, minute, title, body, window } of triggers) {
    const triggerDate = getNextOccurrence(hour, minute);
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { screen: 'CheckIn', window } },
      trigger: { date: triggerDate },
    });
    idRecord[window] = id;
  }

  await AsyncStorage.setItem('notificationsScheduled', 'true');
  await AsyncStorage.setItem('notificationIds', JSON.stringify(idRecord));
}

async function rescheduleNotification(window, hour, minute) {
  const triggerDate = getNextOccurrence(hour, minute);
  const content = {
    checkIn1: { title: '🧘 Morning Check-In', body: 'Start your day with a check-in.' },
    checkIn2: { title: '🌞 Afternoon Check-In', body: 'Complete your second check-in.' },
    checkIn3: { title: '🌙 Evening Reflection', body: 'Finish with your final check-in.' },
  }[window];

  const newId = await Notifications.scheduleNotificationAsync({
    content: { ...content, data: { screen: 'CheckIn', window } },
    trigger: { date: triggerDate },
  });

  const stored = await AsyncStorage.getItem('notificationIds');
  const ids = stored ? JSON.parse(stored) : {};
  ids[window] = newId;
  await AsyncStorage.setItem('notificationIds', JSON.stringify(ids));
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert('Error', 'Push notifications require a physical device.');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission Required', 'Enable notifications in settings to continue.');
    return false;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = projectId
      ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
      : (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
  } catch (err) {
    console.error('Failed to get push token:', err);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF61F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { backgroundColor: '#0F172A', borderTopWidth: 0 },
        tabBarIcon: ({ color, size }) => {
          let icon = 'analytics';
          if (route.name === 'Home') icon = 'home';
          if (route.name === 'History') icon = 'time';
          if (route.name === 'CheckIn') icon = 'checkbox';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={MentalScoreScreen} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef();

  useEffect(() => {
    const setup = async () => {
      const granted = await registerForPushNotificationsAsync();
      if (granted) await scheduleNotifications();

      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const { screen, window } = response.notification.request.content.data;
        if (screen === 'CheckIn' && window) {
          navigationRef.current?.navigate(screen, { window });
          if (window === 'checkIn1') rescheduleNotification('checkIn1', 10, 0);
          if (window === 'checkIn2') rescheduleNotification('checkIn2', 16, 0);
          if (window === 'checkIn3') rescheduleNotification('checkIn3', 21, 0);
        }
      });

      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldPlaySound: true, shouldSetBadge: false }),
      });

      return () => sub.remove();
    };

    setup();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Reflection" component={ReflectionScreen} />
        <Stack.Screen name="Insight" component={InsightPlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
