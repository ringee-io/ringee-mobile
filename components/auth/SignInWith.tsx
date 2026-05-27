import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native'

import { useTheme } from '@/hooks/useTheme'
import { isClerkAPIResponseError, useSSO } from '@clerk/clerk-expo'
import { FontAwesome } from '@expo/vector-icons'
import * as AuthSession from 'expo-auth-session'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

type SignInWithProps = {
  strategy: 'oauth_google' | 'oauth_apple'
  variant?: 'icon' | 'button' | 'compact'
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

const strategyIcons = {
  oauth_google: 'google' as const,
  oauth_apple: 'apple' as const,
}

const strategyLabels = {
  oauth_google: 'Google',
  oauth_apple: 'Apple',
}

export default function SignInWith({ strategy, variant = 'icon' }: SignInWithProps) {
  useWarmUpBrowser()
  const t = useTheme()
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

  const label = strategyLabels[strategy]
  const iconName = strategyIcons[strategy]

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={`Continue with ${label}`}
        // style={({ pressed }) => ({
          // flex: 1,
          // height: 52,
          // flexDirection: 'row',
          // alignItems: 'center',
          // justifyContent: 'center',
          // gap: 8,
          // borderRadius: 14,
          // borderCurve: 'continuous',
          // borderWidth: 1,
          // borderColor: t.border,
          // backgroundColor: t.surface,
          // opacity: isLoading ? 0.6 : pressed ? 0.85 : 1,
        // })}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={t.text} />
        ) : (
          <FontAwesome name={iconName} size={18} color={t.text} style={{ marginLeft: 15 }} />
        )}
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>
          {label}
        </Text>
      </Pressable>
    )
  }

  if (variant === 'button') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={`Continue with ${label}`}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 52,
          paddingHorizontal: 16,
          borderRadius: 14,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.surface,
          opacity: isLoading ? 0.6 : pressed ? 0.85 : 1,
        })}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={t.text} style={{ marginRight: 10 }} />
        ) : (
          <FontAwesome
            name={iconName}
            size={18}
            color={t.text}
            style={{ marginRight: 10 }}
          />
        )}
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>
          {isLoading ? 'Signing in…' : `Continue with ${label}`}
        </Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={`Sign in with ${label}`}
      style={({ pressed }) => ({
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.surface,
        opacity: isLoading ? 0.6 : pressed ? 0.85 : 1,
      })}
    >
      <FontAwesome name={iconName} size={28} color={t.text} />
    </Pressable>
  )
}
