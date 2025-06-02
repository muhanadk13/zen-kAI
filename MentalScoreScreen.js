import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import React, { useLayoutEffect, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENAI_API_KEY = 'REMOVED-5S2cF3LsFrPCHXsmY9pXuHn4c9D5yc0y6CJF8yQ-n7MGfFlM118VY8Fimuo7v-nUhQIBvTd28_T3BlbkFJpOH-UrEDOxvwe66hZyi-kg4q-GrthddA5naQ7KEEJ_UabWh5GhA21HK6e_7m2tOIejJo0F2zIA';

const generateInsights = async (type, checkInData = {}) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    if (type === 'microInsight') {
      const { energy, clarity, emotion, focus, timestamp, note, window } = checkInData;
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const lastCheckIns = history
        .slice(-3)
        .map(entry => `🕒 ${entry.timestamp}: Energy: ${entry.energy}, Clarity: ${entry.clarity}, Emotion: ${entry.emotion}, Focus: ${entry.focus}`)
        .join('\n');

      const prompt = `You are ZenKai, a highly emotionally intelligent, perceptive, and human-sounding self-reflection assistant.

You are speaking to one specific user who just completed a mental check-in. Your job is to generate a single, short insight that feels eerily personal — like you’ve been watching them for a week and noticed something even they didn’t.

✅ Format:
- One brief but meaningful insight (1–2 short sentences)
- Start with one emoji that categorizes the insight:
  🧠 = mindset or emotional pattern  
  🔁 = habit or routine-based trend  
  🔍 = subtle behavioral pattern or timing shift
- End with a *curious question* or *gentle praise* — never a command
- Never repeat the actual check-in numbers
- Never be generic — always sound like you're noticing *them*

✅ Style:
- Speak like a coach or therapist who truly *sees* them
- Be soft, intuitive, warm — but don’t flatter
- Use behavioral and emotional pattern recognition (from timing, trends, and tone)
- Prioritize **subtlety** over stats, **emotion** over data

Here is the user’s current check-in data:

- 📊 Today’s Scores: Energy: ${energy}%, Clarity: ${clarity}%, Emotion: ${emotion}%, Focus: ${focus}%
- 🕒 Time of Check-In: ${timestamp}
- ⏱ Check-In Window: ${window} (morning, afternoon, or evening)
- 🧾 Last 2–3 Check-Ins Summary: ${lastCheckIns}
- ✍️ Today’s Reflection Note: ${note || 'No note provided'}

Vary tone: sometimes reflective, sometimes curious, sometimes validating

Occasionally give a surprise deep pattern (e.g. “This insight took a week to detect…”)

“You just unlocked a rare insight” → give scarcity to some insights

Now, based on everything above — generate one powerful, personal insight that makes the user pause and think, “Whoa… this app gets me.”

Examples:
🔁 You’ve been checking in later each day — are your mornings slipping away, or are evenings becoming your thinking space?
🧠 Even on low-clarity days, you’ve been showing up — that’s a sign of discipline, not just routine.
🔍 When your emotion score dips, your reflections get sharper. Maybe discomfort helps you focus inward.
🧠 Your note today had fewer words, but said more — is your mind getting quieter or heavier?
🔁 You reflect more when you skip lunch. Could your hunger be your inner monologue?


`;

      const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a supportive self-reflection assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      const json = await gptRes.json();
      const insight = json.choices?.[0]?.message?.content?.trim() || '🔍 Keep checking in to uncover patterns. What’s on your mind today?';
      // Store insight with a unique key including timestamp to allow multiple insights per day
      await AsyncStorage.setItem(`${today}-microInsight-${timestamp}`, insight);
      return insight;
    } else if (type === 'mindMirror') {
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const last7 = history.filter(entry => new Date(entry.timestamp) >= weekAgo);

      if (last7.length < 3) {
        return 'Not enough check-ins this week to generate a MindMirror. Try checking in daily to uncover patterns!';
      }

      const formatted = last7
        .map(entry => `🕒 ${entry.timestamp.slice(0, 16)} → Energy: ${entry.energy}, Clarity: ${entry.clarity}, Emotion: ${entry.emotion}, Focus: ${entry.focus}, Note: ${entry.note || 'No note'}`)
        .join('\n');

      const lastNudge = (await AsyncStorage.getItem('lastWeekNudge')) || 'None';
      const prompt = `
You are a weekly mental performance coach for ZenKai. Generate a Weekly MindMirror report that feels like positive therapy. Use this format:
📈 **Strongest Day:** [Highlight a day and why]
📉 **Hardest Day:** [Mention the dip and possible cause]
🔁 **Pattern Noticed:** [Find 1 trend]
🧠 **Next Week's Nudge:** [Suggest 1 change]

Example:
“Last week you wrote: ‘I feel foggy but determined.’
This week, you showed the same pattern again.”

Data:
- Check-ins (past 7 days): ${formatted}
- Previous week's nudge: ${lastNudge}
      `;

      const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a supportive self-reflection assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      const json = await gptRes.json();
      const mindMirror = json.choices?.[0]?.message?.content?.trim() || 'No MindMirror yet.';
      await AsyncStorage.setItem(`mindMirror-${today}`, mindMirror);
      const nudgeMatch = mindMirror.match(/🧠 \*\*Next Week's Nudge:\*\* (.*?)$/m);
      if (nudgeMatch) {
        await AsyncStorage.setItem('lastWeekNudge', nudgeMatch[1]);
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your Weekly MindMirror is Ready! 🧠',
          body: 'Check out your mental performance insights for the week.',
        },
        trigger: { seconds: 1 },
      });
      return mindMirror;
    }
  } catch (err) {
    console.error(`❌ Error generating ${type}:`, err);
    return type === 'microInsight'
      ? '🔍 Keep checking in to uncover patterns. What’s on your mind today?'
      : 'No MindMirror yet.';
  }
};

