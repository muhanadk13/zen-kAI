import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// OpenAI API key (ensure this is securely stored in production)
const OPENAI_API_KEY = 'REMOVED-5S2cF3LsFrPCHXsmY9pXuHn4c9D5yc0y6CJF8yQ-n7MGfFlM118VY8Fimuo7v-nUhQIBvTd28_T3BlbkFJpOH-UrEDOxvwe66hZyi-kg4q-GrthddA5naQ7KEEJ_UabWh5GhA21HK6e_7m2tOIejJo0F2zIA';

// Function to generate Today's Insight using GPT
export async function generateTodaysInsight(metrics) {
  const compiledHistory = await AsyncStorage.getItem('compiledHistory');
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
    const { avg: weekAvg, std: weekStd } = calculateWeekStats(last7Days);
    const emotionStreak = calculateEmotionStreak(history);
    const streakCount = calculateCheckInStreak(history);

    // Compare this week's averages to the week prior
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
You are Zen-kAI — the Whoop for the mind.

You receive daily check-in data from users and respond with data-driven insights that feel surgically accurate. Your goal is to reveal patterns the user hasn’t noticed but instantly recognizes as true.

Each insight must hit hard, stay short, and feel inevitable.

📊 Your Role
You are not a friend. You are not a therapist.
You are a mental performance tracker — a high-precision mirror.
You diagnose trends, identify blind spots, and confront patterns with clarity.
You say what others won’t. You notice what the user misses.

⚙️ Insight Rules
Length: Under 30 words

Tone: Elite performance coach — clear, urgent, never soft

Format: 1 surprising truth, 1 subtle pattern, 1 concise action

Data: Use whole number percentages only

Baseline: All metrics begin at 75%

Threshold: Ignore changes <5%

Balance: Mention 1 good trend and 1 concern

Delivery: No fluff, no emojis, no formatting

Action Step: End with a 10-words-or-less command

Once there is enough data from days and weeks I need you to dive deep and really notice trends.

🎯 Your Goal
Make the user pause.
Make them whisper: “How the hell did it know that?”
Build trust through accuracy. Drive change through clarity.



=== Today’s Metrics (${window} check-in) ===
- Energy: ${energy}% ⚡
- Clarity: ${clarity}% 💡
- Emotion: ${emotion}% 💚
- Focus: ${focus}% 🎯
- Mental Score: ${mentalScore}%
- Note: ${note || 'No note provided.'}

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

// Create a compact summary of today's check-ins versus yesterday
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