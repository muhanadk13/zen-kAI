import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import React, { useLayoutEffect, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateTodaysInsight,
  generateWeeklyMindMirror,
} from './utils/generateTodaysInsight';

const AnimatedProgressBar = ({ progress, color }) => {
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={styles.barBackground}>
      <Animated.View style={[styles.barFill, { backgroundColor: color, width }]} />
    </View>
  );
};

export default function MentalScoreScreen() {
  const navigation = useNavigation();
  const [energy, setEnergy] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [emotion, setEmotion] = useState(0);
  const [focus, setFocus] = useState(0);
  const [score, setScore] = useState(0); // Define score state
  const [microInsight, setMicroInsight] = useState('Loading insight...');
  const [weeklyMindMirror, setWeeklyMindMirror] = useState('No MindMirror yet.');
  const [streak, setStreak] = useState(0);

  const energyAnim = useRef(new Animated.Value(-1)).current;
  const clarityAnim = useRef(new Animated.Value(-1)).current;
  const emotionAnim = useRef(new Animated.Value(-1)).current;
  const focusAnim = useRef(new Animated.Value(-1)).current;
  const scoreAnim = useRef(new Animated.Value(-1)).current;
  const prevScore = useRef(-1); // Define prevScore ref

  const energyProgress = energyAnim.interpolate({
    inputRange: [-1, 0, 100],
    outputRange: [0, 0, 1],
  });
  const clarityProgress = clarityAnim.interpolate({
    inputRange: [-1, 0, 100],
    outputRange: [0, 0, 1],
  });
  const emotionProgress = emotionAnim.interpolate({
    inputRange: [-1, 0, 100],
    outputRange: [0, 0, 1],
  });
  const focusProgress = focusAnim.interpolate({
    inputRange: [-1, 0, 100],
    outputRange: [0, 0, 1],
  });

  const [displayEnergy, setDisplayEnergy] = useState(-1);
  const [displayClarity, setDisplayClarity] = useState(-1);
  const [displayEmotion, setDisplayEmotion] = useState(-1);
  const [displayFocus, setDisplayFocus] = useState(-1);
  const [displayScore, setDisplayScore] = useState(-1);
  const checkInButtonRef = useRef(null);

  useEffect(() => {
    const id = scoreAnim.addListener(({ value }) =>
      setDisplayScore(Math.round(value))
    );
    return () => scoreAnim.removeListener(id);
  }, []);

  useEffect(() => {
    const id = energyAnim.addListener(({ value }) =>
      setDisplayEnergy(Math.round(value))
    );
    return () => energyAnim.removeListener(id);
  }, []);

  useEffect(() => {
    Animated.timing(energyAnim, {
      toValue: energy,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [energy]);

  useEffect(() => {
    const id = clarityAnim.addListener(({ value }) =>
      setDisplayClarity(Math.round(value))
    );
    return () => clarityAnim.removeListener(id);
  }, []);

  useEffect(() => {
    Animated.timing(clarityAnim, {
      toValue: clarity,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [clarity]);

  useEffect(() => {
    const id = emotionAnim.addListener(({ value }) =>
      setDisplayEmotion(Math.round(value))
    );
    return () => emotionAnim.removeListener(id);
  }, []);

  useEffect(() => {
    Animated.timing(emotionAnim, {
      toValue: emotion,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [emotion]);

  useEffect(() => {
    const id = focusAnim.addListener(({ value }) =>
      setDisplayFocus(Math.round(value))
    );
    return () => focusAnim.removeListener(id);
  }, []);

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focus,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [focus]);

  useEffect(() => {
    const target = Math.round((energy + clarity + emotion + focus) / 4);
    setScore(target); // Update score state
  }, [energy, clarity, emotion, focus]);

  useEffect(() => {
    if (score < 0) return;
    if (prevScore.current > -1 && score < prevScore.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    prevScore.current = score;
    Animated.timing(scoreAnim, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [score]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Image
          style={{ width: 60, height: 60, marginLeft: 1, marginBottom: 8 }}
          resizeMode="contain"
        />
      ),
      headerTitle: () => (
        <Image
          source={require('./assets/logo-text.png')}
          style={{ width: 120, height: 40 }}
          resizeMode="contain"
        />
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchCheckInData();
      await triggerMindMirror();
      await calculateStreak();
    };
    fetchData();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchCheckInData();
      calculateStreak();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchCheckInData = async () => {
    try {
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const todayEntries = history.filter((entry) => entry.timestamp.startsWith(today));
      const sortedEntries = todayEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      if (sortedEntries.length === 0) {
        setEnergy(100);
        setClarity(100);
        setEmotion(100);
        setFocus(100);
        setScore(100);
        setMicroInsight('🔍 Start checking in to uncover patterns. Ready to begin?');
        return;
      }

      let currentEnergy = 100;
      let currentClarity = 100;
      let currentEmotion = 100;

      const impactPerCheckIn = 33.3;

      sortedEntries.forEach((entry) => {
        if (entry.energy != null) {
          const energyImpact = ((100 - entry.energy) * impactPerCheckIn) / 100;
          const clarityImpact = ((100 - entry.clarity) * impactPerCheckIn) / 100;
          const emotionImpact = ((100 - entry.emotion) * impactPerCheckIn) / 100;

          currentEnergy -= energyImpact;
          currentClarity -= clarityImpact;
          currentEmotion -= emotionImpact;
        }
      });

      currentEnergy = Math.max(0, Math.round(currentEnergy));
      currentClarity = Math.max(0, Math.round(currentClarity));
      currentEmotion = Math.max(0, Math.round(currentEmotion));
      const currentFocus = Math.round(0.6 * currentClarity + 0.4 * currentEnergy);
      const computedScore = Math.round(
        (currentEnergy + currentClarity + currentEmotion + currentFocus) / 4
      );

      setEnergy(currentEnergy);
      setClarity(currentClarity);
      setEmotion(currentEmotion);
      setFocus(currentFocus);
      setScore(computedScore);

      // Generate Today's Insight with GPT after any check-in
      const latestEntry = sortedEntries[sortedEntries.length - 1];
      const insight = await generateTodaysInsight({
        energy: currentEnergy,
        clarity: currentClarity,
        emotion: currentEmotion,
        focus: currentFocus,
        note: latestEntry.note || '',
        window: latestEntry.window,
        timestamp: latestEntry.timestamp,
      });
      setMicroInsight(insight);
      // Schedule notification for insight
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your Daily Insight is Ready! 🧠',
          body: 'Check out your mental performance insight for today.',
        },
        trigger: { seconds: 1 },
      });
    } catch (err) {
      console.error('❌ Error loading check-in data:', err);
      setEnergy(100);
      setClarity(100);
      setEmotion(100);
      setFocus(100);
      setScore(100);
      setMicroInsight(
        '🔍 Keep checking in to uncover patterns. What’s on your mind today?'
      );
    }
  };

  const triggerMindMirror = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const isSunday = today.getDay() === 0;
      const lastMindMirrorUpdate = await AsyncStorage.getItem('lastMindMirrorUpdate');
      const alreadyUpdated = lastMindMirrorUpdate && new Date(lastMindMirrorUpdate).toDateString() === today.toDateString();

      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyEntries = history.filter((entry) => new Date(entry.timestamp) >= weekAgo);

      if (isSunday && !alreadyUpdated && weeklyEntries.length >= 3) {
        const mindMirror = await generateWeeklyMindMirror();
        setWeeklyMindMirror(mindMirror);
        await AsyncStorage.setItem('lastMindMirrorUpdate', today.toISOString());
      } else {
        const stored = await AsyncStorage.getItem(`mindMirror-${todayStr}`);
        if (stored) setWeeklyMindMirror(stored);
      }
    } catch (err) {
      console.error('❌ Error triggering MindMirror:', err);
      setWeeklyMindMirror('No MindMirror yet.');
    }
  };

  const calculateStreak = async () => {
    try {
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const today = new Date().toISOString().split('T')[0];

      const sortedHistory = history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const uniqueDates = [...new Set(sortedHistory.map(entry => entry.timestamp.split('T')[0]))];

      let streakCount = 0;
      let currentDate = new Date(today);

      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const checkInDate = new Date(uniqueDates[i]);
        if (
          checkInDate.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
        ) {
          streakCount++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      setStreak(streakCount);
    } catch (err) {
      console.error('❌ Error calculating streak:', err);
      setStreak(0);
    }
  };

  const getCheckInWindow = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'checkIn1';
    if (hour >= 12 && hour < 17) return 'checkIn2';
    return 'checkIn3';
  };

  const handleCheckInPress = async () => {
    checkInButtonRef.current?.rubberBand(600);
    await Haptics.selectionAsync();
    const today = new Date().toISOString().split('T')[0];
    const window = getCheckInWindow();
    const key = `${today}-${window}`;
    const existing = await AsyncStorage.getItem(key);
    if (!existing) {
      navigation.navigate('CheckIn', { window });
      await calculateStreak();
    } else {
      Alert.alert('Already Checked In', 'You already completed this check-in.');
    }
  };

  const resetCheckIn3 = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.removeItem(`${today}-checkIn3`);
    Alert.alert('✅ Reset Complete', 'Check-In 3 has been cleared.');
  };

  const devLaunchCheckIn3 = () => {
    Haptics.selectionAsync();
    navigation.navigate('CheckIn', { window: 'checkIn3' });
  };

  const resetCheckIn1 = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.removeItem(`${today}-checkIn1`);
    Alert.alert('✅ Reset Complete', 'Check-In 1 has been cleared.');
  };

  const devLaunchCheckIn1 = () => {
    Haptics.selectionAsync();
    navigation.navigate('CheckIn', { window: 'checkIn1' });
  };

  const resetAllData = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await AsyncStorage.clear();
      console.log('✅ All data cleared successfully');
      Alert.alert('Reset Complete', 'All app data has been cleared.');
      setEnergy(100);
      setClarity(100);
      setEmotion(100);
      setFocus(100);
      setMicroInsight('Loading insight...');
      setWeeklyMindMirror('No MindMirror yet.');
    } catch (err) {
      console.error('❌ Error clearing data:', err);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('📈 **') || line.startsWith('📉 **') || line.startsWith('🔁 **') || line.startsWith('🧠 **')) {
        return (
          <Text key={index} style={styles.bold}>
            {line.replace(/\*\*(.*?)\*\*/, '$1')}
          </Text>
        );
      }
      return <Text key={index} style={styles.cardText}>{line}</Text>;
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Animatable.Text
          ref={checkInButtonRef}
          onPress={handleCheckInPress}
          style={styles.headerButton}
        >
          Check In
        </Animatable.Text>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animatable.View animation="fadeInDown" duration={800} style={styles.gaugeContainer}>
        <Image source={require('./assets/gauge.png')} style={styles.gaugeImage} resizeMode="contain" />
        <Text style={styles.mentalScore}>{displayScore}</Text>
        <Text style={styles.mentalScoreLabel}>MentalScore</Text>
      </Animatable.View>

      <View style={styles.streakContainer}>
        <Text style={styles.streakText}>🔥 {streak} Day Streak</Text>
      </View>

      <Animatable.View animation="fadeInUp" duration={600} style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={require('./assets/mirror.png')} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Weekly MindMirror</Text>
        </View>
        {renderMarkdown(weeklyMindMirror)}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={require('./assets/advice.png')} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Today’s Insight</Text>
        </View>
        <Text style={styles.cardText}>{microInsight}</Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.metricsSection}>
        <View style={styles.row}>
          <View style={[styles.metricBox, styles.metricBoxLeft]}>
            <Text style={styles.metricLabel}>⚡ Energy {displayEnergy}%</Text>
            <AnimatedProgressBar progress={energyProgress} color="#C3B1E1" />
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>💡 Clarity {displayClarity}%</Text>
            <AnimatedProgressBar progress={clarityProgress} color="#f5c065" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.metricBox, styles.metricBoxLeft]}>
            <Text style={styles.metricLabel}>💚 Emotion {displayEmotion}%</Text>
            <AnimatedProgressBar progress={emotionProgress} color="#7fe87a" />
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>🎯 Focus {displayFocus}%</Text>
          <AnimatedProgressBar progress={focusProgress} color="#60a5fa" />
          </View>
        </View>
      </Animatable.View>

      <View style={styles.resetContainer}>
        <TouchableOpacity onPress={resetCheckIn3} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset Check-In 3 (Dev)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={devLaunchCheckIn3} style={[styles.resetButton, { marginTop: 12, backgroundColor: '#3b82f6' }]}>
          <Text style={styles.resetButtonText}>Open Check-In 3 (Dev)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resetCheckIn1} style={[styles.resetButton, { marginTop: 12, backgroundColor: '#ef4444' }]}>
          <Text style={styles.resetButtonText}>Reset Check-In 1 (Dev)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={devLaunchCheckIn1} style={[styles.resetButton, { marginTop: 12, backgroundColor: '#3b82f6' }]}>
          <Text style={styles.resetButtonText}>Open Check-In 1 (Dev)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={resetAllData} 
          style={[styles.resetButton, { marginTop: 12, backgroundColor: '#dc2626' }]}
        >
          <Text style={styles.resetButtonText}>Reset All Data (Dev)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => triggerMindMirror()} 
          style={[styles.resetButton, { marginTop: 12, backgroundColor: '#10b981' }]}
        >
          <Text style={styles.resetButtonText}>Generate MindMirror (Dev)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -20,
    paddingHorizontal: 24,
    backgroundColor: '#F2F2F7',
    paddingBottom: 40,
  },
  headerButton: {
    marginRight: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  gaugeImage: {
    width: 360,
    height: 240,
  },
  mentalScore: {
    position: 'absolute',
    top: '38%',
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
    marginTop: 30,
  },
  mentalScoreLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
    marginTop: -70,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF4500',
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: '#333',
    marginTop: 2,
  },
  bold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginVertical: 4,
  },
  metricsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
  },
  metricBoxLeft: {
    marginRight: 12,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  barBackground: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  resetContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});