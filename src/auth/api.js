import { auth } from '../backend';

/** Emails a one-time code. `create` distinguishes signing up from signing in. */
export function requestCode(email, username, { create }) {
  return auth('otp', {
    method: 'POST',
    body: {
      email,
      create_user: create,
      data: username ? { username } : undefined,
    },
  });
}

/** Exchanges the code for a session. */
export function verifyCode(email, token) {
  return auth('verify', {
    method: 'POST',
    body: { email, token, type: 'email' },
  });
}

/** Password sign-in, used only by the review account. */
export function signInWithPassword(email, password) {
  return auth('token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
}

export function refresh(refreshToken) {
  return auth('token?grant_type=refresh_token', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
}

export function signOut(accessToken) {
  return auth('logout', { method: 'POST', token: accessToken });
}
