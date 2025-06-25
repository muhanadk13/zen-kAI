import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { OPENAI_API_KEY } from './apiKey';


export async function generateTodaysInsight(metrics) {
  const compiledHistory = await AsyncStorage.getItem('compiledHistory');
  const { energy, clarity, emotion, focus, note, window, timestamp, tags = [] } = metrics;
  const today = new Date().toISOString().split('T')[0];
  let insight = '';

  try {
    
    const storedRaw = await AsyncStorage.getItem(`todaysInsight-${today}`);
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        if (stored.timestamp === timestamp) {
          return stored.text;
        }
      } catch {
        if (timestamp) {
          
        } else {
          return storedRaw;
        }
      }
    }
    
    const historyRaw = await AsyncStorage.getItem('checkInHistory');
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const last7Days = history.filter((e) => new Date(e.timestamp) >= weekAgo);
    const { avg: weekAvg, std: weekStd } = calculateWeekStats(last7Days);
    const emotionStreak = calculateEmotionStreak(history);
    const streakCount = calculateCheckInStreak(history);

    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const last14Days = history.filter((e) => new Date(e.timestamp) >= twoWeeksAgo);
    const prev7Days = last14Days.filter((e) => new Date(e.timestamp) < weekAgo);
    const { avg: prevWeekAvg } = calculateWeekStats(prev7Days);

    const weeklyShift =
      weekAvg && prevWeekAvg
        ? {
            energy: weekAvg.energy - prevWeekAvg.energy,
            clarity: weekAvg.clarity - prevWeekAvg.clarity,
            emotion: weekAvg.emotion - prevWeekAvg.emotion,
            focus: weekAvg.focus - prevWeekAvg.focus,
          }
        : null;
    const lastReflection = await AsyncStorage.getItem('lastReflectionDate');
    const lastReflectionDaysAgo = lastReflection
      ? Math.floor((Date.now() - new Date(lastReflection)) / (1000 * 60 * 60 * 24))
      : 'N/A';
    const importantInfoRaw = await AsyncStorage.getItem('importantInfo');
    const importantInfo = importantInfoRaw ? JSON.parse(importantInfoRaw).slice(-3).join('; ') : '';
    const recentNotes = history.slice(-3)
      .map((e) => e.note)
      .filter(Boolean)
      .join('; ');

    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayEntries = history.filter((entry) => entry.timestamp.startsWith(yesterdayStr));
    const yesterdayAvg = yesterdayEntries.length > 0
      ? {
          energy: yesterdayEntries.reduce((sum, e) => sum + (e.energy || 0), 0) / yesterdayEntries.length,
          clarity: yesterdayEntries.reduce((sum, e) => sum + (e.clarity || 0), 0) / yesterdayEntries.length,
          emotion: yesterdayEntries.reduce((sum, e) => sum + (e.emotion || 0), 0) / yesterdayEntries.length,
          focus: calculateFocus(
            yesterdayEntries.reduce((sum, e) => sum + (e.clarity || 0), 0) / yesterdayEntries.length,
            yesterdayEntries.reduce((sum, e) => sum + (e.energy || 0), 0) / yesterdayEntries.length
          ),
        }
      : null;

    
    const mentalScore = Math.round((energy + clarity + emotion + focus) / 4);

    
    const windowDescription = {
      checkIn1: 'morning',
      checkIn2: 'afternoon',
      checkIn3: 'evening',
    }[window] || 'recent';


    
    const prompt = `
You are ZenKai — a calm, emotionally intelligent coach who gives a single powerful insight per day.

Using the user’s check-in data below, generate one insightful, emotionally aware sentence that reflects subtle shifts in mental patterns. 

Tone rules:
- If their note suggests self-criticism or emotional struggle, be gentle but clear.
- If the user is optimistic, consistent, or self-motivated, be more direct and challenging.
- Never be robotic. Speak with empathy, like a wise mentor or therapist who pays close attention.

Use only whole number percentages. Ignore changes <5%.
=== Today’s Metrics (${window} check-in) ===
- Energy: ${energy}% 
- Clarity: ${clarity}% 
- Emotion: ${emotion}% 
- Focus: ${focus}% 
- Mental Score: ${mentalScore}%
- Note: ${note || 'No note provided.'}
${!note && tags.length ? `- Tags: ${tags.join(', ')}` : ''}

=== Context ===
- Yesterday’s Averages:
${yesterdayAvg
  ? `  - Energy: ${Math.round(yesterdayAvg.energy)}%
  - Clarity: ${Math.round(yesterdayAvg.clarity)}%
  - Emotion: ${Math.round(yesterdayAvg.emotion)}%
  - Focus: ${Math.round(yesterdayAvg.focus)}%`
  : '  No data available.'}

- 7-Day Averages:
${weekAvg
  ? `  - Clarity: ${Math.round(weekAvg.clarity)}% ±${Math.round(weekStd.clarity || 0)}%
  - Emotion Stability: ${emotionStreak} days`
  : '  No data available.'}

- Weekly Shift:
${weeklyShift
  ? `  - Energy: ${formatChange(weeklyShift.energy)}
  - Clarity: ${formatChange(weeklyShift.clarity)}
  - Emotion: ${formatChange(weeklyShift.emotion)}
  - Focus: ${formatChange(weeklyShift.focus)}`
  : '  No data available.'}

- Engagement:
  - Streak: ${streakCount} days
  - Last Reflection: ${lastReflectionDaysAgo} days ago

=== 30-Day History for Pattern Detection ===
${compiledHistory || 'No long-term data yet.'}
`;

    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful mental health assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    insight = response.data.choices[0].message.content.trim();

    
    await AsyncStorage.setItem(
      `todaysInsight-${today}`,
      JSON.stringify({ timestamp, text: insight })
    );
    return insight;

  } catch (err) {
    console.error('❌ Error generating today\'s insight with GPT:', err);
    return '🔍 Keep checking in to uncover patterns. What’s on your mind today?';
  }
}


