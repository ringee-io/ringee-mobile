import React from 'react'
import { Image, Text, View } from 'react-native'

import { APP_NAME } from '@/constants/Config'

interface AuthHeaderProps {
  title: string
  subtitle?: string
  email?: string
  emailLabel?: string
}

export default function AuthHeader({ title, subtitle, email, emailLabel }: AuthHeaderProps) {
  return (
    <View className="mb-8 items-center">
      <Image
        source={require('@/assets/images/android-chrome-192x192.png')}
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          marginBottom: 16,
        }}
        resizeMode="contain"
        accessible
        accessibilityLabel={`${APP_NAME} logo`}
      />
      <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-center mb-2 text-gray-600">
          {subtitle}
        </Text>
      )}
      {email && (
        <>
          {emailLabel && (
            <Text className="text-center mb-2 text-gray-600">
              {emailLabel}
            </Text>
          )}
          <Text className="text-center text-black font-medium">
            {email}
          </Text>
        </>
      )}
    </View>
  )
}