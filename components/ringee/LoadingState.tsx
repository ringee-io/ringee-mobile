import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export function LoadingState({ inline }: { inline?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingVertical: inline ? 16 : 80,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={t.text} />
    </View>
  );
}
