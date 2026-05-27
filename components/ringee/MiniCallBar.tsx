import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactsApi } from '@/lib/api';
import { type ThemeColors } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { detectCountry, digitsOnly, parseNumber } from '@/lib/phone';
import { useOptionalVoice } from '@/lib/voice';
import { Feather } from '@expo/vector-icons';
import { useCallBarLayout } from './CallBarLayout';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Dock = 'top' | 'left' | 'right';

const STATE_LABEL: Record<string, string> = {
  connecting: 'Calling…',
  ringing: 'Ringing…',
  active: 'In call',
  held: 'On hold',
};

const MARGIN = 1;
// Estimated rendered height of the bar in its docked-top layout (paddingY
// 12 + content row ~46). Used to reserve safe-area space above the screen's
// navigation header so the large title lays out below the bar.
const TOP_BAR_HEIGHT = 70;
const SPRING = { damping: 20, stiffness: 220, mass: 0.7 };
// Softer spring the inner content uses to trail the container, giving the
// elastic "slosh" as the widget is flung and snapped.
const FOLLOW = { damping: 14, stiffness: 130, mass: 0.9 };
const TRAIL_LIMIT = 16; // px the inner content may lag behind the container
const morph = () => LinearTransition.springify().damping(18).stiffness(200);

/**
 * Premium floating call widget. Docks to the top (a full-width horizontal card)
 * or to either side (the same card laid out vertically, PiP-style). Drag it
 * anywhere; on release it snaps to the nearest of those three docks. The inner
 * content trails the container elastically while it moves.
 */
