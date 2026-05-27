import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import UserProfileSettings from '@/components/auth/UserProfileSettings';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

export default function ProfileSheetScreen() {
  const t = useTheme();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={22} color={t.text} />
            </Pressable>
          ),
        }}
      />
      <UserProfileSettings />
    </>
  );
}
