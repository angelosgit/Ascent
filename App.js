import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TollModal from './src/components/TollModal';
import ClimbScreen from './src/screens/ClimbScreen';
import AuthScreen from './src/screens/AuthScreen';
import ClaimNameScreen from './src/screens/ClaimNameScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RankingScreen from './src/screens/RankingScreen';
import SelectScreen from './src/screens/SelectScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import { AUTH, useAuth } from './src/auth/useAuth';
import { COLORS } from './src/theme';
import { PHASE, useSession } from './src/useSession';

export default function App() {
  const { status, user, ready, needsName, requestCode, verifyCode, claimName, signOut, deleteAccount } =
    useAuth();
  const session = useSession(user);

  const {
    phase,
    lifetime,
    lifetimeMs,
    durationMs,
    awayMs,
    inGrace,
    readElapsed,
    begin,
    continueClimb,
    payAndExit,
    abandon,
    complete,
    dismissSummary,
    openRanking,
    openProfile,
    closeDetour,
  } = session;

  const onComplete = useCallback(() => complete(), [complete]);
  const onClaimName = useCallback((name) => claimName(name, lifetimeMs), [claimName, lifetimeMs]);

  return (
    <SafeAreaProvider>
      <View style={styles.page}>
      <View style={styles.root}>
        <StatusBar style="dark" />

        {(status === AUTH.LOADING || !ready) && (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.rust} />
          </View>
        )}

        {ready && status === AUTH.SIGNED_OUT && (
          <AuthScreen onRequestCode={requestCode} onVerifyCode={verifyCode} />
        )}

        {ready && status === AUTH.SIGNED_IN && needsName && (
          <ClaimNameScreen onSubmit={onClaimName} />
        )}

        {ready && status === AUTH.SIGNED_IN && !needsName && (
          <>
            {phase === PHASE.SELECT && (
              <SelectScreen
                lifetime={lifetime}
                lifetimeMs={lifetimeMs}
                account={user}
                onBegin={begin}
                onRanking={openRanking}
                onProfile={openProfile}
              />
            )}

            {phase === PHASE.RANKING && (
              <RankingScreen account={user} lifetimeMs={lifetimeMs} onClose={closeDetour} />
            )}

            {phase === PHASE.PROFILE && (
              <ProfileScreen
                account={user}
                lifetimeMs={lifetimeMs}
                onClose={closeDetour}
                onSignOut={signOut}
                onDelete={deleteAccount}
              />
            )}

            {phase === PHASE.DONE && (
              <SummaryScreen lifetime={lifetime} onDone={dismissSummary} onRanking={openRanking} />
            )}

            {(phase === PHASE.CLIMB || phase === PHASE.TOLL) && (
              <ClimbScreen
                running={phase === PHASE.CLIMB}
                lifetime={lifetime}
                durationMs={durationMs}
                readElapsed={readElapsed}
                onComplete={onComplete}
              />
            )}

            <TollModal
              visible={phase === PHASE.TOLL}
              inGrace={inGrace}
              awayMs={awayMs}
              elapsedMs={readElapsed()}
              onContinue={continueClimb}
              onPaid={payAndExit}
              onAbandon={abandon}
            />
          </>
        )}
      </View>
      </View>
    </SafeAreaProvider>
  );
}

/**
 * On the web the app is still a phone screen, so it is drawn inside a phone
 * shaped frame rather than stretched across a desktop window.
 */
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? COLORS.ink : COLORS.cream,
    alignItems: 'center',
    ...Platform.select({ web: { padding: 20 }, default: {} }),
  },
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.cream,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        maxWidth: 390,
        borderRadius: 40,
        borderWidth: 8,
        borderColor: '#0E0703',
      },
      default: {},
    }),
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
