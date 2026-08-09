import { OTP_LENGTH, USERNAME_MAX, USERNAME_MIN } from './config';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME = /^[\w .-]+$/;

export function normaliseEmail(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

export function normaliseUsername(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ');
}

export function validateEmail(raw) {
  return EMAIL.test(normaliseEmail(raw)) ? null : 'Enter a valid email address.';
}

export function validateUsername(raw) {
  const name = normaliseUsername(raw);
  if (name.length < USERNAME_MIN) return `Name must be at least ${USERNAME_MIN} characters.`;
  if (name.length > USERNAME_MAX) return `Name must be at most ${USERNAME_MAX} characters.`;
  if (!USERNAME.test(name)) return 'Use letters, numbers, spaces, . _ or - only.';
  return null;
}

export function normaliseCode(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

export function validateCode(raw) {
  const code = normaliseCode(raw);
  return code.length === OTP_LENGTH ? null : `Enter the ${OTP_LENGTH}-digit code.`;
}
