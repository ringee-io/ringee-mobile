import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

interface AuthButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary';
}

export default function AuthButton({
  onPress,
  title,
  disabled = false,
  loading = false,
  loadingText,
  variant = 'primary',
}: AuthButtonProps) {
  const t = useTheme();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  function handlePress() {
    if (isDisabled) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress();
  }

  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  };

  const label = loading && loadingText ? loadingText : title;
  const labelColor = isPrimary ? t.primaryForeground : t.text;

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : null}
      <Text
        style={{
          color: labelColor,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </>
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => ({
        borderRadius: 16,
        opacity: isDisabled ? 0.45 : pressed ? 0.9 : 1,
      })}
    >
      {isPrimary && LIQUID_GLASS ? (
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          tintColor={t.primary}
          style={baseStyle}
        >
          {inner}
        </GlassView>
      ) : (
        <View
          style={[
            baseStyle,
            isPrimary
              ? { backgroundColor: t.primary }
              : {
                  backgroundColor: t.surface,
                  borderWidth: 1,
                  borderColor: t.border,
                },
          ]}
        >
          {inner}
        </View>
      )}
    </Pressable>
  );
}
