import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DURATIONS_MIN, formatMiles, formatTotal } from '../config';
import { initialOf } from './ProfileScreen';
import { COLORS, MONO } from '../theme';

export default function SelectScreen({ lifetime, lifetimeMs, account, onBegin, onRanking, onProfile }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
      <View>
        <Text style={styles.kicker}>THE ASCENT</Text>
        <Text style={styles.title}>Hard things are worth doing.</Text>
        <Text style={styles.blurb}>
          The endless climb requires your absolute concentration.
        </Text>

      </View>

      <View>
        <Text style={styles.lifetimeLabel}>LIFETIME ELEVATION</Text>
        <Text style={styles.lifetime}>
          {formatMiles(lifetime)}
          <Text style={styles.lifetimeUnit}>  MI</Text>
        </Text>
        <Text style={styles.lifetimeTime}>{formatTotal(lifetimeMs)} CLIMBED</Text>
      </View>

      <View>
        <Text style={styles.prompt}>CHOOSE YOUR DURATION</Text>
        {DURATIONS_MIN.map((minutes) => (
          <Pressable
            key={minutes}
            onPress={() => onBegin(minutes)}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          >
            <Text style={styles.optionValue}>{minutes}</Text>
            <Text style={styles.optionUnit}>MINUTES</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={onRanking}
          style={({ pressed }) => [styles.ranking, pressed && styles.rankingPressed]}
        >
          <Text style={styles.rankingLabel}>See the Ranking</Text>
        </Pressable>

        <Pressable
          onPress={onProfile}
          accessibilityRole="button"
          accessibilityLabel="Your account"
          style={({ pressed }) => [styles.account, pressed && styles.rankingPressed]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initialOf(account?.username)}</Text>
          </View>
          <Text style={styles.accountName} numberOfLines={1}>{account?.username ?? 'Your account'}</Text>
          <Text style={styles.accountHint}>Account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  kicker: { color: COLORS.ember, fontSize: 11, fontWeight: '800', letterSpacing: 4 },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(140, 47, 18, 0.07)',
  },
  accountName: { flex: 1, color: COLORS.ink, fontFamily: MONO, fontSize: 15 },
  accountHint: { color: COLORS.ember, fontSize: 12, fontWeight: '700' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressed: { opacity: 0.7 },
  avatarLetter: { color: COLORS.cream, fontSize: 14, fontWeight: '700' },
  ranking: { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  rankingPressed: { opacity: 0.6 },
  rankingLabel: { color: COLORS.rust, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  lifetimeTime: { color: COLORS.rust, fontFamily: MONO, fontSize: 11, marginTop: 6, letterSpacing: 1 },
  title: { color: COLORS.ink, fontSize: 34, fontWeight: '700', marginTop: 12 },
  blurb: { color: COLORS.rust, fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 280 },
  lifetimeLabel: { color: COLORS.rust, fontSize: 10, letterSpacing: 2.5, fontWeight: '700' },
  lifetime: { color: COLORS.ink, fontFamily: MONO, fontSize: 34, marginTop: 4 },
  lifetimeUnit: { fontSize: 14, color: COLORS.rust },
  prompt: {
    color: COLORS.rust,
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(140, 47, 18, 0.3)',
    marginBottom: 10,
  },
  optionPressed: { backgroundColor: 'rgba(140, 47, 18, 0.08)' },
  optionValue: { color: COLORS.ink, fontFamily: MONO, fontSize: 26 },
  optionUnit: { color: COLORS.rust, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
});
