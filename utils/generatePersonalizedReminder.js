import axios from 'axios';
import { OPENAI_API_KEY } from './apiKey';

export async function generatePersonalizedReminder(window) {
  const labelMap = {
    checkIn1: 'morning',
    checkIn2: 'afternoon',
    checkIn3: 'evening',
  };
  const label = labelMap[window] || 'evening';

  const prompt = `You are ZenKai, a wise, friendly coach. Write one short sentence to remind a user to complete their ${label} check-in. Be warm, motivating, and use slight FOMO like Duolingo. Keep it under 15 words. Use 1 emoji`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are ZenKai, a wise, friendly assistant who motivates users to keep up their self-reflection streaks using concise, kind nudges with a tiny bit of urgency.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 40,
        temperature: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    const message = response.data.choices[0]?.message?.content?.trim();
    if (message) {
      return message.replace(/\u2014/g, '-');
    } else {
      throw new Error('No message returned from GPT');
    }
  } catch (err) {
    console.error(`❌ GPT reminder fallback (${label}):`, err.message);
    return `Don't miss your ${label} check-in. Your streak is counting on it.`;
  }
}
