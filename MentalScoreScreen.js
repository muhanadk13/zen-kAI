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
  Easing,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateTodaysInsight } from './utils/generateTodaysInsight'; // gets the functions from this page
import { getWeeklyMindMirror } from './utils/mindMirror'; // gets the functions from this page
import { markInsightRead, getCurrentScores, xpForLevel, resetStreakIfNeeded, getScoreHistory } from './utils/scoring';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Polyline, Text as SvgText, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg'; // create circle
import LottieView from 'lottie-react-native'; // Import Lottie
import { BlurView } from 'expo-blur'; // blur the header

const CustomHeader = ({ onLogoPress, devMode, navigation, handleCheckInPress }) => {
  return (
    <BlurView
      tint="dark"
      intensity={80}
      style={{ width: '100%', height: 100, paddingTop: 40, paddingHorizontal: 16, zIndex: 1000, position: 'absolute' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {/* Center: Logo */}
        <TouchableOpacity activeOpacity={1} onPress={onLogoPress}>
          <Image
            source={require('./assets/logo-text-only.png')}
            style={{ width: 320, height: 100 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Left: Japan logo */}
        <View style={{ position: 'absolute', left: 20, top: '50%', transform: [{ translateY: -25 }] }}>
          {devMode ? (
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Image
                source={require('./assets/logo-japan.png')}
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            <Image
              source={require('./assets/logo-japan.png')}
              style={{ width: 50, height: 50 }}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Right: Check-In */}
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: '60%',
            transform: [{ translateY: -60 }],
            width: 100,
            height: 100,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity onPress={handleCheckInPress}>
            <Image
              source={require('./assets/check.png')}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
};


const AnimatedMomentumBar = ({ value }) => {
  // Create a persistent animated value that starts at 0
  const anim = useRef(new Animated.Value(0)).current;

  // Animate to the new value whenever 'value' changes
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,           // Animate from current to new value
      duration: 600,            // Animation duration in ms
      useNativeDriver: false,   // Native driver doesn't support width animation
    }).start();
  }, [value]);

  // Interpolate 0–100 range into percentage widths for styling
  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Render the background bar and animated fill
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
          start={{ x: 0, y: 0 }} // Left side of bar
          end={{ x: 1, y: 0 }}   // Right side of bar
          style={styles.barFill}
        />
      </Animated.View>
    </View>
  );
};


