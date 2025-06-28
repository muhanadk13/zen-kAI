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


function CustomHeader() {
  const navigation = useNavigation();

  return (
    <BlurView
      tint="dark"
      intensity={90}
      
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 100,
        paddingTop: 40,
        paddingHorizontal: 16,
        justifyContent: 'center',
      }}
    >
      <TouchableOpacity
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MentalScore');
          }
        }}
      >
        <Image
          source={require('./assets/logo-japan.png')} // adjust path if needed
          style={{ width: 50, height: 50, marginLeft: 15, marginTop: 0}}
        />
      </TouchableOpacity>
    </BlurView>
  );
}



export default function CheckInScreen() {
  const navigation = useNavigation();
  const navigationRef = useRef(null); // this will allow us to navigate no matter the screen
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


  useEffect(() => {
    // listen for when the keyboard is about to show 
    const show = Keyboard.addListener('keyboardWillShow', () => {
      if (Platform.OS === 'ios') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });
    // listen for when the keyboard is about to hide
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      if (Platform.OS === 'ios') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });
    return () => { 
      show.remove(); // cleanup 
      hide.remove();
    };
  }, []);

  const getCheckInWindow = () => { // find the time we are checking in 
    const hour = new Date().getHours(); // 0-23
    if (hour >= 6 && hour < 12) return 'checkIn1'; // morning
    if (hour >= 12 && hour < 17) return 'checkIn2'; // afternoon
    return 'checkIn3'; // evening
  };

  const handleSliderChange = (value, setValue, lastRef) => { // take in the value, the setter, and the ref to last value
    const rounded = Math.round(value); // round to nearest integer
    const isNearMilestone = milestones.some((m) => Math.abs(rounded - m) <= 1); // if 1 away from the milestone
    if (isNearMilestone) { // if we are near a milestone
      const nearest = milestones.reduce((a, b) => Math.abs(a - rounded) < Math.abs(b - rounded) ? a : b); // compare all milestones to find nearest
      if (nearest !== lastRef.current) { // only fire the haptic if we are at a new milestone
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // meduim impact
        lastRef.current = nearest; // update the ref to the new milestone
      }
      setValue(nearest); // make the value the milestone
    } else {
      setValue(value); // set to exact value
      lastRef.current = rounded; // update the ref to the exact value
    }
  };

  const toggleTag = (tag) => { // add or remove tag from selectedTags, the only way we can access the array is with setSelectedTags
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]); // remove if exists, add if not
  };

  const handleSave = async () => { // save the check-in
    const timestamp = new Date().toISOString(); // current time in ISO format
    const window = route.params?.window || getCheckInWindow(); // get the window from params or determine it
    const entry = { energy, clarity, emotion, note, window, timestamp, tags: selectedTags }; // create the entry object (default values)

    try {
      await AsyncStorage.setItem(`${timestamp}`, JSON.stringify(entry)); // save each entry by timestamp
      const historyRaw = await AsyncStorage.getItem('checkInHistory'); // get the check in history
      const history = historyRaw ? JSON.parse(historyRaw) : []; // check if history exists, if not make empty array
      history.push(entry); // add the entry to history
      await AsyncStorage.setItem('checkInHistory', JSON.stringify(history)); // stringify and save the history with the new entry
      await processCheckIn(entry); // update scores and momentum
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // success haptic
      if (window === 'checkIn3') { // if we are on check in 3
        navigation.navigate('MentalScore'); // return to main screen
      } else {
        navigation.goBack(); // go back to previous screen (mentalScore)
      }
    } catch (err) { // catch any errors
      console.error('❌ Error saving check-in:', err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save your check-in.');
    }
  };

  
  return (
    <Animatable.View animation="fadeIn" duration={400} style={{ flex: 1 }}>
    <LinearGradient colors={['#1C1F2E', '#12131C']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <CustomHeader />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 24, paddingBottom: 120, paddingTop: 70 }}
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
                    <Text style={styles.sliderValue}>{Math.round(item.value)}</Text>
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
    </Animatable.View>
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
  sliderValue: {
    color: '#FFFFFF',
    alignSelf: 'flex-end',
    marginBottom: 4,
    fontWeight: '600',
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

