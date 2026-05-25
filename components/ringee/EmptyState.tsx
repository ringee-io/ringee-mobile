import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  compact?: boolean;
}

export function EmptyState({ icon = 'check-circle', title, message, compact }: Props) {
  const t = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: compact ? 24 : 56,
        paddingHorizontal: 28,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          backgroundColor: t.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Feather name={icon} size={22} color={t.iconMuted} />
      </View>
      <Text
        style={{
          color: t.text,
          fontSize: 16,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            marginTop: 4,
            color: t.textMuted,
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
