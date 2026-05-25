import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

interface Props {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  onRightPress?: () => void;
  rightIcon?: keyof typeof Feather.glyphMap;
  onBack?: () => void;
  variant?: 'large' | 'compact';
}

export function AppHeader({
  title,
  subtitle,
  rightLabel,
  onRightPress,
  rightIcon,
  onBack,
  variant = 'large',
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const isLarge = variant === 'large';

  return (
    <View
      style={{
        paddingTop: insets.top + (isLarge ? 16 : 8),
        paddingHorizontal: 20,
        paddingBottom: isLarge ? 16 : 12,
        backgroundColor: t.background,
        borderBottomWidth: isLarge ? 0 : 1,
        borderBottomColor: t.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 32,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={{ marginRight: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Feather name="chevron-left" size={26} color={t.text} />
            </Pressable>
          ) : null}
          <Text
            numberOfLines={1}
            style={{
              fontSize: isLarge ? 28 : 17,
              fontWeight: isLarge ? '700' : '600',
              color: t.text,
              letterSpacing: -0.4,
              flex: 1,
            }}
          >
            {title}
          </Text>
        </View>

        {rightLabel || rightIcon ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={10}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 4,
              paddingVertical: 4,
            }}
            accessibilityRole="button"
          >
            {rightIcon ? (
              <Feather name={rightIcon} size={20} color={t.text} />
            ) : null}
            {rightLabel ? (
              <Text style={{ color: t.text, fontWeight: '500', fontSize: 15 }}>
                {rightLabel}
              </Text>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {subtitle ? (
        <Text
          style={{
            marginTop: isLarge ? 4 : 2,
            color: t.textMuted,
            fontSize: 14,
            fontWeight: '500',
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
