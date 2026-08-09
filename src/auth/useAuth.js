import { useCallback, useEffect, useState } from 'react';
import { claimUsername, fetchClimber, isUsernameTaken } from '../leaderboard';
import { normaliseEmail, normaliseUsername, validateEmail, validateUsername } from '../validation';
import * as api from './api';
import { clearSession, getSession, getUser, restoreSession, setSession, subscribe } from './session';

const PENDING = 'pending';
const RESOLVED = 'resolved';
const UNAVAILABLE = 'unavailable';

export const AUTH = {
  LOADING: 'loading',
  SIGNED_OUT: 'signedOut',
  SIGNED_IN: 'signedIn',
};

export function useAuth() {
  const [status, setStatus] = useState(AUTH.LOADING);
  const [user, setUser] = useState(null);
  // pending → the row has not been read yet, so we do not know which screen
  // belongs on top; unavailable → offline, let them through without a name.
  const [nameStatus, setNameStatus] = useState(PENDING);

  useEffect(() => {
    let active = true;

    const sync = async () => {
      if (!active) return;

      const base = getUser();
      setStatus(getSession() ? AUTH.SIGNED_IN : AUTH.SIGNED_OUT);
      setUser(base ? { ...base, username: null } : null);
      setNameStatus(PENDING);
      if (!base) return;

      // Token metadata only carries the name for accounts created through this
      // flow. The climbers row is what the ranking actually shows, so it wins.
      try {
        const row = await fetchClimber(base.id);
        if (!active) return;
        setUser({ ...base, username: row?.username ?? null });
        setNameStatus(RESOLVED);
      } catch {
        // Offline: let them climb. A name cannot be checked for collisions or
        // saved right now, so asking for one would only fail.
        if (active) setNameStatus(UNAVAILABLE);
      }
    };

    const unsubscribe = subscribe(sync);
    restoreSession().then(sync);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  /** Emails a code. The account is created if it is the first time. */
  const requestCode = useCallback(async (rawEmail) => {
    const email = normaliseEmail(rawEmail);
    const invalid = validateEmail(email);
    if (invalid) return { ok: false, message: invalid };

    await api.requestCode(email, null, { create: true });
    return { ok: true, email };
  }, []);

  /** Exchanges the code for a session. The name, if any, is asked for after. */
  const verifyCode = useCallback(async (email, code) => {
    const raw = await api.verifyCode(email, code.trim());
    if (!raw?.access_token) return { ok: false, message: 'That code did not work. Try again.' };

    await setSession(raw);
    return { ok: true };
  }, []);

  /** Claims a name for the signed-in account and puts them on the board. */
  const claimName = useCallback(async (username, totalMs) => {
    const current = getSession();
    if (!current) return { ok: false, message: 'Not signed in.' };

    const invalid = validateUsername(username);
    if (invalid) return { ok: false, message: invalid };

    if (await isUsernameTaken(username)) return { ok: false, taken: true };

    const claim = await claimUsername(current.user.id, username, totalMs);
    if (!claim.ok) return claim;

    setUser((previous) => ({ ...previous, username: normaliseUsername(username) }));
    setNameStatus(RESOLVED);
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    const current = getSession();
    if (current) await api.signOut(current.accessToken).catch(() => {});
    await clearSession();
  }, []);

  return {
    status,
    user,
    // False until the row has actually been read, so the app never flashes the
    // climb screen on the way to asking for a name.
    ready: status !== AUTH.SIGNED_IN || nameStatus !== PENDING,
    needsName: status === AUTH.SIGNED_IN && nameStatus === RESOLVED && !user?.username,
    requestCode,
    verifyCode,
    claimName,
    signOut,
  };
}
