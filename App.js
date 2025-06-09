import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Image, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Screens
import MentalScoreScreen from './MentalScoreScreen';
import CheckInScreen from './CheckInScreen';
import ReflectionScreen from './ReflectionScreen';
import TestInsightScreen from './TestInsightScreen';
import HistoryScreen from './HistoryScreen';
import LoadScreen from './LoadScreen';

// GPT Reminder Helper
import { generatePersonalizedReminder } from './utils/generatePersonalizedReminder';

const Stack = createNativeStackNavigator();

// ✅ Ensure notifications show even in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getNextOccurrence(hour, minute) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

async function scheduleGPTReminders() {
  const triggers = [
    { hour: 9, minute: 0, window: 'checkIn1' },
    { hour: 16, minute: 0, window: 'checkIn2' },
    { hour: 21, minute: 0, window: 'checkIn3' },
  ];

  console.log('💬 Scheduling GPT-powered notifications...');
  for (const { hour, minute, window } of triggers) {
    const triggerDate = getNextOccurrence(hour, minute);
    let message = '';

    try {
      message = await generatePersonalizedReminder(window);
    } catch (err) {
      console.error(`❌ GPT generation failed for ${window}:`, err);
      message = "Don't miss your check-in. Keep your clarity streak alive.";
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧠 ZenAI Reminder',
        body: message,
        sound: 'default',
        data: { screen: 'CheckIn', window },
      },
      trigger: { date: triggerDate },
    });

    console.log(`⏰ Scheduled ${window} → "${message}" at ${triggerDate.toLocaleTimeString()}`);
  }
}

async function registerForPushNotificationsAsync() {
  console.log('🚀 Registering for push notifications...');
  if (!Device.isDevice) {
    Alert.alert('⚠️ Error', 'Push notifications require a physical device.');
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
    console.log('✅ Push token:', token);
  } catch (err) {
    console.error('❌ Failed to get push token:', err);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    console.log('📣 Android notification channel configured.');
  }

  return true;
}

export default function App() {
  const navigationRef = useRef();

  useEffect(() => {
    const setup = async () => {
      console.log('🧠 ZenAI initializing...');
      const granted = await registerForPushNotificationsAsync();
      if (granted) {
        await scheduleGPTReminders();
      }
    };

    setup();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Load">
        <Stack.Screen name="MentalScore" component={MentalScoreScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="CheckIn"
          component={CheckInScreen}
          options={{
            headerTransparent: true,
            headerBackground: () => (
              <BlurView
                intensity={99}
                tint="dark"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(18,19,28,0.7)',
                }}
              />
            ),
            headerTitle: () => (
              <Image
                source={require('./assets/logo-text-only.png')}
                style={{ width: 130, height: 120, marginBottom: 8 }}
              />
            ),
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => {
                  if (navigationRef.current?.canGoBack()) {
                    navigationRef.current.goBack();
                  } else {
                    navigationRef.current?.navigate('MentalScore');
                  }
                }}
                style={{ marginLeft: 16 }}>
                <Image
                  source={require('./assets/logo-japan.png')}
                  style={{ width: 50, height: 50, marginLeft: 8, marginBottom: 8 }}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TestInsight" component={TestInsightScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Load" component={LoadScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}