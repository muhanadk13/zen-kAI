import AsyncStorage from '@react-native-async-storage/async-storage';

const MIND_SCORE_KEY = 'mindScore';
const MOMENTUM_KEY = 'momentum';
const STREAK_RINGS_KEY = 'streakRings';
const TRAIT_XP_KEY = 'traitXP';
const XP_KEY = 'xpData';
const DAILY_GOAL_KEY = 'dailyGoal';
const LAST_CHECKIN_KEY = 'lastCheckIn';
const CURRENT_STREAK_KEY = 'currentStreak';
const LONGEST_STREAK_KEY = 'longestStreak';

const DAY_MS = 24 * 60 * 60 * 1000;

const getDateKey = (date = new Date()) => date.toISOString().split('T')[0];

/**
 * Momentum-based Mental Score system.
 *
 * The score persists between 300–900. Each day, the previous day's
 * average check-in metrics modify the score. Missing a day deducts 10.
 * Every 3-day streak grants a +4 bonus.
 */
export async function updateMindScore() {
  try {
    const historyRaw = await AsyncStorage.getItem('checkInHistory');
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    const todayKey = getDateKey();
    const raw = await AsyncStorage.getItem(MIND_SCORE_KEY);
    let data = raw ? JSON.parse(raw) : { date: todayKey, value: 600 };

    // Nothing to update if we've already processed today
    if (data.date === todayKey) return data.value;

    let score = data.value;
    let day = new Date(data.date);
    const end = new Date(todayKey);

    while (day < end) {
      const dayKey = getDateKey(day);
      const entries = history.filter((e) => e.timestamp.startsWith(dayKey));

      if (entries.length === 0) {
        // Missed day penalty
        score -= 10;
      } else {
        const dailyAvg = Math.round(
          entries.reduce(
            (s, e) => s + (e.energy + e.clarity + e.emotion) / 3,
            0
          ) / entries.length
        );

        if (dailyAvg >= 85) score += 7;
        else if (dailyAvg >= 70) score += 5;
        else if (dailyAvg >= 50) score += 2;
        else if (dailyAvg >= 30) score -= 3;
        else score -= 7;

        const streakRaw = await AsyncStorage.getItem(CURRENT_STREAK_KEY);
        const streak = streakRaw ? parseInt(streakRaw, 10) : 0;
        if (streak > 0 && streak % 3 === 0) score += 4;
      }

      score = Math.min(900, Math.max(300, score));
      day = new Date(day.getTime() + DAY_MS);
    }

    await AsyncStorage.setItem(
      MIND_SCORE_KEY,
      JSON.stringify({ date: todayKey, value: score })
    );
    return score;
  } catch (err) {
    console.error('updateMindScore', err);
    return 600;
  }
}

/**
 * Update daily momentum bar
 */
export async function updateMomentum() {
  try {
    const raw = await AsyncStorage.getItem(MOMENTUM_KEY);
    const data = raw ? JSON.parse(raw) : { value: 0, last: getDateKey() };
    const last = new Date(data.last);
    const now = new Date();
    const diffDays = Math.floor((now - last) / DAY_MS);
    let value = data.value;
    if (diffDays > 0) {
      value = Math.max(0, value - diffDays * 20); // decay
    }
    value = Math.min(100, value + 34); // check-in boost
    await AsyncStorage.setItem(MOMENTUM_KEY, JSON.stringify({
      value,
      last: getDateKey()
    }));
    return value;
  } catch (err) {
    console.error('updateMomentum', err);
    return 0;
  }
}

/**
 * XP handling
 */
