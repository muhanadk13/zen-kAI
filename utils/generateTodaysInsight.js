import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { gatherExtendedStats } from './metrics';

// OpenAI API key (ensure this is securely stored in production)
const OPENAI_API_KEY = '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';

// Function to generate Today's Insight using GPT
export async function generateTodaysInsight(metrics) {
  const { energy, clarity, emotion, focus, note, window, timestamp } = metrics;
  const today = new Date().toISOString().split('T')[0];
  let insight = '';

  try {
    // If an insight was already generated for the latest check-in, reuse it
    const storedRaw = await AsyncStorage.getItem(`todaysInsight-${today}`);
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        if (stored.timestamp === timestamp) {
          return stored.text;
        }
      } catch {
        if (timestamp) {
          // old format was plain text; ignore if timestamp differs
        } else {
          return storedRaw;
        }
      }
    }
    // Fetch check-in history
    const historyRaw = await AsyncStorage.getItem('checkInHistory');
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    // Gather additional context
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const last7Days = history.filter((e) => new Date(e.timestamp) >= weekAgo);
    const weekStats =
      last7Days.length >= 7 ? calculateWeekStats(last7Days) : { avg: null, std: null };
    const { avg: weekAvg, std: weekStd } = weekStats;
    const emotionStreak = calculateEmotionStreak(history);
    const streakCount = calculateCheckInStreak(history);
    const extended = await gatherExtendedStats();

    // Compare this week's averages to the week prior
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const last14Days = history.filter((e) => new Date(e.timestamp) >= twoWeeksAgo);
    const prev7Days = last14Days.filter((e) => new Date(e.timestamp) < weekAgo);
    const prevWeekStats =
      prev7Days.length >= 7 ? calculateWeekStats(prev7Days) : { avg: null, std: null };
    const { avg: prevWeekAvg } = prevWeekStats;

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
    const yesterdayBlock = yesterdayAvg
      ? `Yesterday's Averages:\n- Energy: ${Math.round(yesterdayAvg.energy)}%\n- Clarity: ${Math.round(yesterdayAvg.clarity)}%\n- Emotion: ${Math.round(yesterdayAvg.emotion)}%\n- Focus: ${Math.round(yesterdayAvg.focus)}%`
      : '';

    const sevenDayBlock = weekAvg
      ? `7-Day Trends:\n- Clarity: Avg ${Math.round(weekAvg.clarity)}% ±${Math.round(
          weekStd.clarity || 0
        )}\n- Emotion Stability: ${emotionStreak} days consistent`
      : '';

    const weeklyShiftBlock = weeklyShift
      ? `Weekly Shift:\n- Energy: ${formatChange(weeklyShift.energy)}\n- Clarity: ${formatChange(
          weeklyShift.clarity
        )}\n- Emotion: ${formatChange(weeklyShift.emotion)}\n- Focus: ${formatChange(
          weeklyShift.focus
        )}`
      : '';

    const prompt = `
You are a cutting-edge AI designed to deeply understand a user's emotional, cognitive, and behavioral patterns across time. Your goal is to notice **subtle shifts** others would miss—tiny changes in clarity, emotion, energy, or behavior that hint at something deeper. Keep in mind all metrics start at 100 and will always be lowered based on data - like a battery

You are not a coach, therapist, or assistant.  Be shocking in how accurate, specific, and helpful your insight is—like a mirror that sees beyond what the user can consciously track. You are a **precision mental performance engine**, trained to surface **patterns before the user is even aware of them**. 

Using the data provided: (Keep response under 40 words) Use % for data and whole numbers. Be sharp and non generic. 


      Today's Metrics (${windowDescription} check-in):
      - Energy: ${energy}% ⚡
      - Clarity: ${clarity}% 💡
      - Emotion: ${emotion}% 💚
      - Focus: ${focus}% 🎯
      - Mental Score: ${mentalScore}%
      - Note: ${note || 'No note provided.'}
      ${yesterdayBlock ? `\n\n${yesterdayBlock}` : ''}
      ${sevenDayBlock ? `\n\n${sevenDayBlock}` : ''}
      ${weeklyShiftBlock ? `\n\n${weeklyShiftBlock}` : ''}
      \nRecent Notes: ${recentNotes || 'None'}

      Engagement:
      - Check-In Streak: ${streakCount} days
      - Last Reflection: ${lastReflectionDaysAgo} days ago

      Additional Stats:
      - Check-Ins this week: ${extended.checkInCount}
      - Avg Note Length: ${extended.avgNoteLength} chars
      - Common Window: ${extended.mostCommonWindow || 'N/A'}

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

    // Store the insight along with the timestamp of the latest check-in
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

// Helper function to calculate focus based on clarity and energy
function calculateFocus(clarity, energy) {
  return Math.round(0.6 * clarity + 0.4 * energy);
}

function formatChange(num) {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${Math.round(num)}%`;
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

// Generate a weekly MindMirror summary using GPT
export async function generateWeeklyMindMirror() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const historyRaw = await AsyncStorage.getItem('checkInHistory');
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const last7 = history.filter((e) => new Date(e.timestamp) >= weekAgo);

    if (last7.length < 3) {
      return 'Not enough check-ins this week to generate a MindMirror. Try checking in daily to uncover patterns!';
    }

    const formatted = last7
      .map(
        (e) =>
          `🕒 ${e.timestamp.slice(0, 16)} → Energy: ${e.energy}, Clarity: ${e.clarity}, Emotion: ${e.emotion}, Focus: ${e.focus}, Note: ${e.note || 'No note'}`
      )
      .join('\n');

    const lastNudge = (await AsyncStorage.getItem('lastWeekNudge')) || 'None';

    const prompt = `You are a weekly mental performance coach for ZenKai. Generate a Weekly MindMirror report that feels like positive therapy. Use this format:
📈 **Strongest Day:** [Highlight a day and why]
📉 **Hardest Day:** [Mention the dip and possible cause]
🔁 **Pattern Noticed:** [Find 1 trend]
🧠 **Next Week's Nudge:** [Suggest 1 change]

Data:
- Check-ins (past 7 days): ${formatted}
- Previous week's nudge: ${lastNudge}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a supportive self-reflection assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const mindMirror = response.data.choices[0].message.content.trim();
    await AsyncStorage.setItem(`mindMirror-${today}`, mindMirror);
    const nudgeMatch = mindMirror.match(/🧠 \*\*Next Week's Nudge:\*\* (.*)/);
    if (nudgeMatch) {
      await AsyncStorage.setItem('lastWeekNudge', nudgeMatch[1]);
    }
    return mindMirror;
  } catch (err) {
    console.error('❌ Error generating weekly MindMirror:', err);
    return 'No MindMirror yet.';
  }
}