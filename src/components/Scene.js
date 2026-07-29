import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BOULDER, DOC_H, DOC_W, RIDGE_SLOPE, SKY, SLOPE } from '../art';
import { PUSH_PERIOD_MS } from '../config';
import Sisyphus from './Sisyphus';

/** One sweep of the sky's drift. It is far away, so it crawls. */
const SKY_PERIOD_MS = 150000;
/** How far the boulder and climber surge up-slope on each heave, in points. */
const SURGE = 9;

/**
 * The climb.
 *
 * Everything is animated with Reanimated shared values, so the whole scene runs
 * on the UI thread — React renders this component once and is then completely
 * uninvolved. A sixty minute session costs no JavaScript at all.
 *
 * On the slope standing still
 * ---------------------------
 * The brief asks for an endless runner, and the slope ought to stream past. It
 * does not, yet, and that is deliberate rather than unfinished.
 *
 * The supplied artwork is a single portrait poster. Its rock is a wedge — solid
 * below the ridge, empty above it — with no repeat and no tileable edges. Every
 * way of scrolling it that I tried tore a visible hole in the composition: the
 * ridge is a straight 45 degree line, so sliding a second copy along that line
 * keeps the silhouette continuous, but each copy still runs out of rock at its
 * own bottom edge and the sky shows through the gap. Padding the wedge, adding
 * more copies and mirroring it all traded one artifact for another.
 *
 * A demo with a hole in the mountain says less about the direction of this app
 * than a demo without one, so the slope holds the composition the artist drew,
 * and the motion is carried by the sky's parallax drift and by the boulder and
 * climber surging up-slope on every heave. Swap in the seamless, separated
 * layers and this becomes a dozen lines of diagonal scroll — the maths is
 * already here in RIDGE_SLOPE. See OPEN-QUESTIONS.md.
 */
export default function Scene({ running }) {
  const { width, height } = useWindowDimensions();

  // Scale the PSD's coordinate space to cover the screen, so every layer keeps
  // the position the artist drew it in.
  const s = Math.max(width / DOC_W, height / DOC_H);
  const originX = (width - DOC_W * s) / 2;
  const originY = (height - DOC_H * s) / 2;

  // How far the sky can slide before its own edge would come into view. It is a
  // one-off drawing of the Acropolis, so it can never wrap or mirror — that
  // would put a second Parthenon on screen — but it can drift within its slack.
  const skyDrift = Math.max(0, (DOC_W * s - width) / 2) * 0.8;

  const push = useSharedValue(0);
  const skyT = useSharedValue(0);

  useEffect(() => {
    if (!running) {
      cancelAnimation(push);
      cancelAnimation(skyT);
      return;
    }
    push.value = withRepeat(
      withTiming(1, { duration: PUSH_PERIOD_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    skyT.value = withRepeat(
      withTiming(1, { duration: SKY_PERIOD_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(push);
      cancelAnimation(skyT);
    };
  }, [running, push, skyT]);

  const skyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (skyT.value * 2 - 1) * skyDrift }],
  }));

  // He climbs up and to the right, so the surge runs along the ridge's own
  // gradient — RIDGE_SLOPE is negative, which carries him upward.
  const surgeStyle = useAnimatedStyle(() => {
    const d = (push.value - 0.5) * 2; // -1 .. 1
    return {
      transform: [
        { translateX: d * SURGE },
        { translateY: d * SURGE * RIDGE_SLOPE },
      ],
    };
  });

  // The boulder rocks back against the shoulder rather than spinning freely —
  // it is being held as much as rolled.
  const boulderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(push.value - 0.5) * -3}deg` }],
  }));

  const place = useMemo(
    () => (layer) => ({
      position: 'absolute',
      left: originX + layer.offset[0] * s,
      top: originY + layer.offset[1] * s,
      width: layer.size[0] * s,
      height: layer.size[1] * s,
    }),
    [originX, originY, s],
  );

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, skyStyle]}>
        <Image source={SKY.source} style={place(SKY)} resizeMode="stretch" />
      </Animated.View>

      <Image source={SLOPE.source} style={place(SLOPE)} resizeMode="stretch" />

      <Animated.View style={[StyleSheet.absoluteFill, surgeStyle]}>
        <Animated.Image
          source={BOULDER.source}
          style={[place(BOULDER), boulderStyle]}
          resizeMode="stretch"
        />
        <Sisyphus scale={s} originX={originX} originY={originY} push={push} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F6A84B', overflow: 'hidden' },
});
