import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated, // ✅ ADD THIS LINE
} from 'react-native';

import React, { useRef, useState, useEffect } from 'react';

import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import PagerView from 'react-native-pager-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { generatePersonalizedReminder } from './utils/generatePersonalizedReminder';
import * as Animatable from 'react-native-animatable';


function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatDisplayTime(hour, minute) {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute.toString().padStart(2, '0')}${suffix}`;
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
  const [energy, setEnergy] = useState(50);
  const [clarity, setClarity] = useState(50);
  const [emotion, setEmotion] = useState(50);
  const [typedText, setTypedText] = useState('');
  const [chat, setChat] = useState('');
  const chatRef = useRef(null);
  const [showPickerIndex, setShowPickerIndex] = useState(null);

  const fullMessage = "At the end of the day, zen-kAI will talk with you. It asks questions. You answer. Together, you uncover what really matters. This builds your personalized insights over time. (Type 'Understood')";

  const glowAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 2500,
        useNativeDriver: false,
      }),
    ])
  ).start();
}, []);

const interpolatedGlow = glowAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0.98, 1],
});

  useEffect(() => {
    if (currentPage === 3) {
      let i = 0;
      setTypedText('');
      const interval = setInterval(() => {
        setTypedText((prev) => {
          if (i < fullMessage.length) {
            Haptics.selectionAsync();
            return prev + fullMessage[i++];
          } else {
            clearInterval(interval);
            setTimeout(() => chatRef.current?.focus(), 400);
            return prev;
          }
        });
      }, 35);
      return () => clearInterval(interval);
    }
  }, [currentPage]);

  const handleTimeChange = (event, selectedDate) => {
    if (selectedDate && showPickerIndex !== null) {
      const updated = [...times];
      updated[showPickerIndex] = selectedDate;
      setTimes(updated);
    }
    setShowPickerIndex(null);
  };

  async function scheduleReminder(window, hour, minute) {
    let message;
    try {
      message = await generatePersonalizedReminder(window);
    } catch {
      const labelMap = { checkIn1: 'morning', checkIn2: 'afternoon', checkIn3: 'evening' };
      const label = labelMap[window] || window;
      message = `Don't miss today's ${label} check-in—your growth awaits! 🌱`;
    }

    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);
    if (triggerDate <= new Date()) triggerDate.setDate(triggerDate.getDate() + 1);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'zen-kAI',
        body: message,
        sound: true,
      },
      trigger: { type: 'date', date: triggerDate },
    });

    const labelMap = { checkIn1: 'morning', checkIn2: 'afternoon', checkIn3: 'evening' };
    const label = labelMap[window] || window;
    const timeStr = formatDisplayTime(hour, minute);
    console.log(`✅ GPT Reminder (${label}): "${message}" (${timeStr})`);
  }

  async function requestPermission() {
    if (!Device.isDevice) return false;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  async function scheduleNotifications() {
    const permission = await requestPermission();
    if (!permission) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await scheduleReminder('checkIn1', times[0].getHours(), times[0].getMinutes());
    await scheduleReminder('checkIn2', times[1].getHours(), times[1].getMinutes());
    await scheduleReminder('checkIn3', times[2].getHours(), times[2].getMinutes());
  }

  const [isLoading, setIsLoading] = useState(false);

  const saveAndStart = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        AsyncStorage.multiSet([
          ['checkIn1Time', formatTime(times[0])],
          ['checkIn2Time', formatTime(times[1])],
          ['checkIn3Time', formatTime(times[2])],
          ['onboardingComplete', 'true'],
        ]),
        scheduleNotifications()
      ]);
    } catch (err) {
      console.error('Setup failed:', err);
    }
  
    setIsLoading(false);
    navigation.reset({ index: 0, routes: [{ name: 'MentalScore' }] });
  };
  

  return (
    <Animatable.View animation="fadeIn" duration={400} style={{ flex: 1 }}>
      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        scrollEnabled={false}
      >
      {/* Page 0: Welcome */}
      <View key="0">
        <Pressable style={{ flex: 1 }} onPress={() => pagerRef.current?.setPage(1)}>
          <LinearGradient colors={["#1C1F2E", "#12131C"]} style={styles.page}>
            <Image source={require('./assets/logo-japan.png')} style={[styles.logo, { height: 240, width: 240 }]} />
            <Text style={styles.title}>Welcome to zen-kAI</Text>
            <Text style={styles.subtext}>Tap to begin your journey.</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Page 1: Sliders */}
      <View key="1">
        <LinearGradient colors={["#1C1F2E", "#12131C"]} style={[styles.page, { paddingTop: 60 }]}>
          <Text style={styles.title}>30-Second Check-Ins</Text>
          <Text style={styles.subtext}>Three times a day, you’ll slide to rate how you feel.
That’s it. Add a note (Optional: Highly Recommended)</Text>
          {[{
            label: 'ENERGY', value: energy, set: setEnergy, color: '#26D07C', leftText: 'Depleted', rightText: 'Energized'
          }, {
            label: 'CLARITY', value: clarity, set: setClarity, color: '#4F9BFF', leftText: 'Foggy', rightText: 'Focused'
          }, {
            label: 'EMOTION', value: emotion, set: setEmotion, color: '#FFC542', leftText: 'Down', rightText: 'Upbeat'
          }].map((s) => (
            <LinearGradient key={s.label} colors={['#646DFF', '#D7A4FF']} style={styles.cardGradient}>
              <View style={styles.cardInner}>
                <Text style={styles.sliderLabel}>{s.label}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={s.value}
                  onValueChange={(v) => s.set(v)}
                  minimumTrackTintColor={s.color}
                  maximumTrackTintColor="#ccc"
                  thumbTintColor={s.color}
                />
                <Text style={styles.sliderValue}>{Math.round(s.value)}</Text>
                <View style={styles.range}><Text style={styles.rangeText}>{s.leftText}</Text><Text style={styles.rangeText}>{s.rightText}</Text></View>
              </View>
            </LinearGradient>
          ))}
          <TouchableOpacity style={[styles.begin, { marginTop: 20 }]} onPress={() => pagerRef.current?.setPage(2)}>
            <Text style={styles.beginText}>Got it</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

     {/* Page 2: Time Picker */}
      <View key="2">
        <LinearGradient colors={["#1C1F2E", "#12131C"]} style={styles.page}>
          <Text style={styles.title}>Pick Your Check-In Times</Text>
          <Text style={styles.subtext}>
          Choose when you want to be reminded to check in.
          </Text>
          <View style={styles.timeRow}>
            {[0, 1, 2].map((i) => (
              <TouchableOpacity key={i} style={styles.time} onPress={() => setShowPickerIndex(i)}>
                <Text style={styles.timeText}>{formatTime(times[i])}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.begin} onPress={() => pagerRef.current?.setPage(3)}>
            <Text style={styles.beginText}>Set Reminders →</Text>
          </TouchableOpacity>

          {/* iOS Picker Modal */}
          {showPickerIndex !== null && Platform.OS === 'ios' && (
            <Modal transparent animationType="fade">
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000088' }}>
                <View style={{ backgroundColor: '#1F2233', borderRadius: 16, padding: 12 }}>
                  <DateTimePicker
                    value={times[showPickerIndex]}
                    mode="time"
                    display="spinner"
                    textColor="#FFFFFF"
                    onChange={handleTimeChange}
                    style={{ backgroundColor: '#1F2233' }}
                  />
                  <TouchableOpacity onPress={() => setShowPickerIndex(null)} style={{ marginTop: 10, alignSelf: 'center' }}>
                    <Text style={{ color: '#51C4FF', fontWeight: '600', fontSize: 16 }}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* Android Default Picker */}
          {showPickerIndex !== null && Platform.OS !== 'ios' && (
            <DateTimePicker
              value={times[showPickerIndex]}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </LinearGradient>
      </View>
{/* Page 3: Reflection */}
<View key="3" style={{ flex: 1, backgroundColor: '#0E1117' }}>
  <KeyboardAvoidingView
    style={{ flex: 1, paddingHorizontal: 20 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : 0}
  >
    {/* Header */}
    <BlurView
  intensity={30}
  tint="dark"
  style={{
    marginTop: 40, // 👈 Push header down
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  }}
>
  <Text style={{ fontSize: 26, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
    Reflection
  </Text>
  <Text style={{ fontSize: 14, color: '#8A8F98', marginTop: 4, textAlign: 'center' }}>
    Guided by zen-kAI
  </Text>
</BlurView>


    <View style={{ flex: 1 }}>
      {/* AI Message Bubble below header */}
      <View style={{
        marginTop: 65,
        alignSelf: 'flex-start',
        backgroundColor: '#1C1E29',
        padding: 16,
        borderRadius: 20,
        maxWidth: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, lineHeight: 22 }}>
          {typedText}
        </Text>
      </View>

      {/* Push content to bottom */}
      <View style={{ flex: 1 }} />

      {/* Input bar at bottom */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderTopWidth: 1,
        borderTopColor: '#1F232B',
        backgroundColor: '#12141B',
        marginBottom: 10,
        borderRadius: 18,
      }}>
        <TextInput
          ref={chatRef}
          style={{
            flex: 1,
            backgroundColor: '#1F2233',
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 16,
            color: '#FFFFFF',
          }}
          value={chat}
          onChangeText={setChat}
          placeholder="Type your response..."
          placeholderTextColor="#7C7C8A"
          returnKeyType="done"
          onSubmitEditing={() => pagerRef.current?.setPage(4)}
        />
        <Pressable onPress={() => pagerRef.current?.setPage(4)} style={{
          marginLeft: 12,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#1F2233',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#51C4FF',
          shadowOpacity: 0.5,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 4,
        }}>
          <Ionicons name="arrow-up" size={24} color="#51C4FF" />
        </Pressable>
      </View>
    </View>
  </KeyboardAvoidingView>
</View>






      {/* Page 4: Mental Score */}
      <View key="4">
  <LinearGradient
    colors={["#1C1F2E", "#12131C"]}
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
    }}
  >
    <Text
      style={{
        fontSize: 36, // ⬆️ Increased size
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
      }}
    >
Your Mind’s Dashboard    </Text>

<Animated.View
  style={{
    padding: 3,
    borderRadius: 26,
  }}
>
  <LinearGradient
    colors={['#646DFF', '#D7A4FF']}
    style={{
      borderRadius: 24,
      padding: 2,
    }}
  >
    <View
      style={{
        backgroundColor: '#1F2235',
        borderRadius: 22,
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      <Image
        source={require('./assets/mentalscore.png')}
        style={{
          width: 320,
          height: 170,
          marginBottom: 24,
        }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontSize: 18,
          color: '#C5C7D0',
          textAlign: 'center',
          lineHeight: 26,
        }}
      >
       Zen-kAI analyzes every check-in and reflection to uncover evolving mental patterns — in real time.{"\n\n"}
  Your Mental Score is a live indicator of how aligned, energized, and emotionally clear you are throughout the day.{"\n\n"}
  With each update, Zen-kAI adapts — revealing trends, pinpointing stressors, and guiding your growth like never before.
      </Text>
    </View>
  </LinearGradient>
</Animated.View>


    <TouchableOpacity
      style={{
        backgroundColor: '#5A5DF0',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 100,
        marginTop: 20,
        shadowColor: '#5A5DF0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
      }}
      onPress={() => pagerRef.current?.setPage(5)}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 18, // ⬆️ Bolder CTA text
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        Next →
      </Text>
    </TouchableOpacity>
  </LinearGradient>
</View>


      {/* Page 5: Success Screen */}
      <View key="5">
  <LinearGradient
    colors={["#1C1F2E", "#12131C"]}
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    }}
  >
    <Image
      source={require('./assets/logo-japan.png')}
      style={{
        width: 200,
        height: 200,
        marginBottom: 32,
        resizeMode: 'contain',
      }}
    />

    <Text
      style={{
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
      }}
    >
      You’re all set 🎉
    </Text>

    <Text
      style={{
        fontSize: 18,
        color: '#A0A5B9',
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 40,
      }}
    >
      Zen-kAI is ready to guide your mind.{"\n"}
      Daily insights, clarity, and growth start now.
    </Text>

    <TouchableOpacity
      disabled={isLoading}
      onPress={saveAndStart}
      style={{
        backgroundColor: '#5A5DF0',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 100,
        shadowColor: '#5A5DF0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        {isLoading ? 'Loading...' : 'Enter the App →'}
      </Text>
    </TouchableOpacity>

    {isLoading && (
      <Text style={{ color: '#A0A5B9', marginTop: 16 }}>
        Preparing your experience...
      </Text>
    )}
  </LinearGradient>
</View>





    </PagerView>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0E1117',
  },
  logo: {
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtext: {
    textAlign: 'center',
    fontSize: 20,
    color: '#A0A5B9',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  cardGradient: {
    borderRadius: 22,
    padding: 2,
    marginBottom: 20,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  cardInner: {
    backgroundColor: '#1C1E29',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  slider: {
    width: '100%',
    height: 40,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
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
    marginTop: 4,
  },
  rangeText: {
    color: '#A0A5B9',
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2233',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2233',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#51C4FF',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
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
  gauge: {
    resizeMode: 'contain',
    marginBottom: 24,
  },
});