const ScoreCircle = ({ score, size = 170, strokeWidth = 18 }) => {
  // Calculate geometry for the circle
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

        {/* Background ring (unfilled) */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#2E3340"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress ring with gradient fill */}
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

const ScoreHistoryOverlay = ({ visible, onClose, history, selected, onSelect }) => {
  if (!visible) return null;
  const { width: screenWidth } = Dimensions.get('window');
  const width = screenWidth * 0.9;
  const height = 220;
  const padding = 24;
  const path = history.length
    ? history
        .map((h, idx) => {
          const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
          const y = h.score == null
            ? height - padding
            : height - padding - ((h.score - 300) / 600) * (height - padding * 2);
          return `${x},${y}`;
        })
        .join(' ')
    : '';

  return (
    <View style={styles.historyOverlay}>
      <TouchableOpacity style={styles.historyClose} onPress={onClose}>
        <Text style={styles.historyCloseText}>✕</Text>
      </TouchableOpacity>
      {selected != null && (
        <Animatable.View animation="bounceIn" duration={600} style={{ marginBottom: 20 }}>
          <ScoreCircle score={(selected - 300) / 6} size={120} strokeWidth={14} />
        </Animatable.View>
      )}
      <Svg width={width} height={height} style={styles.historySvg}>
        <Defs>
          <SvgLinearGradient id="historyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#04ca76" />
            <Stop offset="16.6%" stopColor="#1cf1b7" />
            <Stop offset="33.3%" stopColor="#00a6cb" />
            <Stop offset="50%" stopColor="#1cadf1" />
            <Stop offset="66.6%" stopColor="#6279f5" />
            <Stop offset="83.3%" stopColor="#9048f7" />
            <Stop offset="100%" stopColor="#ae6ef7" />
          </SvgLinearGradient>
        </Defs>
        {path && (
          <Polyline points={path} fill="none" stroke="#ae6ef7" strokeWidth={3} />
        )}
        {history.map((h, idx) => {
          const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
          const y = h.score == null
            ? height - padding
            : height - padding - ((h.score - 300) / 600) * (height - padding * 2);
          const display = h.score != null ? Math.round((h.score - 300) / 6) : null;
          return (
            <React.Fragment key={idx}>
              <Circle
                cx={x}
                cy={y}
                r={7}
                fill="url(#historyGradient)"
                stroke="#fff"
                strokeWidth={2}
                onPress={() => h.score != null && onSelect(h.score)}
              />
              {display != null && (
                <SvgText
                  x={x}
                  y={y - 10}
                  fontSize="12"
                  fill="white"
                  alignmentBaseline="middle"
                  textAnchor="middle"
                >
                  {display}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const OrbitingButtons = ({ size = 170 }) => {
    const navigation = useNavigation();
    const orbitRadius = size / 2 + 35;
  
    const buttons = Array.from({ length: 6 });
  
    return (
      <View
        pointerEvents="box-none"
        style={[
          styles.orbitContainer,
          { width: size + 100, height: size + 100 },
        ]}
      >
        {buttons.map((_, idx) => {
          const angle = (idx / buttons.length) * 2 * Math.PI;
          const x = orbitRadius * Math.cos(angle);
          const y = orbitRadius * Math.sin(angle);
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => idx === 0 && navigation.navigate('Reflection')}
              style={[
                styles.orbitButton,
                { transform: [{ translateX: x }, { translateY: y }] },
              ]}
            >
              <Text style={styles.orbitButtonLabel}>{idx + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  

  

export default function MentalScoreScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null); // Add a reference for the ScrollView
  const BASELINE = 75; // start for all metrics
  const [energy, setEnergy] = useState(BASELINE);
  const [clarity, setClarity] = useState(BASELINE);
  const [emotion, setEmotion] = useState(BASELINE);
  const [focus, setFocus] = useState(BASELINE);
  const [mindScore, setMindScore] = useState(600); // Momentum-based mental score
  const [microInsight, setMicroInsight] = useState('Loading insight...'); // insight will be loading.. unless set
  const [weeklyMindMirror, setWeeklyMindMirror] = useState('No MindMirror yet.'); // mindmirror is the same
  const [streak, setStreak] = useState(0); 
  const [longestStreak, setLongestStreak] = useState(0); // not used yet
  const [xp, setXp] = useState({ xpToday: 0, total: 0, level: 1, progress: 0 }); // xp state
  const [dailyGoal, setDailyGoal] = useState(null); // not used
  const xpGainRef = useRef(null); // ref for xp gain animation
  const xpBarRef = useRef(null);  // ref for xp bar animation
  const prevXp = useRef(0); // previous xp to calculate delta
  const [xpDelta, setXpDelta] = useState(0); // xp delta state
  const prevLevel = useRef(0); // previous level to detect level up
  const [showConfetti, setShowConfetti] = useState(false); // Confetti state
  const mindScoreAnim = useRef(new Animated.Value(50)).current; // normalized mental score
  const [displayedInsight, setDisplayedInsight] = useState('');
  const insightIntervalRef = useRef(null);
  const [insightRevealed, setInsightRevealed] = useState(false); // Insight reveal state
  const [devMode, setDevMode] = useState(false);
  const tapTracker = useRef({ count: 0, lastTap: 0 });
  const [historyVisible, setHistoryVisible] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [selectedScore, setSelectedScore] = useState(null);

  useEffect(() => {
    if (historyVisible) {
      getScoreHistory().then(setScoreHistory);
    }
  }, [historyVisible]);

  const handleLogoPress = () => { // dev mode
    const now = Date.now(); // current time
    if (now - tapTracker.current.lastTap < 1000) { // if time between tap is less than 1000
      tapTracker.current.count += 1; // increment count
    } else { 
      tapTracker.current.count = 1; // reset count
    }
    tapTracker.current.lastTap = now; // update last tap time
    if (tapTracker.current.count >= 7) { // if count is 7
      setDevMode((prev) => !prev); // toggle dev mode. React knows that prev is the current state and we are doing opposite
      tapTracker.current.count = 0; // reset count
    }
  };

  useEffect(() => {
    if (microInsight && microInsight !== 'Loading insight...') { // if microInsight is set and not loading
      markInsightRead().then(() => { // markInsightRead then do...
        getCurrentScores().then((data) => { // getCurrentScores then call it data...
          if (data.xp) setXp(data.xp); // use the data to set the states
          if (data.mindScore !== undefined) setMindScore(data.mindScore);
          if (data.dailyGoal) setDailyGoal(data.dailyGoal);
          if (data.streak !== undefined) setStreak(data.streak);
          if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak);
        });
      });
    }
  }, [microInsight]); // do this for every microInsight change

  useEffect(() => {
    getCurrentScores().then((data) => { // get the scores then call it data
      if (data.xp) setXp(data.xp); // if there is data.xp set the state
      if (data.mindScore !== undefined) setMindScore(data.mindScore);
      if (data.dailyGoal) setDailyGoal(data.dailyGoal); // if there is data.dailyGoal set the state
      if (data.streak !== undefined) setStreak(data.streak); // if there is data.streak set the state
      if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak); // if there is data.longestStreak set the state
    });
  }, []);

  useEffect(() => {
    if (xp.xpToday > prevXp.current) { // if the xp is greater than the previous xp
      const delta = xp.xpToday - prevXp.current; // calculate the delta
      setXpDelta(delta); // set the delta state
      prevXp.current = xp.xpToday; // update the previous xp
      xpGainRef.current?.fadeInDown(200).then(() => xpGainRef.current?.fadeOutUp(600)); // animate the xp gain
      xpBarRef.current?.pulse(800); // animate the xp bar
    } else {
      prevXp.current = xp.xpToday; // just update the previous xp
    }
  }, [xp.xpToday]); // do this for every xp.xpToday change

  useEffect(() => {
    if (xp.level > prevLevel.current) { // if the xp level is greater than the previous level
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success // haptic feedback for level up
      );
      setShowConfetti(true); // 🎉 Show confetti 
    }
    prevLevel.current = xp.level; // update to new level
  }, [xp.level]); // do this for every xp.level change

  const energyAnim = useRef(new Animated.Value(BASELINE)).current; // animated values for each metric
  const clarityAnim = useRef(new Animated.Value(BASELINE)).current;
  const emotionAnim = useRef(new Animated.Value(BASELINE)).current;
  const focusAnim = useRef(new Animated.Value(BASELINE)).current;

  const energyProgress = energyAnim.interpolate({ 
    inputRange: [-1, 0, 100], // interpolate from -1 to 100 if lower than 0 it will be 0
    outputRange: [0, 0, 1], // output range from 0 to 1
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
  const [displayMindScore, setDisplayMindScore] = useState(600);
  const checkInButtonRef = useRef(null);
  const streakRef = useRef(null);


  useEffect(() => {
    const id = mindScoreAnim.addListener(({ value }) =>
      setDisplayScore(Math.round(value))
    );
    return () => mindScoreAnim.removeListener(id);
  }, []);

  useEffect(() => {
    setDisplayMindScore(mindScore);
  }, [mindScore]);

  useEffect(() => {
    const id = energyAnim.addListener(({ value }) =>
      setDisplayEnergy(Math.round(value))
    );
    return () => energyAnim.removeListener(id);
  }, []);

  useEffect(() => { 
    Animated.timing(energyAnim, { // animate the energyAnim value
      toValue: energy, // to the energy state
      duration: 800, // duration of 800ms
      useNativeDriver: false, // cannot use native driver for width animation
    }).start(); // start the animation
  }, [energy]); // repeat when energy changes

  // listening for change and updating display value
  useEffect(() => {
    const id = clarityAnim.addListener(({ value }) =>
      setDisplayClarity(Math.round(value))
    );
    return () => clarityAnim.removeListener(id);
  }, []);
// actually causing the change in values 
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
    if (mindScore < 0) return;
    Animated.timing(mindScoreAnim, {
      toValue: (mindScore - 300) / 6,
      duration: 3000,
      useNativeDriver: false,
    }).start();
  }, [mindScore]);


  useEffect(() => {
    const fetchData = async () => { // fetch data async
      try {
        const stored = await AsyncStorage.getItem('lastMetrics'); // get last metrics
        if (stored) { // if there are stored metrics
          const metrics = JSON.parse(stored); // turn to readable
          energyAnim.setValue(metrics.energy); // set the animated values to stored values
          clarityAnim.setValue(metrics.clarity); 
          emotionAnim.setValue(metrics.emotion); 
          focusAnim.setValue(metrics.focus);
          setEnergy(metrics.energy); // set the states to stored values
          setClarity(metrics.clarity);
          setEmotion(metrics.emotion);
          setFocus(metrics.focus);
        }
      } catch (err) {
        console.error('❌ Error loading last metrics:', err); // catch error
      }

      await fetchCheckInData(); // wait for the check in data
      const mirror = await getWeeklyMindMirror(); // get the mind mirror
      setWeeklyMindMirror(mirror); // set the state
      await resetStreakIfNeeded();
      await calculateStreak(); // calculate the streak
      const data = await getCurrentScores(); // get the current scores
      if (data.xp) setXp(data.xp); // set the states
      if (data.mindScore !== undefined) setMindScore(data.mindScore);
      if (data.dailyGoal) setDailyGoal(data.dailyGoal);
      if (data.streak !== undefined) setStreak(data.streak);
      if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak);
    };
    fetchData(); // call the fetch data function

    const unsubscribe = navigation.addListener('focus', () => {
      fetchCheckInData();
      resetStreakIfNeeded().then(() => {
        calculateStreak();
        getCurrentScores().then((data) => {
          if (data.xp) setXp(data.xp);
          if (data.mindScore !== undefined) setMindScore(data.mindScore);
          if (data.dailyGoal) setDailyGoal(data.dailyGoal);
          if (data.streak !== undefined) setStreak(data.streak);
          if (data.longestStreak !== undefined) setLongestStreak(data.longestStreak);
        });
      });
    });

    return unsubscribe; // clean up the listener
  }, [navigation]);

  const fetchCheckInData = async () => {
    try {
      const historyRaw = await AsyncStorage.getItem('checkInHistory'); // get the check in history
      const history = historyRaw ? JSON.parse(historyRaw) : []; // parse it or empty array
      const today = new Date().toISOString().split('T')[0]; // get today's date in yyyy-mm-dd
      const yesterday = new Date(); // get yesterday's date
      yesterday.setDate(yesterday.getDate() - 1);

      const todayEntries = history.filter((entry) => entry.timestamp.startsWith(today)); // filter only for today
      const sortedEntries = todayEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // sort by time

      if (sortedEntries.length === 0) { // if no entries for today
        setEnergy(BASELINE); // keep everything at baseline
        setClarity(BASELINE);
        setEmotion(BASELINE);
        setFocus(BASELINE);
      await AsyncStorage.setItem( // wait to set the last metrics to baseline
        'lastMetrics',
        JSON.stringify({
          energy: BASELINE,
          clarity: BASELINE,
          emotion: BASELINE,
          focus: BASELINE,
          score: BASELINE,
        })
      );
      setMicroInsight('🔍 Start checking in to uncover patterns. Ready to begin?'); // what to leave in the insight
      setInsightRevealed(false); // hide the insight
      setDisplayedInsight(''); // clear the displayed insight
      return; // exit the function
      }

      let currentEnergy = BASELINE; // start at baseline
      let currentClarity = BASELINE;
      let currentEmotion = BASELINE;

      const impactPerCheckIn = 20; // each check-in impacts 20% towards the new value

      sortedEntries.forEach((entry) => { // for each entry
        if (entry.energy != null) {
          currentEnergy += ((entry.energy - currentEnergy) * impactPerCheckIn) / 100; // move 20% towards the new value
          currentClarity += ((entry.clarity - currentClarity) * impactPerCheckIn) / 100;
          currentEmotion += ((entry.emotion - currentEmotion) * impactPerCheckIn) / 100;
        }
      });

      currentEnergy = Math.max(0, Math.round(currentEnergy)); // make sure not below 0 and round it
      currentClarity = Math.max(0, Math.round(currentClarity));
      currentEmotion = Math.max(0, Math.round(currentEmotion));
      const currentFocus = Math.round(0.6 * currentClarity + 0.4 * currentEnergy); // focus is weighted 60% clarity and 40% energy
      const computedScore = Math.round(
        (currentEnergy + currentClarity + currentEmotion + currentFocus) / 4 // overall score is average of all four
      );

      setEnergy(currentEnergy); // set the states
      setClarity(currentClarity);
      setEmotion(currentEmotion);
      setFocus(currentFocus);
      await AsyncStorage.setItem( // store the last metrics
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
      const latestEntry = sortedEntries[sortedEntries.length - 1]; // get last entry
      const insight = await generateTodaysInsight({ // generate the insight
        energy: currentEnergy, // pass the current values
        clarity: currentClarity,
        emotion: currentEmotion,
        focus: currentFocus,
        note: latestEntry.note || '',
        tags: latestEntry.tags || [],
        window: latestEntry.window,
        timestamp: latestEntry.timestamp,
      });
      setMicroInsight(insight); // set the insight off the insight
      setInsightRevealed(false); // update that the insight is shown
      setDisplayedInsight(''); // clear the displayed insight so we can display the new
    } catch (err) { // catch any errors
      console.error('❌ Error loading check-in data:', err);
      setEnergy(BASELINE);
      setClarity(BASELINE);
      setEmotion(BASELINE);
      setFocus(BASELINE);
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
        '🔍 Keep checking in to uncover patterns. What’s on your mind today?' // if there is nothing, display this 
      );
      setInsightRevealed(false); // hide the insight
      setDisplayedInsight(''); // clear the insight 
    }
  };


  const calculateStreak = async () => {
    try {
      const [curRaw, longRaw] = await Promise.all([ // get both values at the same time
        AsyncStorage.getItem('currentStreak'), // get current streak
        AsyncStorage.getItem('longestStreak'), // get longest streak
      ]);
      const count = curRaw ? parseInt(curRaw, 10) : 0; // check if it exist and parse it
      const longest = longRaw ? parseInt(longRaw, 10) : 0; // check if it exist and parse it
      setStreak(count); // set the streak state
      setLongestStreak(longest); // set the longest streak state
      streakRef.current?.bounceIn(); // add animation to the streak
      if (count > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // if streak is longer than 0 give haptic
    } catch (err) { // catch errors
      console.error('❌ Error calculating streak:', err);
      setStreak(0); // set streak to 0
    }
  };

  // Reset streak at app launch based on last check-in date
  useEffect(() => {
    resetStreakIfNeeded().then(calculateStreak);
  }, []);

  const getCheckInWindow = () => { // determine which check-in window it is
    const hour = new Date().getHours(); // get the current hour
    if (hour >= 6 && hour < 12) return 'checkIn1'; // time frame for check in 1
    if (hour >= 12 && hour < 17) return 'checkIn2'; // time frame for check in 2  
    return 'checkIn3'; // else it is check in 3
  };

  const handleCheckInPress = async () => { // when check in button is pressed
    // Scroll to the top before triggering the animation
    await new Promise((resolve) => { // await - wait. new Promise - create what needs to be waited on. 
      scrollViewRef.current?.scrollTo({ y: 0, animated: true }); // use the reference to scroll to top
      setTimeout(resolve, 500); // Wait for the scroll animation to complete (adjust duration if needed)
    });
  
    // Trigger the check-in animation and navigation
    checkInButtonRef.current?.rubberBand(600); // animate the checkin button
    await Haptics.selectionAsync(); // wait until the haptics done then move on
    const today = new Date().toISOString().split('T')[0]; // get today's date
    const window = getCheckInWindow(); // get the check-in window from the function
    const key = `${today}-${window}`; // create a passcode so that it is easy to find with functions
    const existing = await AsyncStorage.getItem(key); // check if there is already an entry for today and this window
    if (!existing) { // if there is no entry
      navigation.navigate('CheckIn', { window }); // navigate to the check-in screen
      await calculateStreak(); // then run the calculate streak function
    } else { 
      Alert.alert('Already Checked In', 'You already completed this check-in.'); // if you already check in then this pops up
    }
  };

  //DEV
  const resetCheckIn3 = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // give haptic before starting
    const today = new Date().toISOString().split('T')[0]; // get today's date
    await AsyncStorage.removeItem(`${today}-checkIn3`); // remove the check-in 3 entry for today
    Alert.alert('✅ Reset Complete', 'Check-In 3 has been cleared.'); // show that its was deleted
  };

  const devLaunchCheckIn3 = async () => { // dev function to launch check-in 3 directly
    await Haptics.selectionAsync(); // give haptic
    navigation.navigate('CheckIn', { window: 'checkIn3' }); // navigate to check-in 3
  };

  const resetCheckIn1 = async () => { // dev function to reset check-in 1
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // give haptic
    const today = new Date().toISOString().split('T')[0]; // get todays date
    await AsyncStorage.removeItem(`${today}-checkIn1`); // remove the check-in 1 entry for today
    Alert.alert('✅ Reset Complete', 'Check-In 1 has been cleared.'); // give alert
  };

  const devLaunchCheckIn1 = async () => { // dev function to launch check-in 1 directly
    await Haptics.selectionAsync(); // give haptic
    navigation.navigate('CheckIn', { window: 'checkIn1' }); // navigate to check-in 1
  };

  const devLaunchOnboarding = async () => { // dev open the onboarding screen
    await Haptics.selectionAsync(); // give a haptic
    navigation.navigate('Onboarding'); // take the user to onboarding screen
  };

  const resetOnboardingFlag = async () => { // dev reset the onboarding flag
    await AsyncStorage.removeItem('onboardingComplete'); // remove the onboarding complete flag
    Alert.alert('Flag Reset', 'Onboarding will show on next app load.'); // alert the user
  };

  const resetAllData = async () => { // reset all data
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // give a warning haptic
    try {
      await AsyncStorage.clear(); // clear the storage
      console.log('✅ All data cleared successfully'); // display in console
      Alert.alert('Reset Complete', 'All app data has been cleared.'); // alert the user
      setEnergy(BASELINE); // set everything back to defaults 
      setClarity(BASELINE);
      setEmotion(BASELINE);
      setFocus(BASELINE);
      setMicroInsight('Loading insight...');
      setInsightRevealed(false);
      setDisplayedInsight('');
      setWeeklyMindMirror('No MindMirror yet.');
      setXp({ xpToday: 0, total: 0, level: 1, progress: 0 });
    } catch (err) { // if there is any errors
      console.error('❌ Error clearing data:', err);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const renderMarkdown = (text) => {  // used in mentalMirror to render the markdown text
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

  

  useEffect(() => {
    if (!insightRevealed) return; // only run if the insight is revealed
  
    // Only animate if microInsight is a clean, valid string
    if (
      typeof microInsight !== 'string' ||
      microInsight.length < 10 ||
      microInsight === 'Loading insight...'
    ) {
      setDisplayedInsight('⚠️ Insight unavailable. Try again.'); // if conditions are not met 
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
    <Animatable.View animation="fadeIn" duration={400} style={{ flex: 1 }}>
      <LinearGradient
        colors={['#1C1F2E', '#12131C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        {/* 🔷 Custom Header Overlay */}
        <CustomHeader
          onLogoPress={handleLogoPress}
          devMode={devMode}
          navigation={navigation}
          handleCheckInPress={handleCheckInPress}
        />
  
        {/* 🎉 Confetti Animation */}
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
  
        {/* 🔽 Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* 🔘 Main Score Circle */}
          <Animatable.View animation="bounceIn" duration={800} style={styles.gaugeContainer}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => { setSelectedScore(mindScore); setHistoryVisible(true); }}>
              <ScoreCircle score={displayScore} />
            </TouchableOpacity>
            <OrbitingButtons size={170} />
            <Text style={styles.mentalScore}>{displayMindScore}</Text>
          </Animatable.View>
  
          {/* 📈 XP Progress */}
          <Animatable.View
            ref={xpBarRef}
            style={[styles.momentumContainer, xp.progress > 60 && styles.levelGlow]}
          >
            <Text style={styles.momentumLabel}>
              Level {xp.level} — {xp.total - xpForLevel(xp.level)} /{' '}
              {xpForLevel(xp.level + 1) - xpForLevel(xp.level)} XP
            </Text>
            <AnimatedMomentumBar value={xp.progress} />
            <Animatable.Text ref={xpGainRef} style={styles.xpGainText}>
              +{xpDelta}
            </Animatable.Text>
          </Animatable.View>
  
          {/* 🔥 Streak */}
          <View style={styles.streakContainer}>
            <Animatable.Text ref={streakRef} style={styles.streakText}>
              <Image
                source={require('./assets/GIF/fire.gif')}
                style={styles.streakIcon}
              />{' '}
              {streak} Day Streak{[3, 7, 14, 30, 50].includes(streak) ? '🏅' : ''}
            </Animatable.Text>
          </View>
  
          {/* 🧠 Weekly MindMirror */}
          <LinearGradient
            colors={['#646DFF', '#D7A4FF']}
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
  
          {/* 💬 Insight Card */}
          <LinearGradient
            colors={['#646DFF', '#D7A4FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setInsightRevealed(true)}
              disabled={insightRevealed}
              style={[
                styles.cardInner,
                !insightRevealed && { backgroundColor: '#2E3340', opacity: 0.6 },
              ]}
            >
              <View style={styles.cardHeader}>
                <Image source={require('./assets/advice.png')} style={styles.cardIcon} />
                <Text style={styles.cardTitle}>Check-in Insight</Text>
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
  
          {/* 📊 Metrics Grid */}
          <View style={styles.metricsGradient}>
            <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.metricsGrid}>
              <View style={styles.metricsRow}>
                {/* Energy */}
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
  
                {/* Clarity */}
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
                {/* Emotion */}
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
  
                {/* Focus */}
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
  
          {/* 🛠 Dev Mode Buttons */}
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
              <TouchableOpacity onPress={resetAllData} style={[styles.resetButton, { marginTop: 12, backgroundColor: '#dc2626' }]}>
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
              <TouchableOpacity
                onPress={devLaunchOnboarding}
                style={[styles.resetButton, { marginTop: 12, backgroundColor: '#646DFF' }]}
              >
                <Text style={styles.resetButtonText}>Open Onboarding (Dev)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resetOnboardingFlag}
                style={[styles.resetButton, { marginTop: 12, backgroundColor: '#fbbf24' }]}
              >
                <Text style={styles.resetButtonText}>Reset Onboarding Flag (Dev)</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <ScoreHistoryOverlay
          visible={historyVisible}
          onClose={() => setHistoryVisible(false)}
          history={scoreHistory}
          selected={selectedScore}
          onSelect={(s) => setSelectedScore(s)}
        />
      </LinearGradient>
    </Animatable.View>
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
    width: 270,
    height: 270,
  },

  gaugeGlow: {
    shadowColor: '#B48DFF',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  gaugeSvg: {
    width: 170,
    height: 170,
    alignSelf: 'center',
  },
  orbitContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#646DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
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

historyOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 80,
  paddingHorizontal: 20,
},
historyClose: {
  position: 'absolute',
  top: 40,
  right: 30,
  zIndex: 2,
},
historyCloseText: {
  fontSize: 32,
  color: 'red',
  fontWeight: '800',
},
historySvg: {
  backgroundColor: '#1C1E29',
  borderRadius: 12,
  padding: 12,
},

  
});