function calculateFocus(clarity, energy) {
  return Math.round(0.6 * clarity + 0.4 * energy);
}

function formatChange(num) {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${Math.round(num)}%`;
}


function calculateWeekStats(entries) {
  if (entries.length < 6) return { avg: null, std: null };
  const sums = { energy: 0, clarity: 0, emotion: 0, focus: 0 };
  entries.forEach((e) => {
    sums.energy += e.energy || 0;
    sums.clarity += e.clarity || 0;
    sums.emotion += e.emotion || 0;
    sums.focus += calculateFocus(e.clarity || 0, e.energy || 0);
  });
  const avg = {
    energy: sums.energy / entries.length,
    clarity: sums.clarity / entries.length,
    emotion: sums.emotion / entries.length,
    focus: sums.focus / entries.length,
  };
  const variance = { energy: 0, clarity: 0, emotion: 0, focus: 0 };
  entries.forEach((e) => {
    variance.energy += Math.pow((e.energy || 0) - avg.energy, 2);
    variance.clarity += Math.pow((e.clarity || 0) - avg.clarity, 2);
    variance.emotion += Math.pow((e.emotion || 0) - avg.emotion, 2);
    const entryFocus = calculateFocus(e.clarity || 0, e.energy || 0);
    variance.focus += Math.pow(entryFocus - avg.focus, 2);
  });
  const std = {
    energy: Math.sqrt(variance.energy / entries.length),
    clarity: Math.sqrt(variance.clarity / entries.length),
    emotion: Math.sqrt(variance.emotion / entries.length),
    focus: Math.sqrt(variance.focus / entries.length),
  };
  return { avg, std };
}


function calculateEmotionStreak(entries) {
  if (!entries.length) return 0;
  const sorted = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs((sorted[i].emotion || 0) - (sorted[i - 1].emotion || 0)) <= 10) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}


function calculateCheckInStreak(entries) {
  if (!entries.length) return 0;
  const uniqueDates = [...new Set(entries.map((e) => e.timestamp.split('T')[0]))];
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  for (let i = uniqueDates.length - 1; i >= 0; i--) {
    const d = new Date(uniqueDates[i]);
    if (d.toDateString() === current.toDateString()) {
      streak += 1;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}


export function generateMicroInsight(checkIns = [], yesterday = {}) {
  const valid = checkIns.filter(
    (e) => e.energy != null && e.clarity != null && e.emotion != null
  );
  if (!valid.length) return 'No data.';

  const sums = { energy: 0, clarity: 0, emotion: 0 };
  valid.forEach((e) => {
    sums.energy += e.energy;
    sums.clarity += e.clarity;
    sums.emotion += e.emotion;
  });

  const avg = {
    energy: Math.round(sums.energy / valid.length),
    clarity: Math.round(sums.clarity / valid.length),
    emotion: Math.round(sums.emotion / valid.length),
  };
  const focus = calculateFocus(avg.clarity, avg.energy);

  const deltas = {
    energy: avg.energy - (yesterday.energy ?? avg.energy),
    clarity: avg.clarity - (yesterday.clarity ?? avg.clarity),
    emotion: avg.emotion - (yesterday.emotion ?? avg.emotion),
  };

  const parts = [
    `E:${avg.energy}${formatChange(deltas.energy)}`,
    `C:${avg.clarity}${formatChange(deltas.clarity)}`,
    `Em:${avg.emotion}${formatChange(deltas.emotion)}`,
    `F:${focus}`,
  ];
  return parts.join(' | ');
}
