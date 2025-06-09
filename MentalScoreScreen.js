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
import { generateTodaysInsight } from './utils/generateTodaysInsight';
import { getWeeklyMindMirror } from './utils/mindMirror';
import { markInsightRead, getCurrentScores, xpForLevel } from './utils/scoring';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import LottieView from 'lottie-react-native'; // Import Lottie
import { BlurView } from 'expo-blur'; // Add this import if not already at the top


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
colors={[
  '#04ca76', // green
  '#1cf1b7', // aqua
  '#00a6cb', // cyan blue
  '#1cadf1', // sky blue
  '#6279f5', // indigo-blue bridge
  '#9048f7', // purple
  '#ae6ef7', // soft lavender end
]}
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
    <View style={styles.gaugeGlow}>
      <Svg width={size} height={size} style={styles.gaugeSvg}>
        <Defs>
        <SvgLinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
  <Stop offset="0%" stopColor="#04ca76" />
  <Stop offset="16.6%" stopColor="#1cf1b7" />
  <Stop offset="33.3%" stopColor="#00a6cb" />
  <Stop offset="50%" stopColor="#1cadf1" />
  <Stop offset="66.6%" stopColor="#6279f5" />
  <Stop offset="83.3%" stopColor="#9048f7" />
  <Stop offset="100%" stopColor="#ae6ef7" />
