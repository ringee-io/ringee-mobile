import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Avatar } from './Avatar';

interface Props {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  status?: React.ReactNode;
  trailing?: React.ReactNode;
  avatarName?: string | null;
  avatarFallback?: string | null;
  onPress?: () => void;
}

export function ActionRow({
  title,
  subtitle,
  meta,
  status,
  trailing,
  avatarName,
  avatarFallback,
  onPress,
}: Props) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} android_ripple={{ color: t.surface }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <Avatar name={avatarName} fallback={avatarFallback} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: t.text,
                fontSize: 16,
                fontWeight: '600',
                flex: 1,
                marginRight: 8,
              }}
            >
              {title}
            </Text>
            {meta ? (
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: 13,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {meta}
              </Text>
            ) : null}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={{ color: t.textMuted, fontSize: 14, flexShrink: 1 }}
              >
                {subtitle}
              </Text>
            ) : null}
            {status}
          </View>
        </View>
        {trailing ? <View style={{ marginLeft: 8 }}>{trailing}</View> : null}
      </View>
    </Pressable>
  );
}

export function RowSeparator() {
  const t = useTheme();
  return (
    <View
      style={{
        marginLeft: 72,
        height: 1,
        backgroundColor: t.border,
      }}
    />
  );
}