export default function MentalScoreScreen() {
  const navigation = useNavigation();
  const [energy, setEnergy] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [emotion, setEmotion] = useState(0);
  const [focus, setFocus] = useState(0);
  const [microInsight, setMicroInsight] = useState('Loading insight...');
  const [weeklyMindMirror, setWeeklyMindMirror] = useState('No MindMirror yet.');
  const [streak, setStreak] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={require('./assets/logo-text.png')} // Path to your logo image
          style={{ width: 120, height: 40 }} // Adjust size as needed
          resizeMode="contain"
        />
      ),
      headerTitleAlign: 'left' // Center the logo in the header
    });
  }, [navigation]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchCheckInData();
      await triggerMindMirror();
      await calculateStreak(); // Calculate streak on load
    };
    fetchData();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchCheckInData();
      calculateStreak(); // Recalculate streak on navigation focus
    });

    return unsubscribe;
  }, [navigation]);

  const fetchCheckInData = async () => {
    try {
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const today = new Date().toISOString().split('T')[0];

      const todayEntries = history.filter((entry) => entry.timestamp.startsWith(today));

      if (todayEntries.length === 0) {
        setEnergy(100);
        setClarity(100);
        setEmotion(100);
        setFocus(100);
        setMicroInsight('🔍 Start checking in to uncover patterns. Ready to begin?');
        return;
      }

      const sortedEntries = todayEntries.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      let currentEnergy = 100;
      let currentClarity = 100;
      let currentEmotion = 100;

      const impactPerCheckIn = 33.3;

      sortedEntries.forEach((entry) => {
        const energyImpact = ((100 - entry.energy) * impactPerCheckIn) / 100;
        const clarityImpact = ((100 - entry.clarity) * impactPerCheckIn) / 100;
        const emotionImpact = ((100 - entry.emotion) * impactPerCheckIn) / 100;

        currentEnergy -= energyImpact;
        currentClarity -= clarityImpact;
        currentEmotion -= emotionImpact;
      });

      currentEnergy = Math.max(0, Math.round(currentEnergy));
      currentClarity = Math.max(0, Math.round(currentClarity));
      currentEmotion = Math.max(0, Math.round(currentEmotion));
      const currentFocus = Math.round(0.6 * currentClarity + 0.4 * currentEnergy);

      setEnergy(currentEnergy);
      setClarity(currentClarity);
      setEmotion(currentEmotion);
      setFocus(currentFocus);

      // Get the latest check-in for insight generation (only for checkIn1 or checkIn3)
      const latestEntry = sortedEntries[sortedEntries.length - 1];
      if (latestEntry.window === 'checkIn1' || latestEntry.window === 'checkIn3') {
        const insight = await generateInsights('microInsight', {
          energy: currentEnergy,
          clarity: currentClarity,
          emotion: currentEmotion,
          focus: currentFocus,
          timestamp: latestEntry.timestamp,
          note: latestEntry.note || '',
          window: latestEntry.window,
        });
        setMicroInsight(insight);
      } else {
        // Check for the latest stored insight for today
        const insightKeys = await AsyncStorage.getAllKeys();
        const todayInsightKeys = insightKeys
          .filter(key => key.startsWith(`${today}-microInsight-`))
          .sort((a, b) => b.localeCompare(a)); // Sort by timestamp descending
        if (todayInsightKeys.length > 0) {
          const latestInsight = await AsyncStorage.getItem(todayInsightKeys[0]);
          setMicroInsight(latestInsight || '🔍 Keep checking in to uncover patterns. What’s on your mind today?');
        }
      }
    } catch (err) {
      console.error('❌ Error loading check-in data:', err);
      setEnergy(100);
      setClarity(100);
      setEmotion(100);
      setFocus(100);
      setMicroInsight('🔍 Keep checking in to uncover patterns. What’s on your mind today?');
    }
  };

  const triggerMindMirror = async () => {
    try {
      const today = new Date();
      const isSunday = today.getDay() === 0;
      const lastMindMirrorUpdate = await AsyncStorage.getItem('lastMindMirrorUpdate');
      const alreadyUpdated = lastMindMirrorUpdate && new Date(lastMindMirrorUpdate).toDateString() === today.toDateString();
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyEntries = history.filter(entry => new Date(entry.timestamp) >= weekAgo);

      if (isSunday && !alreadyUpdated && weeklyEntries.length >= 3) {
        const mindMirror = await generateInsights('mindMirror');
        setWeeklyMindMirror(mindMirror);
        await AsyncStorage.setItem('lastMindMirrorUpdate', today.toISOString());
      } else {
        const stored = await AsyncStorage.getItem(`mindMirror-${today}`);
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
    const today = new Date().toISOString().split('T')[0];
    const window = getCheckInWindow();
    const key = `${today}-${window}`;
    const existing = await AsyncStorage.getItem(key);
    if (!existing) {
      navigation.navigate('CheckIn', { window });
      await calculateStreak(); // Update streak after check-in
    } else {
      Alert.alert('Already Checked In', 'You already completed this check-in.');
    }
  };

  const resetCheckIn3 = async () => {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.removeItem(`${today}-checkIn3`);
    Alert.alert('✅ Reset Complete', 'Check-In 3 has been cleared.');
  };

  const devLaunchCheckIn3 = () => {
    navigation.navigate('CheckIn', { window: 'checkIn3' });
  };

  const resetCheckIn1 = async () => {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.removeItem(`${today}-checkIn1`);
    Alert.alert('✅ Reset Complete', 'Check-In 1 has been cleared.');
  };

  const devLaunchCheckIn1 = () => {
    navigation.navigate('CheckIn', { window: 'checkIn1' });
  };

  const resetAllData = async () => {
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
        <TouchableOpacity onPress={handleCheckInPress}>
          <Text style={styles.headerButton}>Check In</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.gaugeContainer}>
        <Image source={require('./assets/gauge.png')} style={styles.gaugeImage} resizeMode="contain" />
        <Text style={styles.mentalScore}>{Math.round((energy + clarity + emotion + focus) / 4)}</Text>
        <Text style={styles.mentalScoreLabel}>MentalScore</Text>
      </View>

      <View style={styles.streakContainer}>
        <Text style={styles.streakText}>🔥 {streak} Day Streak</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={require('./assets/mirror.png')} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Weekly MindMirror</Text>
        </View>
        {renderMarkdown(weeklyMindMirror)}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={require('./assets/advice.png')} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Today’s Insight</Text>
        </View>
        <Text style={styles.cardText}>{microInsight}</Text>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.row}>
          <View style={[styles.metricBox, styles.metricBoxLeft]}>
            <Text style={styles.metricLabel}>⚡ Energy {energy}%</Text>
            <ProgressBar progress={energy / 100} color="#C3B1E1" style={styles.bar} />
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>💡 Clarity {clarity}%</Text>
            <ProgressBar progress={clarity / 100} color="#f5c065" style={styles.bar} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.metricBox, styles.metricBoxLeft]}>
            <Text style={styles.metricLabel}>💚 Emotion {emotion}%</Text>
            <ProgressBar progress={emotion / 100} color="#7fe87a" style={styles.bar} />
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>🎯 Focus {focus}%</Text>
            <ProgressBar progress={focus / 100} color="#60a5fa" style={styles.bar} />
          </View>
        </View>
      </View>

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
    backgroundColor: '#f8f8f8',
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
  bar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
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