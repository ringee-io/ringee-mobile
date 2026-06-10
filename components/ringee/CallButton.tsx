import * as Haptics from 'expo-haptics';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useOptionalCredit } from '@/lib/credit/CreditProvider';
import { useOptionalVoice } from '@/lib/voice';
import { Feather } from '@expo/vector-icons';

interface Props {
  phoneNumber?: string | null;
  variant?: 'pill' | 'fab' | 'inline';
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: (phoneNumber: string) => void;
}

export function CallButton({
  phoneNumber,
  variant = 'pill',
  label,
  disabled,
  fullWidth,
  onPress,
}: Props) {
  const t = useTheme();
  const voice = useOptionalVoice();
  const credit = useOptionalCredit();
  const isDisabled = !phoneNumber || disabled;

  async function handlePress() {
    if (!phoneNumber || disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onPress) {
      onPress(phoneNumber);
      return;
    }
    // Block the call and surface the credit flow when there's no balance/trial.
    if (credit && !credit.guardCall()) return;
    // Prefer in-app Telnyx voice; fall back to the OS dialer if the voice
    // provider isn't available (e.g. web bundle or SDK not yet installed).
    // When the user has 2+ caller IDs we prompt them which one to dial from,
    // so an outbound call from a contact card never silently uses the wrong
    // outbound number.
    if (voice) {
      await voice.placeCallWithCallerPrompt(phoneNumber);
      return;
    }
    const url = `tel:${phoneNumber.replace(/[^+\d]/g, '')}`;
    try {
      await Linking.openURL(url);
    } catch {
      // Some Android devices without a dialer will throw; we swallow it.
    }
  }

  if (variant === 'fab') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel="Call"
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: t.call,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDisabled ? 0.5 : 1,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Feather name="phone" size={22} color="#fff" />
        </View>
      </Pressable>
    );
  }

  if (variant === 'inline') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Call"
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: t.call,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          <Feather name="phone" size={16} color="#fff" />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel="Call"
      style={fullWidth ? { alignSelf: 'stretch' } : undefined}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: fullWidth ? 14 : 999,
          backgroundColor: t.call,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <Feather name="phone" size={16} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
          {label ?? 'Call'}
        </Text>
      </View>
    </Pressable>
  );
}

export function CallButtonRow({
  phoneNumber,
  children,
}: {
  phoneNumber?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <CallButton phoneNumber={phoneNumber} variant="inline" />
      {children}
    </View>
  );
}
