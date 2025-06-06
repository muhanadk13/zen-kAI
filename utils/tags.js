export const defaultTags = {
  emotions: [
    'Stressed', 'Grateful', 'Anxious', 'Excited', 'Burned Out',
    'Lonely', 'Overwhelmed', 'Motivated',
    'Peaceful', 'Focused','Confident'
  ],
  activities: [
    'Worked Out', 'Studied', 'Socialized', 'Skipped Gym',
    'Ate Clean', 'Went On A Walk', 'Read A Book',
    'Mindlessly Scrolled', 'Meditated',
    'Worked', 'Napped', 'Stayed Up Late'
  ],
  themes: [
    'Productivity', 'Routine', 'Relationships', 
    'Discipline', 'Self-Worth', 'Health',
     'Purpose', 'Growth', 'Confidence',
    'Mental Clarity', 'Social Pressure'
  ],
};


const USER_TAGS_KEY = 'userTags';

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getUserTags() {
  try {
    const raw = await AsyncStorage.getItem(USER_TAGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addUserTag(tag) {
  const trimmed = tag.trim();
  if (!trimmed) return getUserTags();
  const tags = await getUserTags();
  if (!tags.includes(trimmed)) {
    const updated = [...tags, trimmed];
    await AsyncStorage.setItem(USER_TAGS_KEY, JSON.stringify(updated));
    return updated;
  }
  return tags;
}
