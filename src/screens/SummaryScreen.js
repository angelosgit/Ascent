import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatMiles } from '../config';
import { COLORS, MONO } from '../theme';

export default function SummaryScreen({ lifetime, onDone }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.center}>
        <Text style={styles.kicker}>ELEVATION SECURED</Text>
        <Text style={styles.value}>
          {formatMiles(lifetime)}
          <Text style={styles.unit}>  MI</Text>
        </Text>
        <Text style={styles.blurb}>
          One must imagine Sisyphus happy.
        </Text>
      </View>
      <Pressable onPress={onDone} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonLabel}>Return</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream, paddingHorizontal: 28 },
  center: { flex: 1, justifyContent: 'center' },
  kicker: { color: COLORS.ember, fontSize: 11, fontWeight: '800', letterSpacing: 4 },
  value: { color: COLORS.ink, fontFamily: MONO, fontSize: 44, marginTop: 10 },
  unit: { fontSize: 16, color: COLORS.rust },
  blurb: { color: COLORS.rust, fontSize: 15, marginTop: 14, fontStyle: 'italic' },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
  },
  pressed: { opacity: 0.75 },
  buttonLabel: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
});
