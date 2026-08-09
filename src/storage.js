import AsyncStorage from '@react-native-async-storage/async-storage';
import { msForElevation } from './config';

const LIFETIME_KEY = 'ascent.lifetimeMiles';
const LIFETIME_MS_KEY = 'ascent.lifetimeMs';
const PENDING_KEY = 'ascent.pendingSession';

/**
 * Total time climbed, in milliseconds — the one number this app stores.
 *
 * Elevation used to be the stored figure, but the ranking orders climbers by
 * time spent, and elevation is a fixed multiple of it. Keeping both would be
 * two numbers that can drift apart; keeping time and deriving miles cannot.
 *
 * Installs from before the change still hold miles, so they are converted once
 * and the old key is left alone as a fallback.
 */
export async function loadLifetimeMs() {
  const raw = await AsyncStorage.getItem(LIFETIME_MS_KEY);
  if (raw != null) {
    const value = Number.parseFloat(raw);
    if (Number.isFinite(value)) return value;
  }

  const legacy = Number.parseFloat(await AsyncStorage.getItem(LIFETIME_KEY) ?? '0');
  if (Number.isFinite(legacy) && legacy > 0) {
    const ms = msForElevation(legacy);
    await AsyncStorage.setItem(LIFETIME_MS_KEY, String(ms));
    return ms;
  }

  return 0;
}

export async function saveLifetimeMs(ms) {
  await AsyncStorage.setItem(LIFETIME_MS_KEY, String(ms));
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
