import { View, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface SummaryItem {
  label: string;
  value: number | string;
  tint?: string;
}

export function SummaryCard({ items }: { items: SummaryItem[] }) {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 8,
        backgroundColor: t.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.border,
        padding: 14,
        flexDirection: 'row',
      }}
    >
      {items.map((it, i) => (
        <View
          key={it.label}
          style={{
            flex: 1,
            alignItems: 'center',
            borderLeftWidth: i === 0 ? 0 : 1,
            borderLeftColor: t.border,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: it.tint ?? t.text,
              letterSpacing: -0.5,
            }}
          >
            {it.value}
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontSize: 12,
              fontWeight: '500',
              color: t.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
