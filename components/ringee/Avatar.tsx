import { Text, View } from 'react-native';

import { initialsFor } from '@/lib/format';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  name?: string | null;
  fallback?: string | null;
  size?: number;
}

export function Avatar({ name, fallback, size = 40 }: Props) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: t.text,
          fontSize: Math.round(size * 0.38),
          fontWeight: '600',
          letterSpacing: 0.2,
        }}
      >
        {initialsFor(name, fallback)}
      </Text>
    </View>
  );
}
