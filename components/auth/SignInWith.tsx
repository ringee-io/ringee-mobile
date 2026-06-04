import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native'

import { useColorScheme } from '@/hooks/useColorScheme'
import { isClerkAPIResponseError, useSSO } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as AuthSession from 'expo-auth-session'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

type SignInWithProps = {
  strategy: 'oauth_google' | 'oauth_apple'
}

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS === 'web') return
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

const strategyLabels = {
  oauth_google: 'Google',
  oauth_apple: 'Apple',
}

const BUTTON_HEIGHT = 52
const BUTTON_RADIUS = 16

export default function SignInWith({ strategy }: SignInWithProps) {
  useWarmUpBrowser()
  const scheme = useColorScheme() ?? 'light'
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const { startSSOFlow } = useSSO()

  const onPress = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'ringee',
        path: 'sso-callback',
      })

      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy,
        redirectUrl,
      })

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        router.replace('/(tabs)/today' as any)
        return
      }

      if (signIn || signUp) {
        Alert.alert(
          'Additional steps required',
          'Please complete the additional security steps to continue.',
          [{ text: 'OK' }],
        )
      }
    } catch (err) {
      let errorMessage = 'Something went wrong. Please try again.'

      if (isClerkAPIResponseError(err)) {
        const firstError = err.errors[0]
        if (firstError) {
          errorMessage = firstError.longMessage || firstError.message
        }
      } else if (err instanceof Error) {
        const msg = err.message.toLowerCase()
        if (
          msg.includes('cancelled') ||
          msg.includes('canceled') ||
          msg.includes('dismissed') ||
          msg.includes('user_cancelled')
        ) {
          setIsLoading(false)
          return
        }
        errorMessage = err.message
      }

      Alert.alert(`${strategyLabels[strategy]} sign in failed`, errorMessage, [
        { text: 'Try again' },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [strategy, startSSOFlow, isLoading, router])

  // Sign in with Apple must use Apple's system-provided button so it matches the
  // official "Sign in with Apple" design (App Review Guideline 4 / HIG). We keep
  // the existing Clerk web SSO flow on press. Light theme → black button, dark
  // theme → white button, for proper contrast.
  if (strategy === 'oauth_apple') {
    return (
      <View style={{ height: BUTTON_HEIGHT, opacity: isLoading ? 0.6 : 1 }}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={BUTTON_RADIUS}
          style={{ width: '100%', height: '100%' }}
          onPress={onPress}
        />
      </View>
    )
  }

  // Google button follows Google's branding (light/dark surface, colored mark,
  // "Continue with Google" label) and reads unmistakably as a button.
  // Google's "outline" light/dark surfaces. The #747775 / #8E918F strokes are
  // Google's spec border colors — visible against both white and dark pages so
  // the control unmistakably reads as a button (App Review Guideline 4).
  const isDark = scheme === 'dark'
  const bg = isDark ? '#131314' : '#FFFFFF'
  const borderColor = isDark ? '#8E918F' : '#747775'
  const fg = isDark ? '#E3E3E3' : '#1F1F1F'

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: BUTTON_HEIGHT,
        paddingHorizontal: 16,
        gap: 12,
        borderRadius: BUTTON_RADIUS,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor,
        backgroundColor: bg,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0 : 0.06,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: isDark ? 0 : 1,
        opacity: 1,
      }}

    >
      {isLoading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <FontAwesome name="google" size={18} color="#4285F4" />
      )}
      <Text style={{ color: fg, fontSize: 16, fontWeight: '600', letterSpacing: 0.1 }}>
        Continue with Google
      </Text>
    </Pressable>
  )
}
