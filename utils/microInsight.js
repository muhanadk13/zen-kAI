import axios from 'axios';
import { OPENAI_API_KEY } from './apiKey';
import { microInsightPrompt } from './gptPrompts';

export async function generateMicroInsight(checkIns, yesterday) {
  const prompt = microInsightPrompt(checkIns[0], yesterday);
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a supportive assistant.' },
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
  return response.data.choices[0].message.content.trim();
}
