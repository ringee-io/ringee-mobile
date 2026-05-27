import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function DialerStackLayout() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: 'systemChromeMaterial',
        headerLargeStyle: { backgroundColor: t.background },
        headerTintColor: t.text,
        headerTitleStyle: { color: t.text },
        headerLargeTitleStyle: { color: t.text, fontWeight: '700' },
        contentStyle: { backgroundColor: t.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Dialer' }} />
    </Stack>
  );
}
