import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// OpenAI API key (ensure this is securely stored in production)
const OPENAI_API_KEY = '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';

// Function to generate Today's Insight using GPT
export async function generateTodaysInsight(metrics) {
  const { energy, clarity, emotion, focus, note, window } = metrics;
  const today = new Date().toISOString().split('T')[0];
  let insight = '';

  try {
    // Fetch check-in history
    const historyRaw = await AsyncStorage.getItem('checkInHistory');
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    // Gather additional context
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const last7Days = history.filter((e) => new Date(e.timestamp) >= weekAgo);
    const { avg: weekAvg, std: weekStd } = calculateWeekStats(last7Days);
    const emotionStreak = calculateEmotionStreak(history);
    const streakCount = calculateCheckInStreak(history);
    const lastReflection = await AsyncStorage.getItem('lastReflectionDate');
    const lastReflectionDaysAgo = lastReflection
      ? Math.floor((Date.now() - new Date(lastReflection)) / (1000 * 60 * 60 * 24))
      : 'N/A';
    const importantInfoRaw = await AsyncStorage.getItem('importantInfo');
    const importantInfo = importantInfoRaw ? JSON.parse(importantInfoRaw).slice(-3).join('; ') : '';

    // Calculate yesterday's averages
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

    // Calculate overall mental score
    const mentalScore = Math.round((energy + clarity + emotion + focus) / 4);

    // Map check-in window to time of day
    const windowDescription = {
      checkIn1: 'morning',
      checkIn2: 'afternoon',
      checkIn3: 'evening',
    }[window] || 'recent';

    // Prepare prompt for GPT
    const prompt = `
      You are an AI assistant generating a concise, personalized mental health insight. Use the data provided to surface a surprising pattern and give one short actionable suggestion. Keep the response under 100 words and include relevant emojis.

      Today's Metrics (${windowDescription} check-in):
      - Energy: ${energy}% ⚡
      - Clarity: ${clarity}% 💡
      - Emotion: ${emotion}% 💚
      - Focus: ${focus}% 🎯
      - Mental Score: ${mentalScore}%
      - Note: ${note || 'No note provided.'}

      Yesterday's Averages:
      ${yesterdayAvg
        ? `- Energy: ${Math.round(yesterdayAvg.energy)}%
         - Clarity: ${Math.round(yesterdayAvg.clarity)}%
         - Emotion: ${Math.round(yesterdayAvg.emotion)}%
         - Focus: ${Math.round(yesterdayAvg.focus)}%`
        : 'No data available.'}

      7-Day Trends:
      ${weekAvg
        ? `- Clarity: Avg ${Math.round(weekAvg.clarity)}% ±${Math.round(weekStd.clarity || 0)}
         - Emotion Stability: ${emotionStreak} days consistent`
        : 'No data available.'}

      Engagement:
      - Check-In Streak: ${streakCount} days
      - Last Reflection: ${lastReflectionDaysAgo} days ago

      Past Reflections: ${importantInfo || 'None'}

      Generate the insight now.
    `;

    // Call OpenAI API
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

    // Store the insight
    await AsyncStorage.setItem(`todaysInsight-${today}`, insight);
    return insight;

  } catch (err) {
    console.error('❌ Error generating today\'s insight with GPT:', err);
    return '🔍 Keep checking in to uncover patterns. What’s on your mind today?';
  }
}

// Helper function to calculate focus based on clarity and energy
function calculateFocus(clarity, energy) {
  return Math.round(0.6 * clarity + 0.4 * energy);
}

// Calculate averages and standard deviation for a set of entries
function calculateWeekStats(entries) {
  if (!entries.length) return { avg: null, std: null };
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

// Calculate how many recent days had similar emotion values
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

// Calculate consecutive days of check-ins ending today
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