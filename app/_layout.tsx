import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import '../global.css';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  AnimatedSplash,
  CallBarLayoutProvider,
  CallBarTopInset,
  MiniCallBar,
} from '@/components/ringee';
import { AuthBridge } from '@/lib/auth/AuthBridge';
import { CreditProvider } from '@/lib/credit/CreditProvider';
import { TelnyxVoiceProvider } from '@/lib/voice';

// Keep the native splash up until our animated one is mounted and ready to take
// over — AnimatedSplash calls hideAsync() on its first frame for a seamless cut.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Native header — iOS shows the Liquid Glass material via headerTransparent
// + headerBlurEffect; Android falls back to an opaque header. Per-screen
// headerRight (the kebab menu) is set inside each screen via Stack.Screen.
function detailScreenOptions(title: string) {
  return {
    presentation: 'card' as const,
    animation: 'slide_from_right' as const,
    headerShown: true,
    headerBackTitle: 'Back',
    title,
    headerTransparent: Platform.OS === 'ios',
    headerBlurEffect:
      Platform.OS === 'ios' ? ('systemChromeMaterial' as const) : undefined,
  };
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [splashDone, setSplashDone] = useState(false);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Native splash stays up (auto-hide is prevented) until fonts are ready.
    return null;
  }

  const navTheme =
    colorScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: palette.background,
            card: palette.background,
            text: palette.text,
            border: palette.border,
            primary: palette.text,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: palette.background,
            card: palette.background,
            text: palette.text,
            border: palette.border,
            primary: palette.text,
          },
        };

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider value={navTheme}>
            <AuthBridge />
            <TelnyxVoiceProvider>
              <CreditProvider>
              <CallBarLayoutProvider>
                <CallBarTopInset>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      headerStyle: { backgroundColor: palette.background },
                      headerTintColor: palette.text,
                      headerTitleStyle: { color: palette.text },
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="contact/[id]"
                      options={detailScreenOptions('Contact')}
                    />
                    <Stack.Screen
                      name="call/[id]"
                      options={detailScreenOptions('Call')}
                    />
                    <Stack.Screen
                      name="callback/[id]"
                      options={detailScreenOptions('Callback')}
                    />
                    <Stack.Screen
                      name="meeting/[id]"
                      options={detailScreenOptions('Meeting')}
                    />
                    <Stack.Screen
                      name="active-call"
                      options={{
                        presentation: 'fullScreenModal',
                        headerShown: false,
                        animation: 'slide_from_bottom',
                        gestureEnabled: false,
                      }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </CallBarTopInset>
                <MiniCallBar />
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              </CallBarLayoutProvider>
              </CreditProvider>
            </TelnyxVoiceProvider>
          </ThemeProvider>
        </SafeAreaProvider>

        {!splashDone && (
          <AnimatedSplash isReady={loaded} onFinish={() => setSplashDone(true)} />
        )}
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
