import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Keypad } from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { ContactsApi, type ContactSummary } from '@/lib/api';
import {
  DEFAULT_COUNTRY,
  digitsOnly,
  parseNumber,
  prettyE164,
} from '@/lib/phone';
import { useVoice } from '@/lib/voice';
import { Feather } from '@expo/vector-icons';

export default function KeypadSheetScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const voice = useVoice();

  const [raw, setRaw] = useState('');
  const [topMatch, setTopMatch] = useState<ContactSummary | null>(null);

  const parsed = useMemo(
    () => parseNumber('+' + (raw || ''), DEFAULT_COUNTRY),
    [raw],
  );
  const searchDigits = digitsOnly(raw);

  const reqId = useRef(0);
  useEffect(() => {
    if (searchDigits.length < 3) {
      setTopMatch(null);
      return;
    }
    const token = ++reqId.current;
    const id = setTimeout(async () => {
      try {
        const res = await ContactsApi.searchContactsByPhone(searchDigits, 1);
        if (token !== reqId.current) return;
        setTopMatch(res.data?.[0] ?? null);
      } catch {
        if (token !== reqId.current) return;
        setTopMatch(null);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [searchDigits]);

  const callerOptions = voice.callerOptions;
  const selectedCaller =
    callerOptions.find((o) => o.value === voice.defaultCallerId) ||
    callerOptions[0] ||
    null;

  const onKey = (d: string) => setRaw((prev) => prev + d);
  const onLongZero = () => setRaw((prev) => prev + '+');
  const backspace = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setRaw((prev) => prev.slice(0, -1));
  };
  const clearAll = () => setRaw('');

  const canCall = parsed.national.length >= 3 && !!parsed.e164 && !voice.activeCall;

  const dial = async (destination: string) => {
    if (voice.activeCall || !destination) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await voice.placeCall({ destination, callerId: selectedCaller?.value });
    router.back();
  };

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 64 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          selectable
          style={{
            color: parsed.e164 ? t.text : t.textMuted,
            fontSize: parsed.e164 ? 40 : 20,
            fontWeight: '400',
            letterSpacing: parsed.e164 ? 1 : 0,
            textAlign: 'center',
          }}
        >
          {parsed.e164 ? prettyE164(parsed.e164) : 'Enter a number'}
        </Text>
      </View>

      {topMatch ? (
        <Pressable
          onPress={() => dial(topMatch.phoneNumber)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            marginTop: 12,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Avatar name={topMatch.name} fallback={topMatch.phoneNumber} size={36} />
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{ color: t.text, fontSize: 15, fontWeight: '600' }}
            >
              {topMatch.name || 'Unknown'}
            </Text>
            <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: 13 }}>
              {prettyE164(topMatch.phoneNumber)}
            </Text>
          </View>
          <Feather name="phone" size={16} color={t.call} />
        </Pressable>
      ) : null}

      <View style={{ flex: 1, justifyContent: 'center', marginTop: 12 }}>
        <Keypad onKey={onKey} onLongZero={onLongZero} horizontalPadding={20} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          marginTop: 8,
        }}
      >
        <View style={{ width: 56 }} />
        <Pressable
          onPress={() => dial(parsed.e164)}
          disabled={!canCall}
          accessibilityRole="button"
          accessibilityLabel="Place call"
          style={({ pressed }) => ({
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: t.call,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !canCall ? 0.4 : pressed ? 0.85 : 1,
            boxShadow: canCall ? '0 8px 20px rgba(16, 185, 129, 0.4)' : 'none',
          })}
        >
          <Feather name="phone" size={28} color="#fff" />
        </Pressable>
        <Pressable
          onPress={backspace}
          onLongPress={clearAll}
          disabled={!raw}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !raw ? 0 : pressed ? 0.5 : 1,
          })}
        >
          <Feather name="delete" size={24} color={t.text} />
        </Pressable>
      </View>
    </View>
  );
}
