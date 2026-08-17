import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatMiles, formatTotal, elevationForMs } from '../config';
import { COLORS, MONO } from '../theme';

export default function ProfileScreen({ account, lifetimeMs, onClose, onSignOut, onDelete }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'Your name leaves the ranking and every hour you have climbed is erased. This cannot be undone.',
      [
        { text: 'Keep climbing', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await onDelete();
            } catch {
              Alert.alert('Could not delete', 'Check your connection and try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}>
      <View>
        <Text style={styles.kicker}>YOUR ACCOUNT</Text>

        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{initialOf(account?.username)}</Text>
        </View>

        <Row label="CLIMBER NAME" value={account?.username ?? '—'} />
        <Row label="EMAIL" value={account?.email ?? '—'} />
        <Row label="LIFETIME ELEVATION" value={`${formatMiles(elevationForMs(lifetimeMs))} MI`} />
        <Row label="TOTAL CLIMBED" value={formatTotal(lifetimeMs)} last />
      </View>

      <View>
        <Pressable onPress={onSignOut} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryLabel}>Sign out</Text>
        </Pressable>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonLabel}>Back to the Climb</Text>
        </Pressable>

        <Pressable onPress={confirmDelete} disabled={busy} hitSlop={10}>
          {busy ? (
            <ActivityIndicator size="small" color={COLORS.ember} style={styles.deleting} />
          ) : (
            <Text style={styles.delete}>Delete account</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export function initialOf(name) {
  return (name ?? '?').trim().charAt(0).toUpperCase() || '?';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  kicker: { color: COLORS.ember, fontSize: 11, fontWeight: '800', letterSpacing: 4 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  avatarLetter: { color: COLORS.cream, fontSize: 32, fontWeight: '700' },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(140, 47, 18, 0.2)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { color: COLORS.rust, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  rowValue: { color: COLORS.ink, fontFamily: MONO, fontSize: 17, marginTop: 6 },
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
  secondaryLabel: { color: COLORS.ember, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  delete: {
    color: COLORS.ember,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 18,
  },
  deleting: { marginTop: 18 },
});
