import AsyncStorage from '@react-native-async-storage/async-storage';

const HEARTS_KEY = 'zenHearts';
const HEARTS_DATE_KEY = 'zenHeartsDate';
const MAX_HEARTS = 5;

export async function getHearts() {
  const storedDate = await AsyncStorage.getItem(HEARTS_DATE_KEY);
  const today = new Date().toISOString().split('T')[0];
  if (storedDate !== today) {
    await AsyncStorage.setItem(HEARTS_DATE_KEY, today);
    await AsyncStorage.setItem(HEARTS_KEY, String(MAX_HEARTS));
    return MAX_HEARTS;
  }
  const raw = await AsyncStorage.getItem(HEARTS_KEY);
  return raw ? parseInt(raw, 10) : MAX_HEARTS;
}

export async function loseHeart() {
  let hearts = await getHearts();
  hearts = Math.max(0, hearts - 1);
  await AsyncStorage.setItem(HEARTS_KEY, String(hearts));
  return hearts;
}

export async function restoreHearts() {
  await AsyncStorage.setItem(HEARTS_KEY, String(MAX_HEARTS));
  return MAX_HEARTS;
}