</SvgLinearGradient>

        </Defs>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#2E3340"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round"
          rotation="-90"
          originX={cx}
          originY={cy}
          fill="none"
        />
      </Svg>
    </View>
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
  const scrollViewRef = useRef(null); // Add a reference for the ScrollView
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
  const prevLevel = useRef(0);
  const [showConfetti, setShowConfetti] = useState(false); // Confetti state
  const scoreAnim = useRef(new Animated.Value(BASELINE)).current;
  const [displayedInsight, setDisplayedInsight] = useState('');
  const insightIntervalRef = useRef(null);
  const [insightRevealed, setInsightRevealed] = useState(false); // Insight reveal state
  const [devMode, setDevMode] = useState(false);
  const tapCount = useRef(0);
  const lastTap = useRef(0);

  const handleLogoPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 1000) {
      tapCount.current += 1;
    } else {
      tapCount.current = 1;
    }
    lastTap.current = now;
    if (tapCount.current >= 5) {
      setDevMode(true);
    }
  };

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
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      setShowConfetti(true); // 🎉 Show confetti
    }
    prevLevel.current = xp.level;
  }, [xp.level]);

  const energyAnim = useRef(new Animated.Value(BASELINE)).current;
  const clarityAnim = useRef(new Animated.Value(BASELINE)).current;
  const emotionAnim = useRef(new Animated.Value(BASELINE)).current;
  const focusAnim = useRef(new Animated.Value(BASELINE)).current;
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
      duration: 800,
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
      duration: 800,
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
      duration: 800,
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
      duration: 800,
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
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score]);


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
      const mirror = await getWeeklyMindMirror();
      setWeeklyMindMirror(mirror);
      await calculateStreak();
      const data = await getCurrentScores();
      if (data.xp) setXp(data.xp);
      if (data.dailyGoal) setDailyGoal(data.dailyGoal);
      if (data.streak !== undefined) setStreak(data.streak);
      if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak);
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
    // Scroll to the top before triggering the animation
    await new Promise((resolve) => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(resolve, 500); // Wait for the scroll animation to complete (adjust duration if needed)
    });
  
    // Trigger the check-in animation and navigation
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
      setXp({ xpToday: 0, total: 0, level: 1, progress: 0 });
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
      headerShown: true,
      headerTransparent: true,
      headerBackground: () => (
        <BlurView
          tint="dark"
          intensity={90}
          style={{ flex: 1 }}
        />
      ),
      headerTitle: () => (
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogoPress}>
          <Image
            source={require('./assets/logo-text-only.png')}
            style={{ width: 360, height: 120, marginBottom: 8 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ),
      headerLeft: devMode
        ? () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('History')}
              style={{ paddingLeft: 16 }}
            >
              <Image
                source={require('./assets/logo-japan.png')}
                style={{ width: 50, height: 50, marginLeft: 8, marginBottom: 8 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )
        : undefined,
      headerRight: () => (
        <Animatable.Text
          ref={checkInButtonRef}
          onPress={handleCheckInPress}
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#51C4FF',
            paddingRight: 16,
          }}
        >
          Check In
        </Animatable.Text>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation, devMode]);

  useEffect(() => {
    if (!insightRevealed) return;
  
    // Only animate if microInsight is a clean, valid string
    if (
      typeof microInsight !== 'string' ||
      microInsight.length < 10 ||
      microInsight === 'Loading insight...'
    ) {
      setDisplayedInsight('⚠️ Insight unavailable. Try again.');
      return;
    }
  
    // Cancel previous interval if it exists
    if (insightIntervalRef.current) {
      clearInterval(insightIntervalRef.current);
      insightIntervalRef.current = null;
    }
  
    // Clean up the text but DO NOT overtrim
    const cleanedInsight = microInsight
      .replace(/\bundefined\b/gi, '')       // Remove weird 'undefined'
      .replace(/\s+/g, ' ')                 // Normalize spaces
      .replace(/\.\.+/g, '.')               // Remove double periods
      .trim();
  
    let index = 0;
    setDisplayedInsight('');
  
    // Animate character-by-character safely
    insightIntervalRef.current = setInterval(() => {
      setDisplayedInsight((prev) => {
        // Stop if string goes out of bounds
        if (index >= cleanedInsight.length) {
          clearInterval(insightIntervalRef.current);
          insightIntervalRef.current = null;
          return prev;
        }
        return prev + cleanedInsight.charAt(index++);
      });
    }, 30); // ~60fps speed
  }, [insightRevealed]);
  
  
  
  
  
  
  return (
<LinearGradient
  colors={['#1C1F2E', '#12131C']}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={styles.container}
>
  {showConfetti && (
    <LottieView
      source={require('./assets/animations/confetti.json')}
      autoPlay
      loop={false}
      onAnimationFinish={() => setShowConfetti(false)}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    />
  )}
  <ScrollView 
    ref={scrollViewRef} // Attach the reference to the ScrollView
    contentContainerStyle={styles.scrollContainer}
  >
      <Animatable.View animation="bounceIn" duration={800} style={styles.gaugeContainer}>
        <ScoreCircle score={displayScore} />
        <Animatable.Text animation="pulse" iterationCount="infinite" iterationDelay={4000} style={styles.mentalScore}>
          {displayScore}
        </Animatable.Text>
      </Animatable.View>

      <Animatable.View ref={xpBarRef} style={[styles.momentumContainer, xp.progress > 90 && styles.levelGlow]}>
        <Text style={styles.momentumLabel}>
          Level {xp.level} — {xp.total - xpForLevel(xp.level)} / {xpForLevel(xp.level + 1) - xpForLevel(xp.level)} XP
        </Text>
        <AnimatedMomentumBar value={xp.progress} />
        <Animatable.Text ref={xpGainRef} style={styles.xpGainText}>
          +{xpDelta}
        </Animatable.Text>
      </Animatable.View>



      <View style={styles.streakContainer}>
        <Animatable.Text ref={streakRef} style={styles.streakText}>
          <Image
            source={require('./assets/GIF/fire.gif')}
            style={styles.streakIcon}
          /> {streak} Day Streak{ [3,7,14,30,50].includes(streak) ? '🏅' : '' }
        </Animatable.Text>
      </View>
      {/* XP gain animation will show here */}

      

      <LinearGradient
colors={['#646DFF', '#D7A4FF']} // Duolingo-style gradient
start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.cardGradient}
>
  <Animatable.View animation="fadeInUp" duration={600} style={styles.cardInner}>
    <View style={styles.cardHeader}>
      <Image source={require('./assets/mirror.png')} style={styles.cardIcon} />
      <Text style={styles.cardTitle}>Weekly MindMirror</Text>
    </View>
    {renderMarkdown(weeklyMindMirror)}
  </Animatable.View>
</LinearGradient>


<LinearGradient
  colors={['#646DFF', '#D7A4FF']} // Duolingo-style gradient
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.cardGradient}
>
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => setInsightRevealed(true)}
    disabled={insightRevealed} // Disable tap after revealing
    style={[
      styles.cardInner,
      !insightRevealed && { backgroundColor: '#2E3340', opacity: 0.6 }, // Grayed-out style
    ]}
  >
    <View style={styles.cardHeader}>
      <Image source={require('./assets/advice.png')} style={styles.cardIcon} />
      <Text style={styles.cardTitle}>Today’s Insight</Text>
    </View>
    {insightRevealed ? (
      <Text style={styles.cardText}>{displayedInsight}</Text>
    ) : (
      <Text style={[styles.cardText, { textAlign: 'center', fontStyle: 'italic' }]}>
        Tap to Reveal Insight
      </Text>
    )}
  </TouchableOpacity>
