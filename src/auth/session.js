import AsyncStorage from '@react-native-async-storage/async-storage';
import { refresh } from './api';

const KEY = 'ascent.session';
const EXPIRY_MARGIN_MS = 60000;

let session = null;
let restored = false;
let refreshing = null;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener(session));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSession() {
  return session;
}

/**
 * Identity only. The display name lives in the climbers row, never here —
 * token metadata is written once at sign-up and goes stale silently.
 */
export function getUser() {
  if (!session) return null;
  return { id: session.user.id, email: session.user.email };
}

function normalise(raw) {
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: Date.now() + (raw.expires_in ?? 3600) * 1000,
    user: raw.user,
  };
}

export async function setSession(raw) {
  session = normalise(raw);
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
  emit();
  return session;
}

export async function clearSession() {
  session = null;
  await AsyncStorage.removeItem(KEY);
  emit();
}

export async function restoreSession() {
  if (restored) return session;
  restored = true;

  const stored = await AsyncStorage.getItem(KEY);
  if (stored) {
    try {
      session = JSON.parse(stored);
    } catch {
      session = null;
    }
  }
  emit();
  return session;
}

/** Fresh access token, refreshing when close to expiry. Null when signed out. */
export async function getAccessToken() {
  await restoreSession();
  if (!session) return null;
  if (Date.now() < session.expiresAt - EXPIRY_MARGIN_MS) return session.accessToken;

  refreshing =
    refreshing ??
    refresh(session.refreshToken)
      .then((raw) => setSession(raw))
      .catch(async (error) => {
        // A rejected refresh token cannot recover; anything else may be transient.
        if (error.status === 400 || error.status === 401) await clearSession();
        throw error;
      })
      .finally(() => {
        refreshing = null;
      });

  const next = await refreshing;
  return next?.accessToken ?? null;
}
