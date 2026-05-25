import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.background,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: t.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {title}
      </Text>
      {typeof count === 'number' && count > 0 ? (
        <Text
          style={{
            marginLeft: 6,
            fontSize: 12,
            color: t.textMuted,
            fontWeight: '500',
          }}
        >
          · {count}
        </Text>
      ) : null}
    </View>
  );
}