</LinearGradient>


<View style={styles.metricsGradient}>
  <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.metricsGrid}>
    <View style={styles.metricsRow}>
      <LinearGradient
        colors={['#00e89f', '#04ca76']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.metricBorder}
      >
        <View style={styles.metricPill}>
          <Text style={styles.metricIcon}>⚡</Text>
          <Text style={styles.metricName}>Energy</Text>
          <Text style={styles.metricValue}>{displayEnergy}%</Text>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['#facc15', '#f59e0b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.metricBorder}
      >
        <View style={styles.metricPill}>
          <Text style={styles.metricIcon}>💡</Text>
          <Text style={styles.metricName}>Clarity</Text>
          <Text style={styles.metricValue}>{displayClarity}%</Text>
        </View>
      </LinearGradient>
    </View>

    <View style={styles.metricsRow}>
      <LinearGradient
        colors={['#22d3ee', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.metricBorder}
      >
        <View style={styles.metricPill}>
          <Text style={styles.metricIcon}>💚</Text>
          <Text style={styles.metricName}>Emotion</Text>
          <Text style={styles.metricValue}>{displayEmotion}%</Text>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['#a78bfa', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.metricBorder}
      >
        <View style={styles.metricPill}>
          <Text style={styles.metricIcon}>🎯</Text>
          <Text style={styles.metricName}>Focus</Text>
          <Text style={styles.metricValue}>{displayFocus}%</Text>
        </View>
      </LinearGradient>
    </View>
  </Animatable.View>
</View>



      {devMode && (
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
          onPress={async () => {
            const mirror = await getWeeklyMindMirror();
            setWeeklyMindMirror(mirror);
          }}
          style={[styles.resetButton, { marginTop: 12, backgroundColor: '#10b981' }]}
        >
          <Text style={styles.resetButtonText}>Generate MindMirror (Dev)</Text>
        </TouchableOpacity>
      </View>
      )}
      </ScrollView>
</LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 40,

  },
  
  headerButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#51C4FF', // Blue CTA
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
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
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  streakText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e8b923',
    marginTop: -10,
  },
  streakIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  card: {
    backgroundColor: '#1C1E29',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    color: '#A9A9B3',
  },
  bold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 6,
  },
  metricsSection: {
    backgroundColor: '#212532',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
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
    color: '#FFFFFF',
  },
  barBackground: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E3340',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#51C4FF', // Active fill
  },
  momentumContainer: {
    marginBottom: 30,
  },
  momentumLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  levelGlow: {
    shadowColor: '#B48DFF',
    shadowRadius: 10,
    shadowOpacity: 0.7,
  },
  resetContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#FF5858',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  gradeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#B48DFF',
  },
  xpGainText: {
    position: 'absolute',
    right: 0,
    top: -18,
    color: '#7CF67C',
    fontWeight: '800',
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
  metricsGradient: {
    borderRadius: 22,
    padding: 2,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  
  metricsInner: {
    backgroundColor: '#212532',
    borderRadius: 20,
    padding: 18,
  },
  
 metricsGrid: {
  paddingVertical: 12,
  paddingHorizontal: 6,
},

metricsRow: {
  flexDirection: 'row',
  justifyContent: 'space-evenly',
  marginBottom: 16,
},

metricBorder: {
  flex: 1,
  marginHorizontal: 6,
  borderRadius: 22,
  padding: 2, // border thickness
},

metricPill: {
  backgroundColor: '#1F2233',
  borderRadius: 20,
  paddingVertical: 16,
  paddingHorizontal: 10,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 3,
},

metricIcon: {
  fontSize: 24,
  marginBottom: 4,
},

metricName: {
  fontSize: 14,
  fontWeight: '600',
  color: '#A0A5B9',
  marginBottom: 4,
},

metricValue: {
  fontSize: 20,
  fontWeight: '800',
  color: '#FFFFFF',
},

  
});
