import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import PagerView from 'react-native-pager-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { generatePersonalizedReminder } from './utils/generatePersonalizedReminder';

function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

export default function OnboardingScreen() {
  const pagerRef = useRef(null);
  const navigation = useNavigation();
  const [times, setTimes] = useState([
    new Date(new Date().setHours(8, 0, 0, 0)),
    new Date(new Date().setHours(14, 0, 0, 0)),
    new Date(new Date().setHours(21, 0, 0, 0)),
  ]);
  const [showPicker, setShowPicker] = useState([-1, -1, -1]);

  const handleTimeChange = (event, selectedDate, index) => {
    setShowPicker([ -1, -1, -1 ]);
    if (selectedDate) {
      const updated = [...times];
      updated[index] = selectedDate;
      setTimes(updated);
    }
  };

  async function requestPermission() {
    if (!Device.isDevice) return false;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return false;
    try {
      await Notifications.getExpoPushTokenAsync({ projectId: Constants.expoConfig?.extra?.eas?.projectId });
    } catch {}
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
    if (triggerDate <= now) triggerDate.setDate(triggerDate.getDate() + 1);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'zen-kAI',
        body: message,
        sound: true,
      },
      trigger: { type: 'date', date: triggerDate },
    });
  }

  async function scheduleNotifications() {
    const permission = await requestPermission();
    if (!permission) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await scheduleReminder('checkIn1', times[0].getHours(), times[0].getMinutes());
    await scheduleReminder('checkIn2', times[1].getHours(), times[1].getMinutes());
    await scheduleReminder('checkIn3', times[2].getHours(), times[2].getMinutes());
  }

  const saveAndStart = async () => {
    await AsyncStorage.multiSet([
      ['checkIn1Time', formatTime(times[0])],
      ['checkIn2Time', formatTime(times[1])],
      ['checkIn3Time', formatTime(times[2])],
      ['onboardingComplete', 'true'],
    ]);
    await scheduleNotifications();
    navigation.reset({ index: 0, routes: [{ name: 'MentalScore' }] });
  };

  const renderTimePicker = (index) => {
    if (showPicker[index] !== index) return null;
    return (
      <DateTimePicker
        value={times[index]}
        mode="time"
        is24Hour={false}
        onChange={(e, d) => handleTimeChange(e, d || times[index], index)}
      />
    );
  };

  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={0}
      ref={pagerRef}
    >
      <View key="1">
        <Pressable style={{ flex: 1 }} onPress={() => { Haptics.selectionAsync(); pagerRef.current?.setPage(1); }}>
          <LinearGradient
            colors={["#1C1F2E", "#12131C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.page}
          >
            <Image source={require('./assets/icon-japan.png')} style={styles.logo} />
            <Text style={styles.title}>🧠 Welcome to ZenAI{"\n"}Your mind’s quiet companion.</Text>
            <Text style={styles.subtext}>
              Track how you feel, reflect clearly, and grow with daily insights.
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View key="2">
        <Pressable style={{ flex: 1 }} onPress={() => { Haptics.selectionAsync(); pagerRef.current?.setPage(2); }}>
          <LinearGradient
            colors={["#1C1F2E", "#12131C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.page}
          >
            <Text style={styles.title}>☀️ Check in 3x a day{"\n"}Rate your energy, clarity, and emotion.</Text>
            <Text style={styles.subtext}>
              It only takes 30 seconds. Add notes or tags to capture the moment.
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View key="3">
        <LinearGradient
          colors={["#1C1F2E", "#12131C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.page}
        >
          <Text style={styles.title}>🌙 Reflect at night{"\n"}ZenAI will guide you with insight.</Text>
          <Text style={styles.subtext}>
            Understand your patterns. Build awareness. Improve gently over time.
          </Text>
          <Text style={styles.subtext}>Customize check-in times:</Text>
          <View style={styles.timeRow}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity
                key={i}
                style={styles.time}
                onPress={() => setShowPicker([i, i, i])}
              >
                <Text style={styles.timeText}>{formatTime(times[i])}</Text>
                {renderTimePicker(i)}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.begin} onPress={saveAndStart}>
            <Text style={styles.beginText}>Let’s Begin →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </PagerView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtext: {
    textAlign: 'center',
    fontSize: 16,
    color: '#A0A5B9',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  time: {
    backgroundColor: '#1F2233',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  timeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  begin: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#646DFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  beginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
