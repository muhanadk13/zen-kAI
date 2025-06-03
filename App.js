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
     import ReflectionScreen from './ReflectionScreen';
     import TestInsightScreen from './TestInsightScreen';

     const Stack = createNativeStackNavigator();

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
       console.log('📆 Scheduling notifications...');
       const storedFlag = await AsyncStorage.getItem('notificationsScheduled');
       if (storedFlag === 'true') {
         console.log('⏩ Notifications already scheduled. Skipping.');
         return;
       }

      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🧹 Cleared all scheduled notifications.');

      const triggers = [
        { hour: 9, minute: 0, title: '🧘 Morning Check-In', body: 'Start your day with a check-in.', window: 'checkIn1' },
        { hour: 16, minute: 0, title: '🌞 Afternoon Check-In', body: 'Complete your second check-in.', window: 'checkIn2' },
        { hour: 23, minute: 18, title: '🌙 Evening Reflection', body: 'Finish with your final check-in.', window: 'checkIn3' },
      ];

      for (const { hour, minute, title, body, window } of triggers) {
        const id = await Notifications.scheduleNotificationAsync({
          content: { title, body, data: { screen: 'CheckIn', window } },
          trigger: { hour, minute, repeats: true },
        });
        console.log(`✅ Scheduled repeating ${window} at ${hour}:${minute} | ID: ${id}`);
      }

      await AsyncStorage.setItem('notificationsScheduled', 'true');
    }

    async function rescheduleNotification() {
      // No-op with repeating notifications
    }

     async function registerForPushNotificationsAsync() {
       console.log('🚀 Registering for push notifications...');
       if (!Device.isDevice) {
         Alert.alert('⚠️ Error', 'Push notifications require a physical device.');
         return false;
       }

       const { status: existingStatus } = await Notifications.getPermissionsAsync();
       console.log(`🔐 Current permission: ${existingStatus}`);

       let finalStatus = existingStatus;
       if (existingStatus !== 'granted') {
         const { status } = await Notifications.requestPermissionsAsync();
         finalStatus = status;
         console.log(`📨 Permission requested: ${status}`);
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
         console.log('✅ Push token obtained:', token);
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
         console.log('📣 Android notification channel configured.');
       }

       return true;
     }

     export default function App() {
       const navigationRef = useRef();

       useEffect(() => {
         const setup = async () => {
           console.log('🧠 Initializing app...');
           const granted = await registerForPushNotificationsAsync();
           if (granted) {
             await scheduleNotifications();
           } else {
             console.log('❌ Notifications not permitted.');
           }

           const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
             console.log('📨 Notification tapped:', response);
            const { screen, window } = response.notification.request.content.data;
            if (screen === 'CheckIn' && window) {
              navigationRef.current?.navigate(screen, { window });
            }
          });

           Notifications.setNotificationHandler({
             handleNotification: async () => ({
               shouldShowBanner: true,
               shouldPlaySound: true,
               shouldSetBadge: false,
             }),
           });

           return () => {
             console.log('🧽 Cleaning up notification listener.');
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
             <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ headerShown: false }} />
             <Stack.Screen name="TestInsight" component={TestInsightScreen} />
           </Stack.Navigator>
         </NavigationContainer>
       );
     }