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
import { markInsightRead, getCurrentScores, xpForLevel } from './utils/scoring';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';

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

const AnimatedMomentumBar = ({ value }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barBackground}>
      <Animated.View style={{ width, height: '100%' }}>
        <LinearGradient
          colors={['#c084fc', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.barFill}
        />
      </Animated.View>
    </View>
  );
};

const ScoreCircle = ({ score, size = 170, strokeWidth = 18 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size} style={styles.gaugeSvg}>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="#e6e6e6"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={getScoreColor(score)}
        strokeWidth={strokeWidth}
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeLinecap="round"
        rotation="-90"
        originX={cx}
        originY={cy}
        fill="none"
      />
    </Svg>
  );
};

const getScoreColor = (score) => {
  if (score <= 20) return '#FF3B30';
  if (score <= 40) return '#FF9500';
  if (score <= 55) return '#FFCC00';
  if (score <= 70) return '#AEF359';
  if (score <= 85) return '#4CD964';
  return '#2ECC71';
};
  


export default function MentalScoreScreen() {
  const navigation = useNavigation();
  const BASELINE = 75;
  const [energy, setEnergy] = useState(BASELINE);
  const [clarity, setClarity] = useState(BASELINE);
  const [emotion, setEmotion] = useState(BASELINE);
  const [focus, setFocus] = useState(BASELINE);
  const [score, setScore] = useState(BASELINE); // Define score state
  const [microInsight, setMicroInsight] = useState('Loading insight...');
  const [weeklyMindMirror, setWeeklyMindMirror] = useState('No MindMirror yet.');
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [xp, setXp] = useState({ xpToday: 0, total: 0, level: 1, progress: 0 });
  const [dailyGoal, setDailyGoal] = useState(null);
  const xpGainRef = useRef(null);
  const xpBarRef = useRef(null);
  const prevXp = useRef(0);
  const [xpDelta, setXpDelta] = useState(0);
  const [showLevelConfetti, setShowLevelConfetti] = useState(false);
  const prevLevel = useRef(0);

  useEffect(() => {
    if (microInsight && microInsight !== 'Loading insight...') {
      markInsightRead().then(() => {
        getCurrentScores().then((data) => {
          if (data.xp) setXp(data.xp);
          if (data.dailyGoal) setDailyGoal(data.dailyGoal);
          if (data.streak !== undefined) setStreak(data.streak);
          if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak);
        });
      });
    }
  }, [microInsight]);

  useEffect(() => {
    getCurrentScores().then((data) => {
      if (data.xp) setXp(data.xp);
      if (data.dailyGoal) setDailyGoal(data.dailyGoal);
      if (data.streak !== undefined) setStreak(data.streak);
      if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak);
    });
  }, []);

  useEffect(() => {
    if (xp.xpToday > prevXp.current) {
      const delta = xp.xpToday - prevXp.current;
      setXpDelta(delta);
      prevXp.current = xp.xpToday;
      xpGainRef.current?.fadeInDown(200).then(() => xpGainRef.current?.fadeOutUp(600));
      xpBarRef.current?.pulse(800);
    } else {
      prevXp.current = xp.xpToday;
    }
  }, [xp.xpToday]);

  useEffect(() => {
    if (xp.level > prevLevel.current) {
      setShowLevelConfetti(true);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      setTimeout(() => setShowLevelConfetti(false), 1600);
    }
    prevLevel.current = xp.level;
  }, [xp.level]);

  const energyAnim = useRef(new Animated.Value(BASELINE)).current;
  const clarityAnim = useRef(new Animated.Value(BASELINE)).current;
  const emotionAnim = useRef(new Animated.Value(BASELINE)).current;
  const focusAnim = useRef(new Animated.Value(BASELINE)).current;
  const scoreAnim = useRef(new Animated.Value(BASELINE)).current;
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
  const streakRef = useRef(null);

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
      try {
        const stored = await AsyncStorage.getItem('lastMetrics');
        if (stored) {
          const metrics = JSON.parse(stored);
          energyAnim.setValue(metrics.energy);
          clarityAnim.setValue(metrics.clarity);
          emotionAnim.setValue(metrics.emotion);
          focusAnim.setValue(metrics.focus);
          scoreAnim.setValue(metrics.score);
          setEnergy(metrics.energy);
          setClarity(metrics.clarity);
          setEmotion(metrics.emotion);
          setFocus(metrics.focus);
          setScore(metrics.score);
        }
      } catch (err) {
        console.error('❌ Error loading last metrics:', err);
      }

      await fetchCheckInData();
      await triggerMindMirror();
      await calculateStreak();
    };
    fetchData();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchCheckInData();
      calculateStreak();
      getCurrentScores().then((data) => {
        if (data.xp) setXp(data.xp);
        if (data.dailyGoal) setDailyGoal(data.dailyGoal);
        if (data.streak !== undefined) setStreak(data.streak);
        if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak);
      });
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
        setEnergy(BASELINE);
        setClarity(BASELINE);
        setEmotion(BASELINE);
        setFocus(BASELINE);
        setScore(BASELINE);
        await AsyncStorage.setItem(
          'lastMetrics',
          JSON.stringify({
            energy: BASELINE,
            clarity: BASELINE,
            emotion: BASELINE,
            focus: BASELINE,
            score: BASELINE,
          })
        );
        setMicroInsight('🔍 Start checking in to uncover patterns. Ready to begin?');
        return;
      }

      let currentEnergy = BASELINE;
      let currentClarity = BASELINE;
      let currentEmotion = BASELINE;

      const impactPerCheckIn = 20;

      sortedEntries.forEach((entry) => {
        if (entry.energy != null) {
          currentEnergy += ((entry.energy - currentEnergy) * impactPerCheckIn) / 100;
          currentClarity += ((entry.clarity - currentClarity) * impactPerCheckIn) / 100;
          currentEmotion += ((entry.emotion - currentEmotion) * impactPerCheckIn) / 100;
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
      await AsyncStorage.setItem(
        'lastMetrics',
        JSON.stringify({
          energy: currentEnergy,
          clarity: currentClarity,
          emotion: currentEmotion,
          focus: currentFocus,
          score: computedScore,
        })
      );

      // Generate Today's Insight with GPT after any check-in
      const latestEntry = sortedEntries[sortedEntries.length - 1];
      const insight = await generateTodaysInsight({
        energy: currentEnergy,
        clarity: currentClarity,
        emotion: currentEmotion,
        focus: currentFocus,
        note: latestEntry.note || '',
        tags: latestEntry.tags || [],
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
      setEnergy(BASELINE);
      setClarity(BASELINE);
      setEmotion(BASELINE);
      setFocus(BASELINE);
      setScore(BASELINE);
      await AsyncStorage.setItem(
        'lastMetrics',
        JSON.stringify({
          energy: BASELINE,
          clarity: BASELINE,
          emotion: BASELINE,
          focus: BASELINE,
          score: BASELINE,
        })
      );
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
      const [curRaw, longRaw] = await Promise.all([
        AsyncStorage.getItem('currentStreak'),
        AsyncStorage.getItem('longestStreak'),
      ]);
      const count = curRaw ? parseInt(curRaw, 10) : 0;
      const longest = longRaw ? parseInt(longRaw, 10) : 0;
      setStreak(count);
      setLongestStreak(longest);
      streakRef.current?.bounceIn();
      if (count > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      setEnergy(BASELINE);
      setClarity(BASELINE);
      setEmotion(BASELINE);
      setFocus(BASELINE);
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
      headerLeft: () => (
        <Animatable.Text
          onPress={() => navigation.navigate('History')}
          style={styles.headerButton}
        >
          History
        </Animatable.Text>
      ),
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
      <Animatable.View animation="bounceIn" duration={800} style={styles.gaugeContainer}>
        <ScoreCircle score={displayScore} />
        <Animatable.Text animation="pulse" iterationCount="infinite" iterationDelay={4000} style={styles.mentalScore}>
          {displayScore}
        </Animatable.Text>
      </Animatable.View>

      <Animatable.View ref={xpBarRef} style={[styles.momentumContainer, xp.progress > 90 && styles.levelGlow]}>
        <Text style={styles.momentumLabel}>
          Level {xp.level} — {xp.total} / {xpForLevel(xp.level + 1)} XP
        </Text>
        <AnimatedMomentumBar value={xp.progress} />
        <Animatable.Text ref={xpGainRef} style={styles.xpGainText}>
          +{xpDelta}
        </Animatable.Text>
        {showLevelConfetti && (
          <ConfettiCannon
            count={60}
            origin={{ x: 160, y: 0 }}
            fadeOut
          />
        )}
      </Animatable.View>



      <View style={styles.streakContainer}>
        <Animatable.Text ref={streakRef} style={styles.streakText}>
          🔥 {streak} Day Streak — Longest: {longestStreak} { [3,7,14,30,50].includes(streak) ? '🏅' : '' }
        </Animatable.Text>
      </View>
      {/* XP gain animation will show here */}

      {dailyGoal && (
        <View style={styles.gradeContainer}>
          <Text style={styles.gradeText}>
            Daily Goal: {dailyGoal.goal.text}
            {dailyGoal.completed ? ' ✅' : ''}
          </Text>
        </View>
      )}

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
            <AnimatedProgressBar progress={emotionProgress} color="#34d1bf" />
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
    marginTop: 30,
    paddingHorizontal: 24,
    backgroundColor: '#F2F2F7',
    paddingBottom: 40,
  },
  headerButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
    alignSelf: 'center',
    width: 170,
    height: 170,
  },
  gaugeSvg: {
    width: 170,
    height: 170,
    alignSelf: 'center',
  },

  mentalScore: {
    position: 'absolute',
    fontSize: 45,
    fontWeight: '700',
    color: '#000',
    marginBottom: 22,
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
    marginTop: -10,
    
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
  momentumContainer: {
    marginBottom: 16,
  },
  levelGlow: {
    shadowColor: '#7c3aed',
    shadowRadius: 6,
    shadowOpacity: 0.6,
  },
  momentumLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
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
  gradeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4c1d95',
  },
  xpGainText: {
    position: 'absolute',
    right: 0,
    top: -18,
    color: '#7c3aed',
    fontWeight: '700',
  },
});