export function MiniCallBar() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const voice = useOptionalVoice();
  const { setTopReserve } = useCallBarLayout();

  // In dev, fall back to a mock call so the widget can be previewed without
  // placing a real call. Never shown in production builds.
  const call =
    voice?.activeCall ??
    // (__DEV__
    //   ? {
    //       state: 'active' as const,
    //       destination: '+1234567890',
    //       callerId: null,
    //       muted: false,
    //       onHold: false,
    //       recording: false,
    //       answeredAt: Date.now() - 45000,
    //     }
    //   : 
      null
    // );

  const [elapsed, setElapsed] = useState(0);
  const [contactName, setContactName] = useState<string | null>(null);
  const [dock, setDock] = useState<Dock>('top');
  const [dragging, setDragging] = useState(false);

  // Absolute top-left position + measured size of the card.
  const x = useSharedValue(MARGIN);
  const y = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const placed = useRef(false);

  const topDockY = insets.top + MARGIN;
  const minY = insets.top + MARGIN;
  const sideTopThreshold = insets.top + 120;
  const destination = call?.destination ?? '';

  // Resolve the contact name from the dialed number (best-effort).
  useEffect(() => {
    const digits = digitsOnly(destination);
    if (digits.length < 3) {
      setContactName(null);
      return;
    }
    let active = true;
    ContactsApi.searchContactsByPhone(digits, 5)
      .then((res) => {
        if (active) setContactName(res.data?.[0]?.name ?? null);
      })
      .catch(() => {
        if (active) setContactName(null);
      });
    return () => {
      active = false;
    };
  }, [destination]);

  // Live timer once answered.
  useEffect(() => {
    if (!call?.answeredAt || call.state !== 'active') {
      setElapsed(0);
      return;
    }
    const t0 = call.answeredAt;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - t0) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [call?.answeredAt, call?.state]);

  // Initial placement: docked at the top.
  useEffect(() => {
    if (!placed.current) {
      placed.current = true;
      x.value = MARGIN;
      y.value = topDockY;
    }
  }, [topDockY, x, y]);

  // Reserve safe-area space so descendant screens lay out their headers below
  // the bar — only when the bar is visible AND docked at the top.
  const visible = !!call && !pathname.includes('/dialer/active');
  const reservingTop = visible && dock === 'top';
  useEffect(() => {
    setTopReserve(reservingTop ? TOP_BAR_HEIGHT + MARGIN * 2 : 0);
    return () => setTopReserve(0);
  }, [reservingTop, setTopReserve]);

  const openCall = useCallback(() => router.push('/dialer/active' as never), [router]);

  const commitDock = useCallback(
    (next: Dock, dropY: number) => {
      setDragging(false);
      setDock(next);
      const maxY = SCREEN_H - insets.bottom - h.value - MARGIN;
      if (next === 'top') {
        x.value = withSpring(MARGIN, SPRING);
        y.value = withSpring(topDockY, SPRING);
      } else {
        const ty = Math.min(Math.max(dropY - 40, minY), Math.max(minY, maxY));
        x.value = withSpring(next === 'left' ? MARGIN : SCREEN_W - w.value - MARGIN, SPRING);
        y.value = withSpring(ty, SPRING);
      }
    },
    [insets.bottom, minY, topDockY, SCREEN_W, SCREEN_H, h, w, x, y],
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      runOnJS(setDragging)(true);
    })
    .onUpdate((e) => {
      const cw = w.value || 92;
      const ch = h.value || 280;
      const maxY = SCREEN_H - insets.bottom - ch - MARGIN;
      x.value = Math.min(Math.max(e.absoluteX - cw / 2, MARGIN), SCREEN_W - cw - MARGIN);
      y.value = Math.min(Math.max(e.absoluteY - 40, minY), Math.max(minY, maxY));
    })
    .onEnd((e) => {
      let next: Dock = 'top';
      if (e.absoluteY > sideTopThreshold) {
        next = e.absoluteX < SCREEN_W / 2 ? 'left' : 'right';
      }
      runOnJS(commitDock)(next, e.absoluteY);
    });

  // Container leads; the inner content follows on a softer spring.
  const followX = useDerivedValue(() => withSpring(x.value, FOLLOW));
  const followY = useDerivedValue(() => withSpring(y.value, FOLLOW));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  const innerStyle = useAnimatedStyle(() => {
    const clamp = (v: number) => Math.max(-TRAIL_LIMIT, Math.min(TRAIL_LIMIT, v));
    return {
      transform: [
        { translateX: clamp(followX.value - x.value) },
        { translateY: clamp(followY.value - y.value) },
      ],
    };
  });

  if (!call || pathname.includes('/dialer/active')) return null;

  const isLive = call.state === 'active' || call.state === 'held';
  const subtitle = isLive ? formatElapsed(elapsed) : STATE_LABEL[call.state] ?? call.state;

  const parsed = parseNumber(call.destination, detectCountry(call.destination));
  const number = parsed.country ? `+${parsed.country.dialCode} ${parsed.formatted}` : call.destination;
  const displayName = contactName?.trim() || 'Unknown';
  const title = contactName?.trim() || number;
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  const vertical = dragging || dock !== 'top';

  const controls = [
    {
      key: 'hold',
      icon: (call.onHold ? 'play' : 'pause') as keyof typeof Feather.glyphMap,
      label: call.onHold ? 'Resume' : 'Hold',
      active: call.onHold,
      activeColor: t.warning,
      onPress: () => voice?.toggleHold(),
      disabled: !isLive,
    },
    {
      key: 'mute',
      icon: (call.muted ? 'mic-off' : 'mic') as keyof typeof Feather.glyphMap,
      label: call.muted ? 'Unmute' : 'Mute',
      active: call.muted,
      activeColor: t.accent,
      onPress: () => voice?.toggleMute(),
      disabled: !isLive,
    },
    {
      key: 'record',
      icon: (call.recording ? 'stop-circle' : 'circle') as keyof typeof Feather.glyphMap,
      label: call.recording ? 'Stop recording' : 'Record',
      active: call.recording,
      activeColor: t.missed,
      onPress: () => voice?.toggleRecording(),
      disabled: !isLive,
    },
    {
      key: 'max',
      icon: 'maximize-2' as keyof typeof Feather.glyphMap,
      label: 'Maximize',
      active: true,
      activeColor: t.call,
      onPress: openCall,
      disabled: false,
    },
  ];

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <GestureDetector gesture={pan}>
        <Animated.View
          onLayout={(e) => {
            w.value = e.nativeEvent.layout.width;
            h.value = e.nativeEvent.layout.height;
          }}
          layout={morph()}
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              backgroundColor: t.surfaceElevated,
              borderWidth: 1,
              borderColor: t.border,
              shadowColor: '#000',
              shadowOpacity: 0.22,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
            },
            vertical
              ? { width: 96, borderRadius: 28, paddingVertical: 22, alignItems: 'center' }
              : {
                  width: SCREEN_W - MARGIN * 2,
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                },
            containerStyle,
          ]}
        >
          <Animated.View
            layout={morph()}
            style={[
              vertical
                ? { width: '100%', alignItems: 'center', gap: 26 }
                : { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 18 },
              innerStyle,
            ]}
          >
            <Identity
              t={t}
              initial={initial}
              title={title}
              subtitle={subtitle}
              vertical={vertical}
              onPress={openCall}
            />

            <Animated.View
              layout={morph()}
              style={
                vertical
                  ? { alignItems: 'center', gap: 30 }
                  : { flexDirection: 'row', alignItems: 'center', gap: 22 }
              }
            >
              {controls.map(({ key, ...c }) => (
                <ControlButton key={key} t={t} {...c} />
              ))}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function Identity({
  t,
  initial,
  title,
  subtitle,
  vertical,
  onPress,
}: {
  t: ThemeColors;
  initial: string;
  title: string;
  subtitle: string;
  vertical: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      layout={morph()}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Return to call"
      style={
        vertical
          ? { alignItems: 'center', gap: 8, paddingHorizontal: 4 }
          : { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }
      }
    >
      <View
        style={{
          width: vertical ? 50 : 40,
          height: vertical ? 50 : 40,
          borderRadius: vertical ? 25 : 20,
          backgroundColor: t.call,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: vertical ? 20 : 16, fontWeight: '700' }}>
          {initial}
        </Text>
      </View>
      <View style={vertical ? { alignItems: 'center' } : { flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            color: t.text,
            fontSize: vertical ? 12 : 14,
            fontWeight: '700',
            textAlign: vertical ? 'center' : 'left',
            maxWidth: vertical ? 84 : undefined,
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: t.textMuted,
            fontSize: vertical ? 11 : 12,
            fontWeight: '600',
            marginTop: 1,
            fontVariant: ['tabular-nums'],
          }}
        >
          {subtitle}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function ControlButton({
  t,
  icon,
  label,
  active,
  activeColor,
  onPress,
  disabled,
}: {
  t: ThemeColors;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active?: boolean;
  activeColor?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const bg = active ? (activeColor ?? t.text) : t.surface;
  const fg = active ? '#fff' : t.text;
  return (
    <AnimatedPressable
      layout={morph()}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderWidth: active ? 0 : 1,
        borderColor: t.border,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Feather name={icon} size={19} color={fg} />
    </AnimatedPressable>
  );
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}:${String(sec).padStart(2, '0')}`;
  const h = Math.floor(m / 60);
  return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
