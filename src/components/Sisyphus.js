import React from 'react';
import { Image, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { CHARACTER } from '../art';

/**
 * The push cycle, rigged from the five body parts in the PSD rather than played
 * back as frames — each limb simply swings around its joint, which costs no
 * texture memory at all and shares the one shared value that drives the surge
 * and the boulder, so the whole figure stays on the same beat.
 *
 * Amplitudes are small on purpose; see the note in art.js about the limbs being
 * cut flush at the joints.
 */
export default function Sisyphus({ scale, originX, originY, push }) {
  const left = originX + CHARACTER.origin[0] * scale;
  const top = originY + CHARACTER.origin[1] * scale;

  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: CHARACTER.size[0] * scale,
        height: CHARACTER.size[1] * scale,
      }}
    >
      {CHARACTER.parts.map((part) => (
        <Limb key={part.key} part={part} scale={scale} push={push} />
      ))}
    </View>
  );
}

function Limb({ part, scale, push }) {
  const style = useAnimatedStyle(() => {
    // Each limb lags the one before it, which is what reads as effort rather
    // than a rigid puppet snapping between two poses.
    const wave = Math.sin(push.value * Math.PI * 2 + part.phase);
    return {
      transform: [{ rotate: `${interpolate(wave, [-1, 1], [-part.swing, part.swing])}deg` }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: part.offset[0] * scale,
          top: part.offset[1] * scale,
          width: part.size[0] * scale,
          height: part.size[1] * scale,
          transformOrigin: [`${part.pivot[0] * 100}%`, `${part.pivot[1] * 100}%`, 0],
        },
        style,
      ]}
    >
      <Image source={part.source} style={{ width: '100%', height: '100%' }} resizeMode="stretch" />
    </Animated.View>
  );
}
