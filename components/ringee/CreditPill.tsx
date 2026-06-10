import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useOptionalCredit } from '@/lib/credit/CreditProvider';

// The balance is shown as account "credits" (not a currency, not minutes). Per
// the product: it can't be expressed as minutes because the per-minute rate
// varies by destination country, and a "$" amount would read as a purchasable
// wallet — so we keep it as a neutral account allowance with no currency sign.
function formatCredits(value: number) {
  // Trim trailing zeros so it reads as an allowance ("12.5") not money ("12.50").
  return parseFloat(Math.max(0, value).toFixed(2)).toLocaleString();
}

/**
 * Header chip showing the account's available credits, opposite the workspace
 * switcher. Tapping opens an administrative request (not a purchase) — no
 * currency, no checkout — keeping the app clear of App Store / Play Store
 * in-app-purchase rules.
 */
export function CreditPill() {
  const t = useTheme();
  const credit = useOptionalCredit();
  if (!credit) return null;

  const { balance, freeCallTrial, loading, openCredit } = credit;
  const none = balance <= 0;
  const showFreeTrial = freeCallTrial && none;

  const onPress = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    openCredit();
  };

  if (loading) {
    return (
      <View
        style={{
          height: 30,
          width: 88,
          borderRadius: 999,
          backgroundColor: t.surface,
        }}
      />
    );
  }

  if (showFreeTrial) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="First call free"
        android_ripple={{ color: t.border, borderless: true }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 11,
          borderRadius: 999,
          backgroundColor: t.call,
        }}
      >
        <Feather name="gift" size={13} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
          First call free
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        none ? 'Request credit' : `${formatCredits(balance)} credits available`
      }
      android_ripple={{ color: t.border, borderless: true }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 11,
        borderRadius: 999,
        // backgroundColor: t.surface,
      }}
    >
      <Feather name="zap" size={13} color={none ? t.textMuted : t.call} />
      {none ? (
        <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>
          Request credit
        </Text>
      ) : (
        <Text
          style={{
            color: t.text,
            fontSize: 13,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
          }}
        >
          {formatCredits(balance)} credits
        </Text>
      )}
    </Pressable>
  );
}
