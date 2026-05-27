import React from 'react';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { WEB_URL_PRIVACY, WEB_URL_TERMS } from '@/constants/Config';
import { useTheme } from '@/hooks/useTheme';

async function openInBrowser(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      controlsColor: '#3B82F6',
    });
  } catch {
    // swallow
  }
}

export default function AuthLegal() {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          color: t.textMuted,
          fontSize: 12,
          lineHeight: 18,
          textAlign: 'center',
        }}
      >
        By continuing, you agree to our{' '}
        <Text
          onPress={() => openInBrowser(WEB_URL_TERMS)}
          style={{
            color: t.text,
            textDecorationLine: 'underline',
            fontWeight: '500',
          }}
        >
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text
          onPress={() => openInBrowser(WEB_URL_PRIVACY)}
          style={{
            color: t.text,
            textDecorationLine: 'underline',
            fontWeight: '500',
          }}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}
