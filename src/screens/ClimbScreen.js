import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Hud from '../components/Hud';
import Scene from '../components/Scene';
import VideoAnimationScene from '../components/VideoAnimationScene';


export default function ClimbScreen({ running, lifetime, durationMs, readElapsed, onComplete }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Keeping the old code as it is, so we can compares the old & current snapshots any time we want. */}
      {/* <Scene running={running} /> */}
      <VideoAnimationScene running={running} />
      <View style={[styles.hud, { paddingTop: insets.top + 10 }]}>
        <Hud
          lifetime={lifetime}
          durationMs={durationMs}
          readElapsed={readElapsed}
          onComplete={onComplete}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6A84B' },
  hud: { position: 'absolute', top: 0, left: 0, right: 0 },
});
