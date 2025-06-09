import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'; // Import useLayoutEffect
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
  LayoutAnimation,
  Platform,
  Animated,
  Keyboard,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import TagSelectorModal from './TagSelectorModal';
import { processCheckIn } from './utils/scoring';
import { compileHistory } from './utils/history';

export default function CheckInScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [energy, setEnergy] = useState(50);
  const [clarity, setClarity] = useState(50);
  const [emotion, setEmotion] = useState(50);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const scrollRef = useRef();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const milestones = [0, 25, 50, 75, 100];
  const lastEnergy = useRef(50);
  const lastClarity = useRef(50);
  const lastEmotion = useRef(50);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTransparent: true, // Make the header transparent
      headerBackground: () => (
        <BlurView
          tint="dark" // Options: "light", "dark", or "default"
          intensity={90} // Adjust the blur intensity
          style={{ flex: 1 }}
        />
      ),
      headerTitle: '', // Optional: Remove the title if not needed
    });
  }, [navigation]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => {
      if (Platform.OS === 'ios') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      if (Platform.OS === 'ios') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const getCheckInWindow = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'checkIn1';
    if (hour >= 12 && hour < 17) return 'checkIn2';
    return 'checkIn3';
  };

  const handleSliderChange = (value, setValue, lastRef) => {
    const rounded = Math.round(value);
    const isNearMilestone = milestones.some((m) => Math.abs(rounded - m) <= 1);
    if (isNearMilestone) {
      const nearest = milestones.reduce((a, b) => Math.abs(a - rounded) < Math.abs(b - rounded) ? a : b);
      if (nearest !== lastRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        lastRef.current = nearest;
      }
      setValue(nearest);
    } else {
      setValue(value);
      lastRef.current = rounded;
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSave = async () => {
    const timestamp = new Date().toISOString();
    const today = timestamp.split('T')[0];
    const window = route.params?.window || getCheckInWindow();
    const entry = { energy, clarity, emotion, note, window, timestamp, tags: selectedTags };

    try {
      const key = `${today}-${window}`;
      const existing = await AsyncStorage.getItem(key);
      if (existing) return Alert.alert('Already Checked In', `You've already completed ${window}.`);

      await AsyncStorage.setItem(key, JSON.stringify(entry));
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.push(entry);
      await AsyncStorage.setItem('checkInHistory', JSON.stringify(history));
      await compileHistory();
      await processCheckIn(entry);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (window === 'checkIn3') {
        navigation.navigate('Reflection');
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.error('❌ Error saving check-in:', err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save your check-in.');
    }
  };

  return (
    <LinearGradient colors={['#1C1F2E', '#12131C']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            <Animatable.View animation="fadeInUp" duration={600}>
              <Text style={styles.title}>Daily Check-In</Text>
              <Text style={styles.subtitle}>Reflect on your current state.</Text>
              {[{ label: 'Energy', value: energy, setValue: setEnergy, ref: lastEnergy, min: '#34d399', thumb: '#10b981', left: 'Depleted', right: 'Energized' },
                { label: 'Clarity', value: clarity, setValue: setClarity, ref: lastClarity, min: '#60a5fa', thumb: '#3b82f6', left: 'Foggy', right: 'Focused' },
                { label: 'Emotion', value: emotion, setValue: setEmotion, ref: lastEmotion, min: '#fcd34d', thumb: '#fbbf24', left: 'Down', right: 'Upbeat' }].map((item, idx) => (
                <LinearGradient
                  key={idx}
                  colors={['#646DFF', '#D7A4FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <Animatable.View animation="fadeInUp" duration={600} style={styles.cardInner}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      value={item.value}
                      onValueChange={(val) => handleSliderChange(val, item.setValue, item.ref)}
                      minimumTrackTintColor={item.min}
                      maximumTrackTintColor="#e5e7eb"
                      thumbTintColor={item.thumb}
                    />
                    <View style={styles.range}><Text style={styles.rangeText}>{item.left}</Text><Text style={styles.rangeText}>{item.right}</Text></View>
                  </Animatable.View>
                </LinearGradient>
              ))}
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Your thoughts..."
                placeholderTextColor="#999"
                value={note}
                onChangeText={(text) => setNote(text.slice(0, 250))}
                multiline
                maxLength={250}
              />
              <TouchableOpacity style={styles.tagButton} onPress={() => setTagModalVisible(true)}>
                <Text style={styles.tagButtonText}>+ Add Tags</Text>
              </TouchableOpacity>
              <View style={styles.tagList}>
                {selectedTags.map((t) => (
                  <View key={t} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{t}</Text>
                    <TouchableOpacity onPress={() => toggleTag(t)}>
                      <Text style={styles.removeTag}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <Animatable.View animation="fadeInUp" duration={600}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={async () => {
                      Animated.sequence([
                        Animated.timing(scaleAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
                        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
                      ]).start();
                      await Haptics.selectionAsync();
                      await handleSave();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>Save Check-In</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animatable.View>
              <View style={styles.footer}>
                <Image source={require('./assets/lock.png')} style={styles.lockIcon} />
                <Text style={styles.footerText}>Private — stored on your device</Text>
              </View>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <TagSelectorModal
        visible={tagModalVisible}
        onClose={() => setTagModalVisible(false)}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#A0A5B9',
    marginBottom: 24,
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textTransform: 'uppercase',
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
    color: '#A0A5B9',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1F2233',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 24,
    minHeight: 80,
    lineHeight: 20,
  },
  tagButton: {
    backgroundColor: '#2E3340',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tagButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2233',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 6,
    fontSize: 14,
  },
  removeTag: {
    color: '#A0A5B9',
    fontWeight: '900',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 26,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  cardGradient: {
    borderRadius: 22,
    padding: 2,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  cardInner: {
    backgroundColor: '#1C1E29',
    borderRadius: 20,
    padding: 18,
  },
});

