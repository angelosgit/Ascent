import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OTP_LENGTH } from '../config';
import { normaliseCode, validateCode } from '../validation';
import { COLORS, MONO } from '../theme';

const STEP = { EMAIL: 'email', CODE: 'code' };

/**
 * One path for everyone. New climbers and returning ones enter the same thing —
 * an email — and the server decides which they are.
 */
export default function AuthScreen({ onRequestCode, onVerifyCode }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submittedRef = useRef('');

  const run = async (task) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      const result = await onRequestCode(email);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSentTo(result.email);
      setStep(STEP.CODE);
    });

  const submitCode = () =>
    run(async () => {
      const invalid = validateCode(code);
      if (invalid) {
        setError(invalid);
        return;
      }
      const result = await onVerifyCode(sentTo, code);
      if (!result.ok) {
        setError(result.message ?? 'That code did not work. Try again.');
        submittedRef.current = '';
      }
    });

  const resend = () =>
    run(async () => {
      const result = await onRequestCode(sentTo);
      if (!result.ok) setError(result.message);
      setCode('');
      submittedRef.current = '';
    });

  const onEmail = step === STEP.EMAIL;
  const complete = normaliseCode(code).length === OTP_LENGTH;

  useEffect(() => {
    if (onEmail || !complete || busy || submittedRef.current === code) return;
    submittedRef.current = code;
    submitCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step, complete, busy]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.inner, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32 }]}>
        <View>
          <Text style={styles.kicker}>THE ASCENT</Text>
          <Text style={styles.title}>{onEmail ? 'Sign in to climb' : 'Check your email'}</Text>
          <Text style={styles.blurb}>
            {onEmail
              ? 'Enter your email and we will send you a code. No password to remember.'
              : `We sent a ${OTP_LENGTH}-digit code to ${sentTo}.`}
          </Text>
        </View>

        <View>
          {onEmail ? (
            <TextInput
              value={email}
              onChangeText={(next) => {
                setEmail(next);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor="rgba(140, 47, 18, 0.35)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={sendCode}
              style={styles.input}
            />
          ) : (
            <TextInput
              value={code}
              onChangeText={(next) => {
                setCode(normaliseCode(next));
                if (error) setError(null);
              }}
              placeholder={'0'.repeat(OTP_LENGTH)}
              placeholderTextColor="rgba(140, 47, 18, 0.35)"
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              editable={!busy}
              autoFocus
              style={[styles.input, styles.inputCentered]}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!onEmail ? (
            <Pressable onPress={resend} disabled={busy} hitSlop={10}>
              <Text style={styles.link}>Send another code</Text>
            </Pressable>
          ) : null}
        </View>

        <View>
          {!onEmail ? (
            <Pressable
              onPress={() => {
                setStep(STEP.EMAIL);
                setCode('');
                setError(null);
                submittedRef.current = '';
              }}
              disabled={busy}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryLabel}>Use a different email</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onEmail ? sendCode : submitCode}
            disabled={busy || (!onEmail && !complete)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              (busy || (!onEmail && !complete)) && styles.disabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={COLORS.cream} />
            ) : (
              <Text style={styles.buttonLabel}>{onEmail ? 'Send me a code' : 'Verify'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const MESSAGES = {
  NOT_CONFIGURED: 'The server is not connected yet.',
  TIMEOUT: 'The mountain is out of reach. Check your connection.',
  otp_expired: 'That code is wrong or has expired. Request a new one.',
  over_email_send_rate_limit: 'Please wait a minute before requesting another code.',
  email_address_invalid: 'That email address was not accepted.',
  signup_disabled: 'New accounts are not being accepted right now.',
};

function messageFor(error) {
  return MESSAGES[error?.code] ?? error?.message ?? 'Something went wrong. Try again.';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  kicker: { color: COLORS.ember, fontSize: 11, fontWeight: '800', letterSpacing: 4 },
  title: { color: COLORS.ink, fontSize: 34, fontWeight: '700', marginTop: 12 },
  blurb: { color: COLORS.rust, fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 320 },
  input: {
    color: COLORS.ink,
    fontFamily: MONO,
    fontSize: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(140, 47, 18, 0.3)',
  },
  inputCentered: { textAlign: 'center', fontSize: 26, letterSpacing: 8 },
  error: { color: COLORS.ember, fontSize: 13, marginTop: 12, fontWeight: '600' },
  link: { color: COLORS.rust, fontSize: 13, fontWeight: '700', marginTop: 16 },
  button: { paddingVertical: 16, borderRadius: 12, backgroundColor: COLORS.ink, alignItems: 'center' },
  buttonLabel: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
  secondary: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(140, 47, 18, 0.35)',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryLabel: { color: COLORS.rust, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});
