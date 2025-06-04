import AsyncStorage from '@react-native-async-storage/async-storage';

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function calculateFocus(clarity, energy) {
  return Math.round(0.6 * clarity + 0.4 * energy);
}

export function calculateMentalScore(energyScores, clarityScores, emotionScores) {
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const energyAvg = avg(energyScores);
  const clarityAvg = avg(clarityScores);
  const emotionAvg = avg(emotionScores);
  return Math.floor(0.4 * energyAvg + 0.3 * clarityAvg + 0.3 * emotionAvg);
}

export async function saveCheckIn(checkIn) {
  const date = checkIn.date || new Date().toISOString().split('T')[0];
  const key = `memory-${date}`;
  await AsyncStorage.setItem(key, JSON.stringify(checkIn));
}

export async function scanWeeklyPatterns() {
  const keys = await AsyncStorage.getAllKeys();
  const memoryKeys = keys.filter((k) => k.startsWith('memory-'));
  const items = await AsyncStorage.multiGet(memoryKeys);
  const data = items.map(([, value]) => JSON.parse(value));
  const last30 = data
    .filter((d) =>
      new Date(d.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
  const grouped = {};
  last30.forEach((d) => {
    const weekday = new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!grouped[weekday]) grouped[weekday] = { count: 0, energy: 0, clarity: 0, emotion: 0 };
    grouped[weekday].count += 1;
    grouped[weekday].energy += d.energy;
    grouped[weekday].clarity += d.clarity;
    grouped[weekday].emotion += d.emotion;
  });
  const result = {};
  Object.entries(grouped).forEach(([day, vals]) => {
    if (vals.count === 0) {
      result[day] = { energy: null, clarity: null, emotion: null }; // or 0 or "N/A"
    } else {
      result[day] = {
        energy: Math.round(vals.energy / vals.count),
        clarity: Math.round(vals.clarity / vals.count),
        emotion: Math.round(vals.emotion / vals.count),
      };
    }
  });
  
  return result;
}
