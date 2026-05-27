import React from 'react';
import { Image, Text, View } from 'react-native';

import { APP_NAME } from '@/constants/Config';
import { useTheme } from '@/hooks/useTheme';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  email?: string;
  emailLabel?: string;
  showLogo?: boolean;
}

export default function AuthHeader({
  title,
  subtitle,
  email,
  emailLabel,
  showLogo = true,
}: AuthHeaderProps) {
  const t = useTheme();

  return (
    <View style={{ alignItems: 'center', marginBottom: 32 }}>
      {showLogo ? (
        <Image
          source={require('@/assets/images/android-chrome-192x192.png')}
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            marginBottom: 20,
          }}
          resizeMode="contain"
          accessible
          accessibilityLabel={`${APP_NAME} logo`}
        />
      ) : null}

      <Text
        style={{
          color: t.text,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.6,
          textAlign: 'center',
          marginBottom: subtitle || email ? 8 : 0,
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{
            color: t.textMuted,
            fontSize: 15,
            lineHeight: 22,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </Text>
      ) : null}

      {email ? (
        <View style={{ alignItems: 'center', marginTop: 6, gap: 2 }}>
          {emailLabel ? (
            <Text style={{ color: t.textMuted, fontSize: 13 }}>{emailLabel}</Text>
          ) : null}
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>
            {email}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
