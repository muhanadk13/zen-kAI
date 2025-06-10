import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PagerView from 'react-native-pager-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

export default function OnboardingScreen() {
  const pagerRef = useRef(null);
  const navigation = useNavigation();
  const [page, setPage] = useState(0);
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

  const saveAndStart = async () => {
    await AsyncStorage.multiSet([
      ['checkIn1Time', formatTime(times[0])],
      ['checkIn2Time', formatTime(times[1])],
      ['checkIn3Time', formatTime(times[2])],
      ['onboardingComplete', 'true'],
    ]);
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
      onPageSelected={(e) => setPage(e.nativeEvent.position)}
    >
      <View key="1">
        <LinearGradient
          colors={["#E6E6FA", "#ADD8E6"]}
          style={styles.page}
        >
          <Text style={styles.title}>🧠 Welcome to ZenAI{"\n"}Your mind’s quiet companion.</Text>
          <Text style={styles.subtext}>
            Track how you feel, reflect clearly, and grow with daily insights.
          </Text>
          <TouchableOpacity
            style={styles.next}
            onPress={() => pagerRef.current?.setPage(1)}
          >
            <Text style={styles.nextText}>Next →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View key="2">
        <LinearGradient colors={["#E6E6FA", "#ADD8E6"]} style={styles.page}>
          <Text style={styles.title}>☀️ Check in 3x a day{"\n"}Rate your energy, clarity, and emotion.</Text>
          <Text style={styles.subtext}>
            It only takes 30 seconds. Add notes or tags to capture the moment.
          </Text>
          <TouchableOpacity
            style={styles.next}
            onPress={() => pagerRef.current?.setPage(2)}
          >
            <Text style={styles.nextText}>Next →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View key="3">
        <LinearGradient colors={["#E6E6FA", "#ADD8E6"]} style={styles.page}>
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
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtext: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  next: {
    padding: 12,
  },
  nextText: {
    fontSize: 18,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  time: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
  },
  begin: {
    padding: 12,
    backgroundColor: '#646DFF',
    borderRadius: 8,
  },
  beginText: {
    color: '#fff',
    fontSize: 18,
  },
});
