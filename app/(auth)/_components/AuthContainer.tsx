import React, { memo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

interface AuthContainerProps {
  children: React.ReactNode;
}

const AuthContainer = memo(({ children }: AuthContainerProps) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

AuthContainer.displayName = 'AuthContainer';

export default AuthContainer;
