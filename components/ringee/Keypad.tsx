import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import {
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

const KEYS: { d: string; letters: string }[] = [
  { d: '1', letters: '' },
  { d: '2', letters: 'ABC' },
  { d: '3', letters: 'DEF' },
  { d: '4', letters: 'GHI' },
  { d: '5', letters: 'JKL' },
  { d: '6', letters: 'MNO' },
  { d: '7', letters: 'PQRS' },
  { d: '8', letters: 'TUV' },
  { d: '9', letters: 'WXYZ' },
  { d: '*', letters: '' },
  { d: '0', letters: '+' },
  { d: '#', letters: '' },
];

const ROWS = [KEYS.slice(0, 3), KEYS.slice(3, 6), KEYS.slice(6, 9), KEYS.slice(9, 12)];

// iOS 26+ Liquid Glass — resolved once at module load.
const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

interface Props {
  onKey: (digit: string) => void;
  onLongZero?: () => void;
  /** Horizontal padding of the parent so the grid lines up with it. */
  horizontalPadding?: number;
  /** Optional fixed key diameter (otherwise derived from the window width). */
  size?: number;
  /** Gap between rows. */
  rowGap?: number;
}

export function Keypad({
  onKey,
  onLongZero,
  horizontalPadding = 20,
  size,
  rowGap = 12,
}: Props) {
  const { width } = useWindowDimensions();
  // 3 columns, distributed with the same column gap used between rows.
  const colGap = 24;
  const computed = Math.floor((width - horizontalPadding * 2 - colGap * 2) / 3);
  const diameter = Math.min(size ?? 78, computed);

  return (
    <View style={{ alignSelf: 'center', gap: rowGap }}>
      {ROWS.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', columnGap: colGap }}>
          {row.map((k) => (
            <Key
              key={k.d}
              digit={k.d}
              letters={k.letters}
              size={diameter}
              onPress={() => onKey(k.d)}
              onLongPress={k.d === '0' && onLongZero ? onLongZero : undefined}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

interface KeyProps {
  digit: string;
  letters: string;
  size: number;
  onPress: () => void;
  onLongPress?: () => void;
}

function Key({ digit, letters, size, onPress, onLongPress }: KeyProps) {
  const t = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onPress();
  };
  const handleLong = onLongPress
    ? () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onLongPress();
      }
    : undefined;

  const content = (
    <>
      <Text style={{ color: t.text, fontSize: size * 0.4, fontWeight: '400', letterSpacing: -0.5 }}>
        {digit}
      </Text>
      {letters ? (
        <Text
          style={{
            color: t.textMuted,
            fontSize: size * 0.13,
            fontWeight: '700',
            letterSpacing: 1.6,
            marginTop: -size * 0.04,
          }}
        >
          {letters}
        </Text>
      ) : null}
    </>
  );

  const dims = { width: size, height: size, borderRadius: size / 2 };
  const center = { alignItems: 'center' as const, justifyContent: 'center' as const };

  // iOS 26 — native Liquid Glass key.
  if (LIQUID_GLASS) {
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLong}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={`Key ${digit}`}
        style={({ pressed }) => [dims, { opacity: pressed ? 0.55 : 1 }]}
      >
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={[dims, center, { overflow: 'hidden' }]}
        >
          {content}
        </GlassView>
      </Pressable>
    );
  }

  // Android — native ripple. Other platforms — opacity press.
  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLong}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`Key ${digit}`}
      android_ripple={{ color: t.border, borderless: false, radius: size / 2 }}
      style={({ pressed }) => [
        dims,
        center,
        {
          backgroundColor: t.surface,
          opacity: Platform.OS === 'android' ? 1 : pressed ? 0.55 : 1,
          overflow: 'hidden',
        },
      ]}
    >
      {content}
    </Pressable>
  );
}
