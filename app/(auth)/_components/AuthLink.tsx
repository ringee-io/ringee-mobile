import React from 'react';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface AuthLinkProps {
  onPress: () => void;
  text: string;
  align?: 'left' | 'center' | 'right';
}

export default function AuthLink({ onPress, text, align = 'center' }: AuthLinkProps) {
  const t = useTheme();
  const alignSelf =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        alignSelf,
        paddingVertical: 6,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>{text}</Text>
    </Pressable>
  );
}
