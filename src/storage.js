import AsyncStorage from '@react-native-async-storage/async-storage';

const LIFETIME_KEY = 'ascent.lifetimeMiles';
const PENDING_KEY = 'ascent.pendingSession';

export async function loadLifetime() {
  const raw = await AsyncStorage.getItem(LIFETIME_KEY);
  const value = Number.parseFloat(raw ?? '0');
  return Number.isFinite(value) ? value : 0;
}

export async function saveLifetime(miles) {
  await AsyncStorage.setItem(LIFETIME_KEY, String(miles));
}

/**
 * A session snapshot written the moment the app is backgrounded, so the Toll
 * still finds them if they force-quit or reboot rather than coming back.
 */
export async function savePending(snapshot) {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(snapshot));
}

export async function loadPending() {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearPending() {
  await AsyncStorage.removeItem(PENDING_KEY);
}