export async function updateXP(amount = 10) {
  try {
    const raw = await AsyncStorage.getItem(XP_KEY);
    const data = raw
      ? JSON.parse(raw)
      : { date: getDateKey(), xpToday: 0, total: 0 };
    const today = getDateKey();
    if (data.date !== today) {
      data.date = today;
      data.xpToday = 0;
    }
    data.xpToday += amount;
    data.total += amount;
    await AsyncStorage.setItem(XP_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error('updateXP', err);
    return { xpToday: 0, total: 0 };
  }
}

export function levelFromXP(xp) {
  return Math.floor(Math.sqrt(xp / 5)) + 1;
}

export function xpForLevel(level) {
  return 5 * (level - 1) * (level - 1);
}

export function xpStats(total) {
  const level = levelFromXP(total);
  const currentXP = xpForLevel(level);
  const nextXP = xpForLevel(level + 1);
  const progress = Math.round(((total - currentXP) / (nextXP - currentXP)) * 100);
  return { level, progress };
}

export async function getXP() {
  const raw = await AsyncStorage.getItem(XP_KEY);
  if (!raw) return { xpToday: 0, total: 0, level: 1, progress: 0 };
  const data = JSON.parse(raw);
  const { level, progress } = xpStats(data.total);
  return { ...data, level, progress };
}

const DAILY_GOALS = [
  { id: 'three-checkins', text: 'Log all 3 check-ins' },
  { id: 'add-tag', text: 'Add a tag to your note' },
  { id: 'reflect-5', text: 'Reflect for 5 minutes' },
];

export async function getDailyGoal() {
  const today = getDateKey();
  const raw = await AsyncStorage.getItem(DAILY_GOAL_KEY);
  let data = raw ? JSON.parse(raw) : {};
  if (data.date !== today) {
    const goal = DAILY_GOALS[Math.floor(Math.random() * DAILY_GOALS.length)];
    data = { date: today, goal, completed: false };
    await AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(data));
  }
  return data;
}

export async function updateDailyGoal(action) {
  const data = await getDailyGoal();
  if (data.completed) return data;
  if (data.goal.id === 'three-checkins' && action === 'checkin') {
    const raw = await AsyncStorage.getItem('checkInHistory');
    const history = raw ? JSON.parse(raw) : [];
    const today = getDateKey();
    const count = history.filter((e) => e.timestamp.startsWith(today)).length;
    if (count >= 3) data.completed = true;
  }
  if (data.goal.id === 'add-tag' && action === 'addTag') {
    data.completed = true;
  }
  if (data.goal.id === 'reflect-5' && action === 'reflection') {
    data.completed = true;
  }
  if (data.completed) {
    await AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(data));
    await updateXP(10);
  }
  return data;
}

/**
 * Mark streak ring progress
 */
export async function markEnergyLogged() {
  await updateRing('ring1');
  await updateDailyGoal('checkin');
}

export async function markReflectionComplete() {
  await updateRing('ring2');
  await updateXP(25);
  await updateDailyGoal('reflection');
}

export async function markInsightRead() {
  await updateRing('ring3');
  await updateDailyGoal('insight');
}

