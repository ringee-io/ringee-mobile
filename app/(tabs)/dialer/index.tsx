import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';

import {
  Avatar,
  ContactResultsSheet,
  Keypad,
} from '@/components/ringee';
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

export default function DialerScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const voice = useVoice();
  const params = useLocalSearchParams<{ to?: string }>();

  // `raw` is exactly what the keypad produced (digits plus an optional leading
  // '+'); DEFAULT_COUNTRY supplies the dial code for bare national input.
  const [raw, setRaw] = useState('');
  const [resultsOpen, setResultsOpen] = useState(false);

  // Contact autocomplete state, keyed off the typed digits.
  const [matches, setMatches] = useState<ContactSummary[]>([]);
  const [matchTotal, setMatchTotal] = useState(0);

  useEffect(() => {
    if (typeof params.to === 'string' && params.to) {
      setRaw(params.to);
    }
  }, [params.to]);

  const parsed = useMemo(() =>   parseNumber('+' + (raw || ''), DEFAULT_COUNTRY), [raw]);
  const searchDigits = digitsOnly(raw);

  // Debounced contact-by-number lookup. Aborts stale responses with a token.
  const reqId = useRef(0);
  useEffect(() => {
    if (searchDigits.length < 3) {
      setMatches([]);
      setMatchTotal(0);
      return;
    }
    const token = ++reqId.current;
    const id = setTimeout(async () => {
      try {
        const res = await ContactsApi.searchContactsByPhone(searchDigits, 20);
        if (token !== reqId.current) return;
        setMatches(res.data ?? []);
        setMatchTotal(res.total ?? res.data?.length ?? 0);
      } catch {
        if (token !== reqId.current) return;
        setMatches([]);
        setMatchTotal(0);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [searchDigits]);

  // Caller options live on the voice provider so dialer + CallButton agree.
  const callerOptions = voice.callerOptions;
  const selectedCaller =
    callerOptions.find((o) => o.value === voice.defaultCallerId) ||
    callerOptions[0] ||
    null;

  const pickCaller = () => {
    if (callerOptions.length <= 1) return;
    const labels = callerOptions.map((o) => `${prettyE164(o.value)} · ${o.sub}`);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: 'Call from', options: [...labels, 'Cancel'], cancelButtonIndex: labels.length },
        (idx) => {
          if (idx >= 0 && idx < callerOptions.length) {
            voice.setDefaultCallerId(callerOptions[idx].value);
          }
        },
      );
    } else {
      Alert.alert(
        'Call from',
        'Choose the number to display as outbound caller.',
        callerOptions.map((o) => ({
          text: prettyE164(o.value),
          onPress: () => voice.setDefaultCallerId(o.value),
        })),
        { cancelable: true },
      );
    }
  };

  const onKey = (d: string) => setRaw((prev) => prev + d);
  const onLongZero = () => setRaw((prev) => prev + '+');
  const backspace = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setRaw((prev) => prev.slice(0, -1));
  };
  const clearAll = () => setRaw('');

  const canCall = parsed.national.length >= 3 && !!parsed.e164 && !voice.activeCall;

  const dial = async (destination: string) => {
    if (voice.activeCall) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await voice.placeCall({ destination, callerId: selectedCaller?.value });
  };

  const topMatch = matches[0] ?? null;
  const moreCount = Math.max(0, matchTotal - 1);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.background,
        paddingTop: insets.top + 6,
        // Reserve room for the (floating) native tab bar so the keypad and
        // call button are never hidden behind it.
        paddingBottom: tabBarHeight + 12,
        paddingHorizontal: 20,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar: caller-ID pill + contacts */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 40,
        }}
      >
        <CallerIdPill
          label={selectedCaller ? prettyE164(selectedCaller.value) : 'No caller ID'}
          onPress={pickCaller}
          selectable={callerOptions.length > 1}
          statusColor={
            voice.errorMessage
              ? t.missed
              : voice.connecting
                ? t.warning
                : voice.registered
                  ? t.call
                  : t.textMuted
          }
        />
        <Pressable
          onPress={() => router.push('/contacts' as never)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Contacts"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Feather name="user-plus" size={18} color={t.text} />
        </Pressable>
      </View>

      {/* Dialed number, sitting just under the top bar */}
      <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 36, height: 56 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: parsed.e164 ? t.text : t.textMuted,
            fontSize: parsed.e164 ? 40 : 22,
            fontWeight: '500',
            letterSpacing: parsed.e164 ? 1 : 0,
            textAlign: 'center',
          }}
        >
          {parsed.e164 ? prettyE164(parsed.e164) : 'Enter a number'}
        </Text>
      </View>

      {/* Contact match card */}
      {topMatch ? (
        <View
          style={{
            backgroundColor: t.surface,
            borderRadius: 18,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: t.border,
            marginTop: 20,
            marginBottom: 4,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={() => dial(topMatch.phoneNumber)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Avatar name={topMatch.name} fallback={topMatch.phoneNumber} size={40} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                numberOfLines={1}
                style={{ color: t.text, fontSize: 16, fontWeight: '600' }}
              >
                {topMatch.name || 'Unknown'}
              </Text>
              <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: 14 }}>
                {prettyE164(topMatch.phoneNumber)}
              </Text>
            </View>
            <Feather name="phone" size={18} color={t.call} />
          </Pressable>

          {moreCount > 0 ? (
            <>
              <View style={{ height: 1, backgroundColor: t.border, marginLeft: 70 }} />
              <Pressable
                onPress={() => setResultsOpen(true)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View style={{ width: 40, alignItems: 'center' }}>
                  <Feather name="search" size={18} color={t.textMuted} />
                </View>
                <Text style={{ color: t.textMuted, fontSize: 15, fontWeight: '500' }}>
                  {moreCount} More {moreCount === 1 ? 'Result' : 'Results'}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      {/* Spacer pushes the keypad to the bottom of the screen */}
      <View style={{ flex: 1 }} />

      {/* Keypad */}
      <Keypad onKey={onKey} onLongZero={onLongZero} horizontalPadding={20} />

      {/* Call row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
          paddingHorizontal: 8,
        }}
      >
        <View style={{ width: 56 }} />
        <Pressable
          onPress={() => dial(parsed.e164)}
          disabled={!canCall}
          accessibilityRole="button"
          accessibilityLabel="Place call"
          style={({ pressed }) => ({
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: t.call,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !canCall ? 0.4 : pressed ? 0.85 : 1,
            boxShadow: canCall ? '0 6px 16px rgba(16, 185, 129, 0.4)' : 'none',
          })}
        >
          <Feather name="phone" size={26} color="#fff" />
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

      <ContactResultsSheet
        visible={resultsOpen}
        contacts={matches}
        onClose={() => setResultsOpen(false)}
        onSelect={(c) => dial(c.phoneNumber)}
      />
    </View>
  );
}

interface CallerIdPillProps {
  label: string;
  onPress: () => void;
  selectable: boolean;
  statusColor: string;
}

/** Minimal "Call from" selector — a single muted line, not a heavy card. */
function CallerIdPill({ label, onPress, selectable, statusColor }: CallerIdPillProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!selectable}
      hitSlop={8}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingVertical: 7,
        paddingLeft: 11,
        paddingRight: selectable ? 9 : 13,
        borderRadius: 999,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: statusColor }} />
      <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
        {label}
      </Text>
      {selectable ? <Feather name="chevron-down" size={14} color={t.textMuted} /> : null}
    </Pressable>
  );
}
