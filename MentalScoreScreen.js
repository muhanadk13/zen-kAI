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

const OPENAI_API_KEY = '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';

export default function MentalScoreScreen() {
  const navigation = useNavigation();
  const [energy, setEnergy] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [emotion, setEmotion] = useState(0);
  const [focus, setFocus] = useState(0);
  const [microInsight, setMicroInsight] = useState('Loading insight...');
  const [weeklyMindMirror, setWeeklyMindMirror] = useState('No MindMirror yet.');

  useEffect(() => {
    fetchCheckInData();
    loadMindMirror();
  }, []);

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

      await fetchGPTContent(currentEnergy, currentClarity, currentEmotion, currentFocus);

      const todayDate = new Date();
      const isSunday = todayDate.getDay() === 0;
      const lastMindMirrorUpdate = await AsyncStorage.getItem('lastMindMirrorUpdate');
      const alreadyUpdated = lastMindMirrorUpdate && new Date(lastMindMirrorUpdate).toDateString() === todayDate.toDateString();

      if (isSunday && !alreadyUpdated) {
        await generateMindMirror();
        await AsyncStorage.setItem('lastMindMirrorUpdate', todayDate.toISOString());
      }
    } catch (err) {
      console.error('❌ Error loading check-in data:', err);
      setEnergy(100);
      setClarity(100);
      setEmotion(100);
      setFocus(100);
    }
  };

  const fetchGPTContent = async (energy, clarity, emotion, focus) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const microInsight = await AsyncStorage.getItem(`${today}-microInsight`);
      setMicroInsight(microInsight || 'No insight yet.');
    } catch (err) {
      console.error('❌ GPT error:', err);
    }
  };

  const getWeeklyData = async () => {
    try {
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weeklyEntries = history.filter(entry => 
        new Date(entry.timestamp) >= weekAgo
      );

      const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      
      return {
        weeklyEnergy: avg(weeklyEntries.map(h => h.energy || 0)),
        weeklyClarity: avg(weeklyEntries.map(h => h.clarity || 0)),
        weeklyEmotion: avg(weeklyEntries.map(h => h.emotion || 0)),
        weeklyFocus: avg(weeklyEntries.map(h => h.focus || 0))
      };
    } catch (err) {
      console.error('❌ Error getting weekly data:', err);
      return null;
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
    } catch (err) {
      console.error('❌ Error clearing data:', err);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const generateMindMirror = async () => {
    try {
      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const last7 = history.filter(entry => new Date(entry.timestamp) >= weekAgo);

      const formatted = last7.map(entry => {
        return `🕒 ${entry.timestamp.slice(0, 16)} → Energy: ${entry.energy}, Clarity: ${entry.clarity}, Emotion: ${entry.emotion}, Focus: ${entry.focus}, Note: ${entry.note || "No note"}`
      }).join('\n');

      const mindMirrorPrompt = `
You are a weekly mental performance coach.

Below is a user's check-in history for the past 7 days. Each includes energy, clarity, emotion, focus, and notes.

Your job is to generate a Weekly MindMirror report in this format:

📈 Strongest Day: [Highlight a day that stood out and why]  
📉 Toughest Day: [Mention the dip and possible cause]  
🔁 Pattern Noticed: [Find 1 behavioral/emotional trend]  
🧠 Next Week's Tip: [Suggest 1 helpful change or experiment]

Data:
${formatted}
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
            { role: 'user', content: mindMirrorPrompt },
          ],
          temperature: 0.7,
        }),
      });

      const json = await gptRes.json();
      const mindMirror = json.choices?.[0]?.message?.content?.trim();
      await AsyncStorage.setItem('weeklyMindMirror', mindMirror);
      setWeeklyMindMirror(mindMirror || 'No MindMirror yet.');
    } catch (err) {
      console.error('❌ Error generating MindMirror:', err);
    }
  };

  const loadMindMirror = async () => {
    const stored = await AsyncStorage.getItem('weeklyMindMirror');
    if (stored) setWeeklyMindMirror(stored);
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

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={require('./assets/mirror.png')} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Weekly MindMirror</Text>
        </View>
        <Text style={styles.cardText}>{weeklyMindMirror}</Text>
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
          style={[
            styles.resetButton, 
            { marginTop: 12, backgroundColor: '#dc2626' }
          ]}
        >
          <Text style={styles.resetButtonText}>Reset All Data (Dev)</Text>
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
    marginBottom: 6,
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
    fontWeight: '600',
    color: '#000',
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