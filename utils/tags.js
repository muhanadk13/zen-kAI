export const defaultTags = {
  emotions: ['stressed', 'grateful', 'anxious', 'excited', 'burned out'],
  activities: ['worked out', 'studied', 'socialized', 'skipped gym'],
  themes: ['productivity', 'routine', 'relationships', 'body image'],
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
