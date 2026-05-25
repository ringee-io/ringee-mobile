import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Pull to refresh or try again.',
  onRetry,
}: Props) {
  const t = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 56,
        paddingHorizontal: 28,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          backgroundColor: 'rgba(239,68,68,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Feather name="alert-triangle" size={22} color={t.missed} />
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
      <Text
        style={{
          marginTop: 4,
          color: t.textMuted,
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={{ marginTop: 16 }}>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: t.text,
            }}
          >
            <Text
              style={{
                color: t.primaryForeground,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              Try again
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
