import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Screens
import MentalScoreScreen from './MentalScoreScreen';
import CheckInScreen from './CheckInScreen';
import ReflectionScreen from './ReflectionScreen';
import TestInsightScreen from './TestInsightScreen';
import HistoryScreen from './HistoryScreen';
import LoadScreen from './LoadScreen';

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
  const navigationRef = useRef();

  useEffect(() => {
    initializeNotifications();
  }, []);

  async function initializeNotifications() {
    const permission = await requestNotificationPermission();
    if (!permission) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await scheduleReminder('checkIn1', 9, 0);   // Morning
    await scheduleReminder('checkIn2', 16, 0);  // Afternoon
    await scheduleReminder('checkIn3', 21, 0);  // Evening
  }

  async function requestNotificationPermission() {
    if (!Device.isDevice) {
      Alert.alert('Error', 'Notifications only work on physical devices.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission Required', 'Enable notifications in your settings.');
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
    let message;
    try {
      message = await generatePersonalizedReminder(window);
    } catch {
      message = `Don't miss your ${window} check-in — it matters.`;
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
  }

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
                style={{ marginLeft: 16 }}
              >
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
