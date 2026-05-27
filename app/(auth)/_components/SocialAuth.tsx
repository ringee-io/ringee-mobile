import SignInWith from '@/components/auth/SignInWith';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Platform, Text, View } from 'react-native';

export default function SocialAuth() {
  const t = useTheme();
  const showApple = Platform.OS === 'ios';

  return (
    <>
      <View
        style={{
          marginBottom: 20,
          flexDirection: showApple ? 'row' : 'column',
          gap: 10,
          justifyContent: 'space-around',
        }}
      >
        {showApple ? (
          <SignInWith strategy="oauth_apple" variant="compact" />
        ) : null}
        <SignInWith
          strategy="oauth_google"
          variant={showApple ? 'compact' : 'button'}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
        <Text
          style={{
            marginHorizontal: 14,
            color: t.textMuted,
            fontSize: 12,
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          or
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
      </View>
    </>
  );
}
