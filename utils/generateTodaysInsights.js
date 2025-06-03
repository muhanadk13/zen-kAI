import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// OpenAI API key (ensure this is securely stored in production)
const OPENAI_API_KEY = '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';

// Function to generate Today's Insight using GPT
export async function generateTodaysInsight(metrics) {
  const { energy, clarity, emotion, focus } = metrics;
  const today = new Date().toISOString().split('T')[0];
  let insight = '';

  try {
    // Fetch check-in history
    const historyRaw = await AsyncStorage.getItem('checkInHistory');
    const history = historyRaw ? JSON.parse(historyRaw) : [];

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

    // Prepare prompt for GPT
    const prompt = `
      You are an AI assistant generating a concise, personalized mental health insight for a user based on their daily check-in metrics. The insight should be encouraging, reflective, and include actionable advice. Use emojis (📈, 📉, 🔁, ⚡, 💡, 💚, 🎯) to make it engaging. Format the response with a trend statement, a bolded highlight (e.g., **Great job!**), and a tip if a metric is low (<35%). Keep it under 100 words.

      Today's Metrics:
      - Energy: ${energy}% ⚡
      - Clarity: ${clarity}% 💡
      - Emotion: ${emotion}% 💚
      - Focus: ${focus}% 🎯
      - Mental Score: ${mentalScore}%

      Yesterday's Averages (if available):
      ${yesterdayAvg
        ? `- Energy: ${Math.round(yesterdayAvg.energy)}%
         - Clarity: ${Math.round(yesterdayAvg.clarity)}%
         - Emotion: ${Math.round(yesterdayAvg.emotion)}%
         - Focus: ${Math.round(yesterdayAvg.focus)}%`
        : 'No data available.'}

      Generate an insight comparing today to yesterday (if data exists) and highlight the strongest/weakest metric.
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