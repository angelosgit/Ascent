import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EXIT_TOLL_PRICE, GRACE_MS, elevationForMs, formatMiles } from '../config';
import { PURCHASE, fetchTollPrice, purchaseExitToll } from '../payments';
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
  const [price, setPrice] = useState(null);
  const [error, setError] = useState(null);
  const atRisk = elevationForMs(elapsedMs);

  // Apple rejects a hard-coded price: it must come from the store so every
  // region sees its own currency. The constant is only a fallback.
  useEffect(() => {
    if (!visible) return;
    let active = true;
    fetchTollPrice().then((value) => {
      if (active && value) setPrice(value);
    });
    return () => {
      active = false;
    };
  }, [visible]);

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await purchaseExitToll();
      if (result.status === PURCHASE.OK) onPaid();
      else if (result.status === PURCHASE.UNAVAILABLE) setError('Purchases are unavailable in this build.');
      else if (result.status === PURCHASE.FAILED) setError('The payment did not go through.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay visible={visible}>
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
            label={busy ? 'Processing…' : `Pay to Exit  ·  ${price ?? EXIT_TOLL_PRICE}`}
            onPress={pay}
            disabled={busy}
            trailing={busy ? <ActivityIndicator size="small" color={COLORS.cream} /> : null}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Action label="Abandon & Forfeit" danger onPress={onAbandon} disabled={busy} />

          <Text style={styles.footnote}>
            Forfeiting resets your lifetime elevation to zero.
          </Text>
        </View>
      </View>
    </Overlay>
  );
}

/**
 * React Native's Modal portals to the document body on web, which puts it
 * outside the phone frame the app is drawn inside. In the browser this is an
 * ordinary absolutely positioned layer instead, so it stays within the frame.
 */
function Overlay({ visible, children }) {
  if (Platform.OS === 'web') {
    return visible ? <View style={styles.webOverlay}>{children}</View> : null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      {children}
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
  webOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
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
  error: {
    color: COLORS.ember,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  footnote: {
    color: COLORS.rust,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    opacity: 0.8,
  },
});