async function updateRing(ring) {
  try {
    const raw = await AsyncStorage.getItem(STREAK_RINGS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const today = getDateKey();
    if (!data[today]) data[today] = { ring1: false, ring2: false, ring3: false, bonus: false };
    data[today][ring] = true;
    if (!data[today].bonus && data[today].ring1 && data[today].ring2 && data[today].ring3) {
      data[today].bonus = true;
      await updateXP(10);
    }
    await AsyncStorage.setItem(STREAK_RINGS_KEY, JSON.stringify(data));
    return data[today];
  } catch (err) {
    console.error('updateRing', err);
  }
}

/**
 * Trait XP system
 */
export async function updateTraitXP(tags) {
  if (!tags || !tags.length) return;
  try {
    const raw = await AsyncStorage.getItem(TRAIT_XP_KEY);
    const xp = raw ? JSON.parse(raw) : {};
    tags.forEach((t) => {
      xp[t] = (xp[t] || 0) + 1;
    });
    await AsyncStorage.setItem(TRAIT_XP_KEY, JSON.stringify(xp));
  } catch (err) {
    console.error('updateTraitXP', err);
  }
}

/**
 * Calculate weekly mind grade once per week
 */

export async function updateStreak() {
  try {
    const today = getDateKey();
    const [lastRaw, currentRaw, longestRaw] = await Promise.all([
      AsyncStorage.getItem(LAST_CHECKIN_KEY),
      AsyncStorage.getItem(CURRENT_STREAK_KEY),
      AsyncStorage.getItem(LONGEST_STREAK_KEY),
    ]);
    let current = currentRaw ? parseInt(currentRaw, 10) : 0;
    let longest = longestRaw ? parseInt(longestRaw, 10) : 0;

    if (lastRaw === today) {
      return current;
    }

    if (lastRaw) {
      const diff = Math.floor((new Date(today) - new Date(lastRaw)) / DAY_MS);
      if (diff === 1) current += 1;
      else current = 1;
    } else {
      current = 1;
    }

    if (current > longest) longest = current;

    await AsyncStorage.multiSet([
      [LAST_CHECKIN_KEY, today],
      [CURRENT_STREAK_KEY, current.toString()],
      [LONGEST_STREAK_KEY, longest.toString()],
    ]);
    return current;
  } catch (err) {
    console.error('updateStreak', err);
    return 0;
  }
}

// Reset streak if last check-in wasn't yesterday or today. Called on app launch.
export async function resetStreakIfNeeded() {
  try {
    const today = getDateKey();
    const [lastRaw, currentRaw] = await Promise.all([
      AsyncStorage.getItem(LAST_CHECKIN_KEY),
      AsyncStorage.getItem(CURRENT_STREAK_KEY),
    ]);
    const current = currentRaw ? parseInt(currentRaw, 10) : 0;
    if (!lastRaw) return current;
    const diff = Math.floor((new Date(today) - new Date(lastRaw)) / DAY_MS);
    if (diff > 1) {
      await AsyncStorage.setItem(CURRENT_STREAK_KEY, '0');
      return 0;
    }
    return current;
  } catch (err) {
    console.error('resetStreakIfNeeded', err);
    return 0;
  }
}

/**
 * Helper to get current scores
 */
export async function getCurrentScores() {
  const [mindRaw, momentumRaw, streakRaw, traitRaw, xpStatsRaw, goalRaw, streakValRaw, longestRaw] = await Promise.all([
    AsyncStorage.getItem(MIND_SCORE_KEY),
    AsyncStorage.getItem(MOMENTUM_KEY),
    AsyncStorage.getItem(STREAK_RINGS_KEY),
    AsyncStorage.getItem(TRAIT_XP_KEY),
    AsyncStorage.getItem(XP_KEY),
    AsyncStorage.getItem(DAILY_GOAL_KEY),
    AsyncStorage.getItem(CURRENT_STREAK_KEY),
    AsyncStorage.getItem(LONGEST_STREAK_KEY),
  ]);
  const xpData = xpStatsRaw ? JSON.parse(xpStatsRaw) : { xpToday: 0, total: 0 };
  const { level, progress } = xpStats(xpData.total);
  return {
    mindScore: mindRaw ? JSON.parse(mindRaw).value : 600,
    momentum: momentumRaw ? JSON.parse(momentumRaw).value : 0,
    streakRings: streakRaw ? JSON.parse(streakRaw)[getDateKey()] || {} : {},
    traitXP: traitRaw ? JSON.parse(traitRaw) : {},
    xp: { ...xpData, level, progress },
    dailyGoal: goalRaw ? JSON.parse(goalRaw) : null,
    streak: streakValRaw ? parseInt(streakValRaw, 10) : 0,
    longestStreak: longestRaw ? parseInt(longestRaw, 10) : 0,
  };
}

/**
 * Update all metrics after a check-in
 */
export async function processCheckIn(entry) {
  await updateStreak();
  await updateMindScore();
  await updateMomentum();
  await markEnergyLogged();
  let xpAmount = 10;
  if (entry.window === 'checkIn1') xpAmount = 10;
  else if (entry.window === 'checkIn2') xpAmount = 10;
  else if (entry.window === 'checkIn3') xpAmount = 15;
  await updateXP(xpAmount);
  await updateTraitXP(entry.tags || []);
}
