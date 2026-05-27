import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function CallsStackLayout() {
  const t = useTheme();
  const isIOS = Platform.OS === 'ios';

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTransparent: isIOS,
        headerBlurEffect: 'systemChromeMaterial',
        headerStyle: { backgroundColor: t.background },
        headerTintColor: t.text,
        headerTitleStyle: { color: t.text },
        headerLargeTitleStyle: { color: t.text, fontWeight: '700' },
        contentStyle: { backgroundColor: t.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Calls' }} />

      <Stack.Screen
        name="keypad"
        options={{
          title: '',
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.85, 1.0],
          sheetCornerRadius: 24,
          headerShown: false,
          contentStyle: { backgroundColor: t.background },
        }}
      />

      <Stack.Screen
        name="schedule"
        options={{
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.9, 1.0],
          sheetCornerRadius: 24,
          headerStyle: { backgroundColor: t.background },
          headerShadowVisible: false,
          headerLargeTitle: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: t.background },
        }}
      />
    </Stack>
  );
}
