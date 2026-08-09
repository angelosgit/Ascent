import React, { useState } from 'react';
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
import { USERNAME_MAX } from '../config';
import { NAME, useNameAvailability } from '../hooks/useNameAvailability';
import { normaliseUsername, validateUsername } from '../validation';
import { COLORS, MONO } from '../theme';

/** Shown once, after verifying, only while the account has no name yet. */
export default function ClaimNameScreen({ onSubmit }) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const availability = useNameAvailability(value);
  const blocked = availability.status === NAME.TAKEN || availability.status === NAME.INVALID;

  const submit = async () => {
    if (busy) return;

    const name = normaliseUsername(value);
    const invalid = validateUsername(name);
    if (invalid) {
      setError(invalid);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await onSubmit(name);
      if (!result.ok) {
        setError(
          result.taken
            ? 'That name is already climbing. Try another.'
            : 'Could not reach the mountain. Check your connection.',
        );
      }
    } catch {
      setError('Could not reach the mountain. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.inner, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32 }]}>
        <View>
          <Text style={styles.kicker}>THE ASCENT</Text>
          <Text style={styles.title}>What shall we call you?</Text>
          <Text style={styles.blurb}>
            This is the name on the ranking, beside the hours you have climbed.
          </Text>
        </View>

        <View>
          <TextInput
            value={value}
            onChangeText={(next) => {
              setValue(next);
              if (error) setError(null);
            }}
            placeholder="Sisyphus"
            placeholderTextColor="rgba(140, 47, 18, 0.35)"
            style={[styles.input, blocked && styles.inputBlocked, availability.status === NAME.AVAILABLE && styles.inputFree]}
            maxLength={USERNAME_MAX}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
            editable={!busy}
          />
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Availability {...availability} />
          )}
        </View>

        <Pressable
          onPress={submit}
          disabled={busy || blocked}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
            (busy || blocked) && styles.disabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={COLORS.cream} />
          ) : (
            <Text style={styles.buttonLabel}>Begin the climb</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const TONES = {
  [NAME.CHECKING]: { color: COLORS.rust, mark: '' },
  [NAME.AVAILABLE]: { color: COLORS.moss, mark: '✓  ' },
  [NAME.TAKEN]: { color: COLORS.ember, mark: '✕  ' },
  [NAME.INVALID]: { color: COLORS.ember, mark: '' },
  [NAME.UNKNOWN]: { color: COLORS.rust, mark: '' },
};

function Availability({ status, message }) {
  const tone = TONES[status];
  if (!tone || !message) return <View style={styles.statusSpacer} />;

  return (
    <View style={styles.status}>
      {status === NAME.CHECKING ? (
        <ActivityIndicator size="small" color={COLORS.rust} style={styles.spinner} />
      ) : null}
      <Text style={[styles.statusText, { color: tone.color }]} numberOfLines={1}>
        {tone.mark}
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  kicker: { color: COLORS.ember, fontSize: 11, fontWeight: '800', letterSpacing: 4 },
  title: { color: COLORS.ink, fontSize: 34, fontWeight: '700', marginTop: 12 },
  blurb: { color: COLORS.rust, fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 300 },
  input: {
    color: COLORS.ink,
    fontFamily: MONO,
    fontSize: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(140, 47, 18, 0.3)',
  },
  error: { color: COLORS.ember, fontSize: 13, marginTop: 12, fontWeight: '600', minHeight: 20 },
  status: { flexDirection: 'row', alignItems: 'center', marginTop: 12, minHeight: 20 },
  statusSpacer: { marginTop: 12, minHeight: 20 },
  statusText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  spinner: { marginRight: 8, transform: [{ scale: 0.8 }] },
  inputBlocked: { borderColor: 'rgba(217, 72, 27, 0.6)' },
  inputFree: { borderColor: 'rgba(92, 122, 70, 0.7)' },
  button: { paddingVertical: 16, borderRadius: 12, backgroundColor: COLORS.ink, alignItems: 'center' },
  buttonLabel: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});
