// Utility functions for analyzing check-in history
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to fetch history from storage
async function getHistory() {
  const raw = await AsyncStorage.getItem('checkInHistory');
  return raw ? JSON.parse(raw) : [];
}

// Helper to compute mental score from an entry
function computeScore(entry) {
  const energy = entry.energy ?? 0;
  const clarity = entry.clarity ?? 0;
  const emotion = entry.emotion ?? 0;
  const focus = Math.round(0.6 * clarity + 0.4 * energy);
  const mental = Math.round((energy + clarity + emotion + focus) / 4);
  return { energy, clarity, emotion, focus, mental };
}

// Get check-ins for the last N days
async function getLastNDays(days) {
  const history = await getHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return history.filter((e) => new Date(e.timestamp) >= cutoff);
}

function formatPercent(num) {
  const sign = num > 0 ? '+' : '';
  return `${sign}${Math.round(num)}%`;
}

function extractContexts(note) {
  if (!note) return [];
  return note
    .toLowerCase()
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function getWeeklyScoreChange() {
  const history = await getHistory();
  const now = new Date();
  const startThisWeek = new Date(now);
  startThisWeek.setDate(startThisWeek.getDate() - 7);
  const startLastWeek = new Date(now);
  startLastWeek.setDate(startLastWeek.getDate() - 14);

  const thisWeek = history.filter((e) => new Date(e.timestamp) >= startThisWeek);
  const lastWeek = history.filter(
    (e) => new Date(e.timestamp) >= startLastWeek && new Date(e.timestamp) < startThisWeek
  );

  const fields = ['energy', 'clarity', 'emotion'];
  const avg = (arr, field) =>
    arr.reduce((sum, e) => sum + (e[field] ?? 0), 0) / (arr.length || 1);

  const diffs = fields.map((f) => avg(thisWeek, f) - avg(lastWeek, f));
  const parts = fields.map((f, i) => `${f.charAt(0).toUpperCase() + f.slice(1)} ${formatPercent(diffs[i])}`);
  return parts.join(', ');
}

export async function getTopNegativeContexts() {
  const week = await getLastNDays(7);
  if (!week.length) return 'No data yet.';
  const overallEmotion = week.reduce((s, e) => s + (e.emotion ?? 0), 0) / week.length;
  const map = {};
  week.forEach((e) => {
    extractContexts(e.note).forEach((ctx) => {
      if (!map[ctx]) map[ctx] = { count: 0, emotion: 0 };
      map[ctx].count += 1;
      map[ctx].emotion += e.emotion ?? 0;
    });
  });
  let worst = null;
  Object.entries(map).forEach(([ctx, obj]) => {
    if (obj.count < 2) return;
    const avgEmotion = obj.emotion / obj.count;
    const diff = avgEmotion - overallEmotion;
    if (!worst || diff < worst.diff) worst = { ctx, diff, count: obj.count };
  });
  if (!worst) return 'No negative patterns detected.';
  const drop = Math.abs(Math.round(worst.diff));
  return `Days with '${worst.ctx}' saw Emotion drop by ${drop}% (${worst.count} times).`;
}

export async function getTopPositiveContexts() {
  const week = await getLastNDays(7);
  if (!week.length) return 'No data yet.';
  const overallClarity = week.reduce((s, e) => s + (e.clarity ?? 0), 0) / week.length;
  const map = {};
  week.forEach((e) => {
    extractContexts(e.note).forEach((ctx) => {
      if (!map[ctx]) map[ctx] = { count: 0, clarity: 0 };
      map[ctx].count += 1;
      map[ctx].clarity += e.clarity ?? 0;
    });
  });
  let best = null;
  Object.entries(map).forEach(([ctx, obj]) => {
    if (obj.count < 2) return;
    const avgClarity = obj.clarity / obj.count;
    const diff = avgClarity - overallClarity;
    if (!best || diff > best.diff) best = { ctx, diff, count: obj.count };
  });
  if (!best) return 'No positive patterns detected.';
  const rise = Math.round(best.diff);
  return `'${best.ctx}' raised Clarity by ${rise}% on average this week.`;
}

export async function getTimeOfDayPerformance() {
  const week = await getLastNDays(7);
  if (!week.length) return 'No data yet.';
  const byWindow = { checkIn1: [], checkIn2: [], checkIn3: [] };
  week.forEach((e) => byWindow[e.window]?.push(e));
  const avgEmotion = (arr) =>
    arr.reduce((s, e) => s + (e.emotion ?? 0), 0) / (arr.length || 1);
  const m = avgEmotion(byWindow.checkIn1);
  const e = avgEmotion(byWindow.checkIn3);
  if (!byWindow.checkIn1.length || !byWindow.checkIn3.length) return 'Not enough data.';
  const diff = Math.round(m - e);
  return `Evening check-ins had ${diff}% lower Emotion than morning ones.`;
}

export async function getMissedCheckInFlags() {
  const week = await getLastNDays(7);
  const days = {};
  week.forEach((e) => {
    const d = e.timestamp.split('T')[0];
    if (!days[d]) days[d] = { checkIn1: false, checkIn2: false, checkIn3: false };
    days[d][e.window] = true;
  });
  const counts = { checkIn1: 0, checkIn2: 0, checkIn3: 0 };
  const totalDays = Object.keys(days).length;
  Object.values(days).forEach((v) => {
    ['checkIn1', 'checkIn2', 'checkIn3'].forEach((w) => {
      if (!v[w]) counts[w] += 1;
    });
  });
  const worst = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return `${worst[0]} was skipped ${worst[1]} out of ${totalDays} days this week.`;
}

export async function getMostVolatileDay() {
  const week = await getLastNDays(7);
  if (week.length < 6) return 'No data yet.';
  const byDate = {};
  week.forEach((e) => {
    const d = e.timestamp.split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(computeScore(e).mental);
  });
  let target = null;
  Object.entries(byDate).forEach(([d, scores]) => {
    const swing = Math.max(...scores) - Math.min(...scores);
    if (!target || swing > target.swing) target = { d, swing };
  });
  if (!target) return 'No volatility detected.';
  const dayName = new Date(target.d).toLocaleDateString('en-US', { weekday: 'long' });
  return `${dayName} showed a ${target.swing}-point swing between check-ins — highest this week.`;
}

export async function getHighestScoringDay() {
  const week = await getLastNDays(7);
  if (!week.length) return 'No data yet.';
  const byDate = {};
  week.forEach((e) => {
    const d = e.timestamp.split('T')[0];
    if (!byDate[d]) byDate[d] = { entries: [], notes: [] };
    byDate[d].entries.push(computeScore(e));
    if (e.note) byDate[d].notes.push(e.note);
  });
  let best = null;
  Object.entries(byDate).forEach(([d, info]) => {
    const avg = info.entries.reduce((s, v) => ({
      energy: s.energy + v.energy,
      clarity: s.clarity + v.clarity,
      emotion: s.emotion + v.emotion,
    }), { energy: 0, clarity: 0, emotion: 0 });
    const len = info.entries.length;
    const score = (avg.energy + avg.clarity + avg.emotion) / (3 * len);
    if (!best || score > best.score) best = { d, score, avg, len, notes: info.notes };
  });
  if (!best) return 'No data yet.';
  const dayName = new Date(best.d).toLocaleDateString('en-US', { weekday: 'long' });
  const e = Math.round(best.avg.energy / best.len);
  const c = Math.round(best.avg.clarity / best.len);
  const em = Math.round(best.avg.emotion / best.len);
  const context = best.notes.join(', ');
  return `${dayName} was your best day: Energy ${e}, Clarity ${c}, Emotion ${em} — tagged '${context}'.`;
}

export async function getLowestScoringDay() {
  const week = await getLastNDays(7);
  if (!week.length) return 'No data yet.';
  const byDate = {};
  week.forEach((e) => {
    const d = e.timestamp.split('T')[0];
    if (!byDate[d]) byDate[d] = { entries: [], notes: [] };
    byDate[d].entries.push(computeScore(e));
    if (e.note) byDate[d].notes.push(e.note);
  });
  let worst = null;
  Object.entries(byDate).forEach(([d, info]) => {
    const avg = info.entries.reduce((s, v) => ({
      energy: s.energy + v.energy,
      clarity: s.clarity + v.clarity,
      emotion: s.emotion + v.emotion,
    }), { energy: 0, clarity: 0, emotion: 0 });
    const len = info.entries.length;
    const score = (avg.energy + avg.clarity + avg.emotion) / (3 * len);
    if (!worst || score < worst.score) worst = { d, score, avg, len, notes: info.notes };
  });
  if (!worst) return 'No data yet.';
  const dayName = new Date(worst.d).toLocaleDateString('en-US', { weekday: 'long' });
  const e = Math.round(worst.avg.energy / worst.len);
  const em = Math.round(worst.avg.emotion / worst.len);
  const context = worst.notes.join(', ');
  return `${dayName} showed the lowest scores: Energy ${e}, Emotion ${em} — preceded by ${context}.`;
}

export async function getVolatilityScore() {
  const week = await getLastNDays(7);
  if (!week.length) return 'No data yet.';
  const byDate = {};
  week.forEach((e) => {
    const d = e.timestamp.split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(computeScore(e).mental);
  });
  const swings = Object.values(byDate).map((scores) => Math.max(...scores) - Math.min(...scores));
  const avgSwing = swings.reduce((s, v) => s + v, 0) / swings.length;
  return `Your mental volatility this week was high (±${Math.round(avgSwing)} points/day).`;
}

export async function getCheckIn2DropPattern() {
  const week = await getLastNDays(7);
  if (!week.length) return 'No data yet.';
  const byDate = {};
  week.forEach((e) => {
    const d = e.timestamp.split('T')[0];
    if (!byDate[d]) byDate[d] = {};
    byDate[d][e.window] = computeScore(e).mental;
  });
  let count = 0;
  let daysWithData = 0;
  Object.values(byDate).forEach((windows) => {
    if (windows.checkIn2 != null) {
      daysWithData += 1;
      const values = Object.values(windows);
      const min = Math.min(...values);
      if (windows.checkIn2 === min) count += 1;
    }
  });
  if (!daysWithData) return 'No data yet.';
  return `Check-in 2 was the lowest-scoring slot on ${count} out of ${daysWithData} days.`;
}
