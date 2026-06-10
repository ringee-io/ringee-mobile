import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

interface AuthBackButtonProps {
  onPress: () => void;
  label?: string;
}

export default function AuthBackButton({ onPress, label = 'Back' }: AuthBackButtonProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-start',
        marginBottom: 24,
        opacity: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Feather name="chevron-left" size={20} color={t.text} />
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '500' }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
