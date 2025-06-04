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

  const enhanced = {
    ...checkIn,
    focus:
      checkIn.focus != null
        ? checkIn.focus
        : calculateFocus(checkIn.clarity || 0, checkIn.energy || 0),
    noteLength: checkIn.notes ? checkIn.notes.length : 0,
    timestamp: checkIn.timestamp || new Date().toISOString(),
  };

  await AsyncStorage.setItem(key, JSON.stringify(enhanced));
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
    result[day] = {
      energy: Math.round(vals.energy / vals.count),
      clarity: Math.round(vals.clarity / vals.count),
      emotion: Math.round(vals.emotion / vals.count),
    };
  });
  return result;
}

export async function gatherExtendedStats() {
  const keys = await AsyncStorage.getAllKeys();
  const memoryKeys = keys.filter((k) => k.startsWith('memory-'));
  const items = await AsyncStorage.multiGet(memoryKeys);
  const data = items.map(([, value]) => JSON.parse(value));

  const last7 = data.filter(
    (d) => new Date(d.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const checkInCount = last7.length;
  const avgNoteLength =
    last7.reduce((sum, e) => sum + (e.noteLength || 0), 0) / (checkInCount || 1);

  const windowCounts = {};
  last7.forEach((e) => {
    if (e.window) windowCounts[e.window] = (windowCounts[e.window] || 0) + 1;
  });
  const mostCommonWindow = Object.entries(windowCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  return { checkInCount, avgNoteLength: Math.round(avgNoteLength), mostCommonWindow };
}
