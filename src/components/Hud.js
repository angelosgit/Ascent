import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HUD_HZ, elevationForMs, formatClock, formatMiles } from '../config';
import { COLORS, MONO } from '../theme';

/**
 * The readout.
 *
 * This is the only component in the climb that re-renders, and it does so ten
 * times a second rather than sixty — the fifth decimal of a mile takes about
 * twelve seconds to turn over, so there is nothing to see at frame rate and
 * plenty of battery to lose.
 */
export default function Hud({ lifetime, durationMs, readElapsed, onComplete }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const ms = readElapsed();
      setElapsed(ms);
      // No local "already fired" latch here: one would survive a Toll pause and
      // leave a climb that was interrupted at 99% unable to ever finish.
      // complete() guards on the session phase instead, so repeat calls are
      // free and correctness lives in one place.
      if (ms >= durationMs) onComplete();
    }, 1000 / HUD_HZ);
    return () => clearInterval(id);
  }, [durationMs, readElapsed, onComplete]);

  const gained = elevationForMs(elapsed);

  return (
    <View style={styles.root} pointerEvents="none">
      <Text style={styles.label}>ELEVATION</Text>
      <Text style={styles.miles}>
        {formatMiles(lifetime + gained)}
        <Text style={styles.unit}>  MI</Text>
      </Text>
      <View style={styles.row}>
        <Text style={styles.meta}>+{formatMiles(gained)} THIS CLIMB</Text>
        <Text style={styles.clock}>{formatClock(durationMs - elapsed)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 26, paddingTop: 8 },
  label: {
    color: COLORS.rust,
    fontSize: 11,
    letterSpacing: 3.5,
    fontWeight: '700',
  },
  miles: {
    color: COLORS.ink,
    fontFamily: MONO,
    fontSize: 40,
    letterSpacing: -1,
    marginTop: 2,
  },
  unit: { fontSize: 16, color: COLORS.rust },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  meta: { color: COLORS.rust, fontFamily: MONO, fontSize: 12, letterSpacing: 0.5 },
  clock: { color: COLORS.ink, fontFamily: MONO, fontSize: 20, letterSpacing: 1 },
});
