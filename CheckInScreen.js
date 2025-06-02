import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckInScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [energy, setEnergy] = useState(50);
  const [clarity, setClarity] = useState(50);
  const [emotion, setEmotion] = useState(50);
  const [note, setNote] = useState('');

  const scrollRef = useRef(null);
  const lastEnergy = useRef(50);
  const lastClarity = useRef(50);
  const lastEmotion = useRef(50);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => keyboardDidShow.remove();
  }, []);

  const getCheckInWindow = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'checkIn1';
    if (hour >= 12 && hour < 17) return 'checkIn2';
    return 'checkIn3';
  };

  const handleSliderChange = (value, setValue, lastRef) => {
    setValue(value);
    const rounded = Math.round(value);
    if (Math.abs(rounded - lastRef.current) >= 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastRef.current = rounded;
    }
  };

  const handleSave = async () => {
    const now = new Date();
    const timestamp = now.toISOString();
    const today = timestamp.split('T')[0];
    const window = route.params?.window || getCheckInWindow();

    const entry = {
      energy,
      clarity,
      emotion,
      note,
      window,
      timestamp,
    };

    try {
      const key = `${today}-${window}`;
      await AsyncStorage.setItem(key, JSON.stringify(entry));

      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.push(entry);
      await AsyncStorage.setItem('checkInHistory', JSON.stringify(history));

      console.log('✅ Check-in saved:', entry);

      if (window === 'checkIn3') {
        navigation.navigate('Reflection');
      } else {
        navigation.navigate('InsightPlaceholder');
      }
    } catch (err) {
      console.error('❌ Error saving check-in:', err);
    }
  };

  const showHistory = async () => {
    const raw = await AsyncStorage.getItem('checkInHistory');
    const parsed = raw ? JSON.parse(raw) : [];
    Alert.alert('Check-In History (Console)', 'Open the console to view.');
    console.log('📅 Full Check-In History:', parsed);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Animatable.View animation="fadeInUp" duration={600} delay={100}>
            <Text style={styles.title}>Daily Check-In</Text>
            <Text style={styles.subtitle}>Take a moment to reflect.</Text>

            <Text style={styles.label}>Energy</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={energy}
              onValueChange={(val) => handleSliderChange(val, setEnergy, lastEnergy)}
              minimumTrackTintColor="#34d399"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#10b981"
            />
            <View style={styles.range}>
              <Text style={styles.rangeText}>Low</Text>
              <Text style={styles.rangeText}>High</Text>
            </View>

            <Text style={styles.label}>Clarity</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={clarity}
              onValueChange={(val) => handleSliderChange(val, setClarity, lastClarity)}
              minimumTrackTintColor="#60a5fa"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#3b82f6"
            />
            <View style={styles.range}>
              <Text style={styles.rangeText}>Cloudy</Text>
              <Text style={styles.rangeText}>Clear</Text>
            </View>

            <Text style={styles.label}>Emotion</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={emotion}
              onValueChange={(val) => handleSliderChange(val, setEmotion, lastEmotion)}
              minimumTrackTintColor="#fcd34d"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#fbbf24"
            />
            <View style={styles.range}>
              <Text style={styles.rangeText}>Low</Text>
              <Text style={styles.rangeText}>High</Text>
            </View>

            <Text style={styles.label}>Write something down?</Text>
            <TextInput
              style={styles.input}
              placeholder="Your thoughts here..."
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <Animatable.View animation="fadeInUp" duration={600} delay={400}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Save Check-In</Text>
              </TouchableOpacity>
            </Animatable.View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#A0AEC0', marginTop: 14 }]}
              onPress={showHistory}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>📅 Show History (Dev)</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Image source={require('./assets/lock.png')} style={styles.lockIcon} />
              <Text style={styles.footerText}>
                Private — stored only on your device
              </Text>
            </View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 4,
  },
  range: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rangeText: {
    fontSize: 13,
    color: '#6b7280',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 24,
    minHeight: 80,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 6,
  },
  lockIcon: {
    width: 14,
    height: 14,
    tintColor: '#9ca3af',
  },
});
