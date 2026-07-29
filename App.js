import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TollModal from './src/components/TollModal';
import ClimbScreen from './src/screens/ClimbScreen';
import SelectScreen from './src/screens/SelectScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import { COLORS } from './src/theme';
import { PHASE, useSession } from './src/useSession';

export default function App() {
  const session = useSession();
  const {
    phase,
    lifetime,
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
  } = session;

  const onComplete = useCallback(() => complete(), [complete]);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />

        {phase === PHASE.SELECT && <SelectScreen lifetime={lifetime} onBegin={begin} />}

        {phase === PHASE.DONE && (
          <SummaryScreen lifetime={lifetime} onDone={dismissSummary} />
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cream },
});
