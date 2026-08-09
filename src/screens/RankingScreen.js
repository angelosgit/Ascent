import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { elevationForMs, formatMiles, formatTotal } from '../config';
import { fetchRank, fetchTop, isConfigured } from '../leaderboard';
import { COLORS, MONO } from '../theme';

/**
 * The ranking.
 *
 * Ordered by total time climbed, which is what the client asked for. Elevation
 * is shown alongside it because it is the number the rest of the app speaks in,
 * and since it is a fixed multiple of time the two columns can never contradict
 * each other.
 */
export default function RankingScreen({ account, lifetimeMs, onClose }) {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState([]);
  const [ownRank, setOwnRank] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error | offline
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured()) {
      setState('offline');
      return;
    }
    try {
      const [top, rank] = await Promise.all([fetchTop(), fetchRank(lifetimeMs)]);
      setRows(top);
      setOwnRank(rank);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [lifetimeMs]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Whether they already appear in the fetched page decides if the standings
  // bar at the bottom is telling them something the list does not.
  const inList = rows.some((row) => row.id === account?.id);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>THE RANKING</Text>
        <Text style={styles.title}>Who has climbed longest</Text>
      </View>

      {state === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.rust} />
        </View>
      ) : null}

      {state === 'offline' ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Not connected yet</Text>
          <Text style={styles.emptyBody}>
            The ranking server has not been set up. Your climbing is still being
            recorded on this device and will appear here once it is.
          </Text>
        </View>
      ) : null}

      {state === 'error' ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>The mountain is out of reach</Text>
          <Text style={styles.emptyBody}>Check your connection and pull down to try again.</Text>
        </View>
      ) : null}

      {state === 'ready' ? (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.rust} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No one has climbed yet</Text>
              <Text style={styles.emptyBody}>Be the first onto the mountain.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Row row={item} mine={item.id === account?.id} />
          )}
        />
      ) : null}

      {state === 'ready' && !inList && account?.username ? (
        <View style={[styles.standing, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.standingRank}>#{ownRank}</Text>
          <Text style={styles.standingName} numberOfLines={1}>{account.username}</Text>
          <Text style={styles.standingTime}>{formatTotal(lifetimeMs)}</Text>
        </View>
      ) : null}

      {/* At the bottom, not as a top-left chevron. It is where a thumb already
          is, and it stays clear of the strip Expo Go reserves for its own
          floating dev button — which the client will be looking through until
          there is a real build to install. */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>Back to the Climb</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ row, mine }) {
  return (
    <View style={[styles.row, mine && styles.rowMine]}>
      <Text style={[styles.rank, mine && styles.inkText]}>{row.rank}</Text>
      <View style={styles.rowBody}>
        <Text style={[styles.name, mine && styles.inkText]} numberOfLines={1}>
          {row.username}
        </Text>
        <Text style={styles.miles}>{formatMiles(elevationForMs(row.totalMs))} MI</Text>
      </View>
      <Text style={[styles.time, mine && styles.inkText]}>{formatTotal(row.totalMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
  header: { paddingHorizontal: 28, paddingBottom: 18 },
  kicker: { color: COLORS.ember, fontSize: 11, fontWeight: '800', letterSpacing: 4 },
  title: { color: COLORS.ink, fontSize: 26, fontWeight: '700', marginTop: 8 },
  footer: { paddingHorizontal: 28, paddingTop: 12 },
  back: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
  },
  backLabel: { color: COLORS.cream, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: {
    color: COLORS.rust,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  list: { paddingHorizontal: 28, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(140, 47, 18, 0.2)',
  },
  rowMine: {
    backgroundColor: 'rgba(140, 47, 18, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderBottomColor: 'transparent',
  },
  rank: { color: COLORS.rust, fontFamily: MONO, fontSize: 16, minWidth: 34 },
  rowBody: { flex: 1, minWidth: 0 },
  name: { color: COLORS.ink, fontSize: 16, fontWeight: '600' },
  miles: { color: COLORS.rust, fontFamily: MONO, fontSize: 11, marginTop: 3 },
  time: { color: COLORS.ink, fontFamily: MONO, fontSize: 16 },
  inkText: { color: COLORS.ink },
  standing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 28,
    paddingTop: 16,
    backgroundColor: COLORS.sand,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(140, 47, 18, 0.3)',
  },
  standingRank: { color: COLORS.ink, fontFamily: MONO, fontSize: 16, minWidth: 34 },
  standingName: { color: COLORS.ink, fontSize: 16, fontWeight: '700', flex: 1 },
  standingTime: { color: COLORS.ink, fontFamily: MONO, fontSize: 16 },
});
