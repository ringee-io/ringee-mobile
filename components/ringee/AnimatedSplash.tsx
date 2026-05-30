import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { APP_NAME, APP_TAGLINE } from '@/constants/Config';

// ─────────────────────────────────────────────────────────────────────────
// Ringee animated splash
//
// A fixed, branded launch screen — always black/white, regardless of theme —
// that takes over the instant the OS splash is dismissed for a seamless
// handoff. The signature touch is the "sonar": concentric rings that pulse out
// of the mark like a phone ringing, a quiet nod to what Ringee is for. The
// wordmark and tagline rise in, the whole thing breathes, then it fades up and
// out to reveal the app.
// ─────────────────────────────────────────────────────────────────────────

const BRAND_BLACK = '#000000';
const ICON_SIZE = 112;
const RING_SIZE = 128;
const RING_COUNT = 3;
const RING_DURATION = 2600;

// Minimum time the splash stays on screen so the animation is felt even when
// the JS bundle is already warm. Total ≈ MIN_VISIBLE_MS + EXIT_MS.
const MIN_VISIBLE_MS = 1500;
const EXIT_MS = 480;

type Props = {
  /** Becomes true once the app shell is ready (fonts, etc.). */
  isReady: boolean;
  /** Called after the exit animation finishes; unmount the splash here. */
  onFinish: () => void;
};

/** One expanding, fading "ping". Staggered so the rings chase each other. */
function SonarRing({ index }: { index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * (RING_DURATION / RING_COUNT),
      withRepeat(
        withTiming(1, {
          duration: RING_DURATION,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 2.9]) }],
    opacity: interpolate(progress.value, [0, 0.1, 1], [0, 0.28, 0]),
  }));

  return <Animated.View pointerEvents="none" style={[styles.ring, style]} />;
}

/** A single low-key "connecting…" dot that pulses on a loop. */
function PulseDot({ index }: { index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 180,
      withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.18, 0.6]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.85, 1]) }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function AnimatedSplash({ isReady, onFinish }: Props) {
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.82);
  const breathe = useSharedValue(0);
  const wordmark = useSharedValue(0);
  const tagline = useSharedValue(0);
  const rootOpacity = useSharedValue(1);
  const rootScale = useSharedValue(1);
  const mountedAt = useRef(Date.now());

  // Take over the moment we paint our first frame — both the native splash and
  // this view are the white mark on black, so the swap is invisible.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Entrance choreography.
  useEffect(() => {
    iconOpacity.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
    iconScale.value = withSpring(1, { damping: 11, stiffness: 130, mass: 0.9 });
    breathe.value = withDelay(
      640,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    wordmark.value = withDelay(
      300,
      withTiming(1, { duration: 540, easing: Easing.out(Easing.cubic) }),
    );
    tagline.value = withDelay(
      540,
      withTiming(1, { duration: 540, easing: Easing.out(Easing.cubic) }),
    );
  }, [breathe, iconOpacity, iconScale, tagline, wordmark]);

  // Exit once the app is ready and the minimum on-screen time has elapsed.
  useEffect(() => {
    if (!isReady) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timer = setTimeout(() => {
      rootScale.value = withTiming(1.06, {
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
      });
      rootOpacity.value = withTiming(
        0,
        { duration: EXIT_MS, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onFinish)();
        },
      );
    }, wait);
    return () => clearTimeout(timer);
  }, [isReady, onFinish, rootOpacity, rootScale]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: rootOpacity.value,
    transform: [{ scale: rootScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value * (1 + breathe.value * 0.03) }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmark.value,
    transform: [{ translateY: interpolate(wordmark.value, [0, 1], [16, 0]) }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tagline.value, [0, 1], [0, 0.62]),
    transform: [{ translateY: interpolate(tagline.value, [0, 1], [10, 0]) }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
      pointerEvents="none"
    >
      <StatusBar style="light" animated />

      <View style={styles.center}>
        <View style={styles.mark}>
          {Array.from({ length: RING_COUNT }).map((_, i) => (
            <SonarRing key={i} index={i} />
          ))}

          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <Image
              source={require('@/assets/images/apple-touch-icon.png')}
              style={styles.icon}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.wordmark, wordmarkStyle]}>
          {APP_NAME}
        </Animated.Text>
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          {APP_TAGLINE}
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <PulseDot key={i} index={i} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: BRAND_BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE * 0.225,
    backgroundColor: BRAND_BLACK,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    // Soft white halo (iOS); the sonar rings carry the glow on Android.
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE * 0.225,
  },
  wordmark: {
    marginTop: 30,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
