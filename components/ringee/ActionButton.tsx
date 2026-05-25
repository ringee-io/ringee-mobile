import { Pressable, Text, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface Props {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  variant?: Variant;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ActionButton({
  label,
  icon,
  variant = 'secondary',
  onPress,
  disabled,
  style,
}: Props) {
  const t = useTheme();

  const palette =
    variant === 'primary'
      ? { bg: t.text, fg: t.primaryForeground, borderColor: t.text }
      : variant === 'destructive'
        ? { bg: 'transparent', fg: t.missed, borderColor: 'transparent' }
        : variant === 'ghost'
          ? { bg: 'transparent', fg: t.text, borderColor: 'transparent' }
          : { bg: t.surface, fg: t.text, borderColor: t.borderStrong };

  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: palette.bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: palette.borderColor,
          opacity: disabled ? 0.5 : 1,
          ...style,
        }}
      >
        {icon ? <Feather name={icon} size={16} color={palette.fg} /> : null}
        <Text style={{ color: palette.fg, fontWeight: '600', fontSize: 15 }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
