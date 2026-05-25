import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { APP_NAME, APP_TAGLINE } from '@/constants/Config';

export default function WelcomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <SignedIn>
        <Redirect href="/(tabs)/today" />
      </SignedIn>

      <SignedOut>
        <View
          style={{
            flex: 1,
            backgroundColor: t.background,
            paddingHorizontal: 28,
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('@/assets/images/android-chrome-192x192.png')}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  marginBottom: 24,
                }}
                resizeMode="contain"
                accessible
                accessibilityLabel={`${APP_NAME} logo`}
              />

              <Text
                style={{
                  color: t.text,
                  fontSize: 44,
                  fontWeight: '800',
                  letterSpacing: -1.2,
                  marginLeft: 4,
                }}
              >
                {APP_NAME}
              </Text>
            </View>
            <Text
              style={{
                marginTop: 8,
                color: t.textMuted,
                fontSize: 17,
                lineHeight: 24,
              }}
            >
              {APP_TAGLINE}.{'\n'}Never miss a callback, meeting, or follow-up.
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <Pressable onPress={() => router.push('/(auth)/continue')}>
              <View
                style={{
                  backgroundColor: t.text,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: t.primaryForeground,
                    fontWeight: '600',
                    fontSize: 16,
                  }}
                >
                  Continue
                </Text>
              </View>
            </Pressable>
            {/* <Pressable
              onPress={() => router.push('/(auth)/continue')}
              style={({ pressed }) => ({
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: t.border,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ color: t.text, fontWeight: '600', fontSize: 16 }}>
                Sign in
              </Text>
            </Pressable> */}
          </View>
        </View>
      </SignedOut>
    </>
  );
}
