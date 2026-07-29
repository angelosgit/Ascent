import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EXIT_TOLL_PRICE, GRACE_MS, elevationForMs, formatMiles } from '../config';
import { purchaseExitToll } from '../payments';
import { COLORS, MONO } from '../theme';

/**
 * The Toll.
 *
 * Non-dismissable by design: there is no backdrop tap and the Android back
 * button is swallowed, so the only way out is one of the offered choices.
 */
export default function TollModal({
  visible,
  inGrace,
  awayMs,
  elapsedMs,
  onContinue,
  onPaid,
  onAbandon,
}) {
  const [busy, setBusy] = useState(false);
  const atRisk = elevationForMs(elapsedMs);

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await purchaseExitToll();
      if (result.ok) onPaid();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.veil}>
        <View style={styles.card}>
          <Text style={styles.kicker}>THE CLIMB WAS INTERRUPTED</Text>
          <Text style={styles.headline}>
            {inGrace ? 'The boulder is still holding.' : 'The boulder has rolled back.'}
          </Text>
          <Text style={styles.body}>
            {inGrace
              ? `You stepped away for ${(awayMs / 1000).toFixed(1)} seconds. Return now and the climb continues.`
              : `You were gone for ${formatAway(awayMs)}. The climb cannot be resumed.`}
          </Text>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>AT STAKE</Text>
            <Text style={styles.statValue}>{formatMiles(atRisk)} MI</Text>
          </View>

          {inGrace && (
            <Action primary label="Continue the Climb" onPress={onContinue} disabled={busy} />
          )}
          <Action
            label={busy ? 'Processing…' : `Pay to Exit  ·  ${EXIT_TOLL_PRICE}`}
            onPress={pay}
            disabled={busy}
            trailing={busy ? <ActivityIndicator size="small" color={COLORS.cream} /> : null}
          />
          <Action label="Abandon & Forfeit" danger onPress={onAbandon} disabled={busy} />

          <Text style={styles.footnote}>
            Forfeiting resets your lifetime elevation to zero.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function formatAway(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} seconds`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'}`;
  const h = Math.floor(m / 60);
  return `${h} hour${h === 1 ? '' : 's'}`;
}

function Action({ label, onPress, primary, danger, disabled, trailing }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        primary && styles.actionPrimary,
        danger && styles.actionDanger,
        pressed && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}
    >
      <Text
        style={[
          styles.actionLabel,
          primary && styles.actionLabelPrimary,
          danger && styles.actionLabelDanger,
        ]}
      >
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

/** The grace window, re-exported so callers do not reach into config directly. */
TollModal.GRACE_MS = GRACE_MS;

const styles = StyleSheet.create({
  veil: {
    flex: 1,
    backgroundColor: COLORS.veil,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    padding: 26,
  },
  kicker: {
    color: COLORS.ember,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  headline: {
    color: COLORS.ink,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 10,
    lineHeight: 30,
  },
  body: { color: COLORS.rust, fontSize: 14, lineHeight: 21, marginTop: 8 },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(140, 47, 18, 0.25)',
  },
  statLabel: { color: COLORS.rust, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  statValue: { color: COLORS.ink, fontFamily: MONO, fontSize: 18 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(140, 47, 18, 0.35)',
  },
  actionPrimary: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  actionDanger: { borderColor: 'transparent' },
  actionPressed: { opacity: 0.72 },
  actionDisabled: { opacity: 0.45 },
  actionLabel: { color: COLORS.rust, fontSize: 15, fontWeight: '700' },
  actionLabelPrimary: { color: COLORS.cream },
  actionLabelDanger: { color: COLORS.ember, fontWeight: '600' },
  footnote: {
    color: COLORS.rust,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    opacity: 0.8,
  },
});
