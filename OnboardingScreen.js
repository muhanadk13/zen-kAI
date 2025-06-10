import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable, TextInput, Keyboard } from 'react-native';
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
import Slider from '@react-native-community/slider';

function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

export default function OnboardingScreen() {
  const pagerRef = useRef(null);
  const navigation = useNavigation();
  const [currentPage, setCurrentPage] = useState(0);
  const [times, setTimes] = useState([
    new Date(new Date().setHours(8, 0, 0, 0)),
    new Date(new Date().setHours(14, 0, 0, 0)),
    new Date(new Date().setHours(21, 0, 0, 0)),
  ]);
  const [showPicker, setShowPicker] = useState([-1, -1, -1]);
  const [energy, setEnergy] = useState(50);
  const [clarity, setClarity] = useState(50);
  const [emotion, setEmotion] = useState(50);
  const [chat, setChat] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    if (currentPage === 2) {
      setTimeout(() => chatRef.current?.focus(), 300);
    }
  }, [currentPage]);

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
      onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
    >
      {/* Page 1: Welcome */}
      <View key="1">
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            Haptics.selectionAsync();
            pagerRef.current?.setPage(1);
          }}
        >
          <LinearGradient
            colors={["#1C1F2E", "#12131C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.page}
          >
            <Image source={require('./assets/logo-japan.png')} style={styles.logo} />
            <Text style={styles.title}>Welcome to zen-kAI</Text>
            <Text style={styles.subtext}>Tap to begin your journey.</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Page 2: Fake Check-In */}
      <View key="2">
        <LinearGradient
          colors={["#1C1F2E", "#12131C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.page, { paddingTop: 60 }]}
        >
          <Text style={styles.titleCenter}>Check 3x a day, reflection 3 comes with a reflection (Next page)</Text>
          {[{ label: 'Energy', value: energy, set: setEnergy },
            { label: 'Clarity', value: clarity, set: setClarity },
            { label: 'Emotion', value: emotion, set: setEmotion }].map((s) => (
            <View key={s.label} style={{ width: '100%', marginTop: 24 }}>
              <Text style={styles.label}>{s.label}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={s.value}
                minimumTrackTintColor="#646DFF"
                maximumTrackTintColor="#555"
                thumbTintColor="#D7A4FF"
                onValueChange={(v) => s.set(v)}
              />
              <View style={styles.range}><Text style={styles.rangeText}>Low</Text><Text style={styles.rangeText}>High</Text></View>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.begin, { marginTop: 20 }]}
            onPress={() => {
              Haptics.selectionAsync();
              pagerRef.current?.setPage(2);
            }}
          >
            <Text style={styles.beginText}>Submit</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Page 3: Reflection Chat */}
      <View key="3">
        <LinearGradient
          colors={["#1C1F2E", "#12131C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.page, { paddingTop: 60 }]}
        >
          <Text style={styles.titleCenter}>Reflection after Check in 3</Text>
          <View style={styles.chatBubble}><Text style={styles.chatText}>Are you ready to understand you?</Text></View>
          <TextInput
            ref={chatRef}
            style={styles.chatInput}
            value={chat}
            onChangeText={setChat}
            placeholder="Type here..."
            placeholderTextColor="#888"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              Haptics.selectionAsync();
              pagerRef.current?.setPage(3);
            }}
            returnKeyType="done"
          />
        </LinearGradient>
      </View>

      {/* Page 4: Mental Score + Times */}
      <View key="4">
        <LinearGradient
          colors={["#1C1F2E", "#12131C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.page}
        >
          <Text style={styles.title}>Understand your mental score</Text>
          <Image source={require('./assets/gauge.png')} style={styles.gauge} />
          <Text style={styles.subtext}>Choose Reflection Timings (Have notifications on)</Text>
          <View style={styles.timeRow}>
            {[0,1,2].map((i) => (
              <TouchableOpacity key={i} style={styles.time} onPress={() => setShowPicker([i,i,i])}>
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
  titleCenter: {
    textAlign: 'center',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  range: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeText: {
    color: '#A0A5B9',
    fontSize: 12,
    fontStyle: 'italic',
  },
  chatBubble: {
    backgroundColor: '#2E3340',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  chatInput: {
    backgroundColor: '#1F2233',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    color: '#FFFFFF',
  },
  gauge: {
    width: 200,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 24,
  },
});
