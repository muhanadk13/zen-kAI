import React, { useEffect, useRef } from 'react';
     import { NavigationContainer } from '@react-navigation/native';
     import { createNativeStackNavigator } from '@react-navigation/native-stack';
     import { Platform } from 'react-native'; // Only if you use Platform elsewhere

     import AsyncStorage from '@react-native-async-storage/async-storage';

     import MentalScoreScreen from './MentalScoreScreen';
     import CheckInScreen from './CheckInScreen';
     import ReflectionScreen from './ReflectionScreen';
     import TestInsightScreen from './TestInsightScreen';
     import { BlurView } from 'expo-blur';
     import { Image, TouchableOpacity } from 'react-native';


import HistoryScreen from './HistoryScreen';
import LoadScreen from "./LoadScreen";
     const Stack = createNativeStackNavigator();

     function getNextOccurrence(hour, minute) {
       const now = new Date();
       const next = new Date(now);
       next.setHours(hour, minute, 0, 0);
       if (next <= now) {
         next.setDate(next.getDate() + 1);
       }
       console.log(`🧠 getNextOccurrence(${hour}, ${minute}) → Now: ${now.toLocaleString()} | Next: ${next.toLocaleString()} | Delay: ${Math.floor((next - now) / 1000)}s`);
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
         console.log(`✅ Scheduled ${window} at ${triggerDate.toLocaleString()} | ID: ${id}`);
         idRecord[window] = id;
       }

       await AsyncStorage.setItem('notificationsScheduled', 'true');
       await AsyncStorage.setItem('notificationIds', JSON.stringify(idRecord));
       console.log(`📦 Stored notification IDs: ${JSON.stringify(idRecord)}`);
     }

     async function rescheduleNotification(window, hour, minute) {
       const triggerDate = getNextOccurrence(hour, minute);
       console.log(`🔁 Rescheduling ${window} for ${triggerDate.toLocaleString()}`);

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
       console.log(`🆕 Rescheduled ${window} with ID: ${newId} | Updated IDs: ${JSON.stringify(ids)}`);
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
               if (window === 'checkIn1') rescheduleNotification('checkIn1', 10, 0);
               if (window === 'checkIn2') rescheduleNotification('checkIn2', 16, 0);
               if (window === 'checkIn3') rescheduleNotification('checkIn3', 21, 0);
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
          backgroundColor: 'rgba(18,19,28,0.7)', // fallback for Android
        }}
      />
    ),
    
    headerTitle: () => (
      <Image
        source={require('./assets/logo-text-only.png')}
        style={{ width: 130, height: 120, marginBottom: 8, }}
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
          style={{ width: 50, height: 50, marginLeft: 8, marginBottom: 8}}
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