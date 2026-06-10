import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ringee';

const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();
import { useTheme } from '@/hooks/useTheme';
import {
  CallbacksApi,
  ContactsApi,
  MeetingsApi,
  type ContactSummary,
} from '@/lib/api';
import { prettyE164 } from '@/lib/phone';
import { emitRefresh } from '@/lib/refreshBus';
import { Feather } from '@expo/vector-icons';

type Mode = 'meeting' | 'callback';

function nextHour(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export default function ScheduleSheetScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const mode: Mode = params.mode === 'callback' ? 'callback' : 'meeting';
  const isMeeting = mode === 'meeting';

  const [contact, setContact] = useState<ContactSummary | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContactSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const [when, setWhen] = useState<Date>(nextHour);
  const [androidField, setAndroidField] = useState<'date' | 'time' | null>(null);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reqId = useRef(0);
  useEffect(() => {
    if (contact) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const token = ++reqId.current;
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const res = await ContactsApi.listContacts({ search: q, limit: 10 });
        if (token !== reqId.current) return;
        setResults(res.data ?? []);
      } catch {
        if (token !== reqId.current) return;
        setResults([]);
      } finally {
        if (token === reqId.current) setSearching(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query, contact]);

  function onAndroidChange(event: DateTimePickerEvent, selected?: Date) {
    setAndroidField(null);
    if (event.type !== 'set' || !selected) return;
    setWhen((prev) => {
      const next = new Date(prev);
      if (androidField === 'date') {
        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      }
      return next;
    });
  }

  function onIosChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setWhen(selected);
  }

  async function submit() {
    if (!contact || submitting) return;
    setSubmitting(true);
    try {
      if (isMeeting) {
        await MeetingsApi.createMeeting({
          contactId: contact.id,
          scheduledAt: when.toISOString(),
          notes: notes.trim() || undefined,
        });
      } else {
        await CallbacksApi.createCallback({
          contactId: contact.id,
          scheduledAt: when.toISOString(),
          note: notes.trim() || undefined,
        });
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      emitRefresh('calls');
      router.back();
    } catch (err) {
      Alert.alert(
        isMeeting ? 'Could not schedule meeting' : 'Could not schedule callback',
        err instanceof Error ? err.message : 'Try again',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isIOS = Platform.OS === 'ios';
  const canSubmit = !!contact && !submitting;

  return (
    <>
      <Stack.Screen
        style={{ flex: 1, backgroundColor: t.background }}
        options={{
          title: isMeeting ? 'New meeting' : 'New callback',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Feather name='x' style={{ color: t.text, fontSize: 28, fontWeight: '900' }} />
            </Pressable>
          ),
        }}
      />
      
      <ScrollView
        style={{ flex: 1, backgroundColor: t.background }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SectionLabel>Contact</SectionLabel>
        {contact ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 14,
              borderCurve: 'continuous',
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              marginBottom: 24,
            }}
          >
            <Avatar name={contact.name} fallback={contact.phoneNumber} size={40} />
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ color: t.text, fontSize: 15, fontWeight: '600' }}
              >
                {contact.name || 'Unknown'}
              </Text>
              <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: 13 }}>
                {contact.company || prettyE164(contact.phoneNumber)}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setContact(null);
                setQuery('');
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Change contact"
            >
              <Feather name="x" size={18} color={t.iconMuted} />
            </Pressable>
          </View>
        ) : (
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                height: 44,
                borderRadius: 12,
                borderCurve: 'continuous',
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <Feather name="search" size={16} color={t.iconMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search name or number"
                placeholderTextColor={t.textMuted}
                autoCorrect={false}
                autoCapitalize="words"
                style={{
                  flex: 1,
                  color: t.text,
                  fontSize: 15,
                  paddingVertical: 0,
                }}
              />
              {searching ? <ActivityIndicator size="small" color={t.iconMuted} /> : null}
            </View>

            {results.length > 0 ? (
              <View
                style={{
                  marginTop: 10,
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  backgroundColor: t.surface,
                  borderWidth: 1,
                  borderColor: t.border,
                  overflow: 'hidden',
                }}
              >
                {results.map((c, i) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setContact(c);
                      setQuery('');
                      setResults([]);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: t.border,
                      opacity: 1,
                    }}
                  >
                    <Avatar name={c.name} fallback={c.phoneNumber} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{ color: t.text, fontSize: 14, fontWeight: '600' }}
                      >
                        {c.name || 'Unknown'}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ color: t.textMuted, fontSize: 12 }}
                      >
                        {c.company || prettyE164(c.phoneNumber)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}

        <SectionLabel>{isMeeting ? 'Meeting time' : 'When to call back'}</SectionLabel>
        {isIOS ? (
          <View style={{ gap: 10, marginBottom: 24 }}>
            <Row icon="calendar" label="Date">
              <DateTimePicker
                value={when}
                mode="date"
                display="compact"
                minimumDate={new Date()}
                onChange={onIosChange}
                accentColor={t.tint}
              />
            </Row>
            <Row icon="clock" label="Time">
              <DateTimePicker
                value={when}
                mode="time"
                display="compact"
                minuteInterval={5}
                onChange={onIosChange}
                accentColor={t.tint}
              />
            </Row>
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 24 }}>
            <AndroidField
              icon="calendar"
              label="Date"
              value={when.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              onPress={() => setAndroidField('date')}
            />
            <AndroidField
              icon="clock"
              label="Time"
              value={when.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
              onPress={() => setAndroidField('time')}
            />
            {androidField ? (
              <DateTimePicker
                value={when}
                mode={androidField}
                display="default"
                minimumDate={androidField === 'date' ? new Date() : undefined}
                minuteInterval={5}
                onChange={onAndroidChange}
              />
            ) : null}
          </View>
        )}

        <SectionLabel>{isMeeting ? 'Notes' : 'Note'}</SectionLabel>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={
            isMeeting ? 'Agenda, prep, location…' : 'What to follow up on…'
          }
          placeholderTextColor={t.textMuted}
          multiline
          style={{
            minHeight: 88,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 14,
            borderCurve: 'continuous',
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            color: t.text,
            fontSize: 15,
            lineHeight: 22,
            textAlignVertical: 'top',
            marginBottom: 24,
          }}
        />

        <Pressable
          disabled={!canSubmit}
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel={isMeeting ? 'Schedule meeting' : 'Schedule callback'}
          style={{
            borderRadius: 16,
            opacity: !canSubmit ? 0.4 : 1,
          }}
        >
          {LIQUID_GLASS ? (
            <GlassView
              glassEffectStyle="regular"
              isInteractive
              tintColor={t.call}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 16,
                borderRadius: 16,
                borderCurve: 'continuous',
                overflow: 'hidden',
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather
                  name={isMeeting ? 'calendar' : 'phone-call'}
                  size={16}
                  color="#fff"
                />
              )}
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {isMeeting ? 'Schedule meeting' : 'Schedule callback'}
              </Text>
            </GlassView>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 16,
                borderRadius: 16,
                borderCurve: 'continuous',
                backgroundColor: t.call,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather
                  name={isMeeting ? 'calendar' : 'phone-call'}
                  size={16}
                  color="#fff"
                />
              )}
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {isMeeting ? 'Schedule meeting' : 'Schedule callback'}
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: t.textMuted,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <Feather name={icon} size={16} color={t.icon} />
      <Text
        style={{
          color: t.text,
          fontSize: 15,
          fontWeight: '600',
          marginLeft: 10,
          flex: 1,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function AndroidField({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        opacity: 1,
      }}
    >
      <Feather name={icon} size={16} color={t.icon} />
      <Text
        style={{
          color: t.text,
          fontSize: 15,
          fontWeight: '600',
          marginLeft: 10,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Text style={{ color: t.textMuted, fontSize: 15, fontWeight: '600' }}>{value}</Text>
    </Pressable>
  );
}
