import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { OPENAI_API_KEY } from './apiKey';


export const WEEKLY_MINDMIRROR_PROMPT = `You are a weekly mental performance coach for ZenKai. Generate a Weekly MindMirror report that feels like positive therapy. Use this format:
📈 **Strongest Day:** [Highlight a day and why]
📉 **Hardest Day:** [Mention the dip and possible cause]
🔁 **Pattern Noticed:** [Find 1 trend]
🧠 **Next Week's Nudge:** [Suggest 1 change]`;

export async function generateWeeklyMindMirror(prompt = WEEKLY_MINDMIRROR_PROMPT) {
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

    const fullPrompt = `${prompt}\n\nData:\n- Check-ins (past 7 days): ${formatted}\n- Previous week's nudge: ${lastNudge}`;

    const response = await axios.post(
      'https:
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a supportive self-reflection assistant.' },
          { role: 'user', content: fullPrompt },
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

export async function getWeeklyMindMirror(prompt = WEEKLY_MINDMIRROR_PROMPT) {
  try {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const lastUpdate = await AsyncStorage.getItem('lastMindMirrorUpdate');
    const alreadyUpdated =
      lastUpdate && new Date(lastUpdate).toDateString() === today.toDateString();

    const historyRaw = await AsyncStorage.getItem('checkInHistory');
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyEntries = history.filter(
      (entry) => new Date(entry.timestamp) >= weekAgo
    );

    if (isSunday && !alreadyUpdated && weeklyEntries.length >= 14) {
      const mindMirror = await generateWeeklyMindMirror(prompt);
      await AsyncStorage.setItem('lastMindMirrorUpdate', today.toISOString());
      return mindMirror;
    }
    return 'No MindMirror yet.';
  } catch (err) {
    console.error('❌ Error triggering MindMirror:', err);
    return 'No MindMirror yet.';
  }
}
