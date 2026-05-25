import { View, ViewProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export function NativeCard({ children, style, ...rest }: ViewProps) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: t.surfaceElevated,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: t.border,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
