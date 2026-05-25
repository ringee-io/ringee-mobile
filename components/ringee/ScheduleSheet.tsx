import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
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

import { useTheme } from '@/hooks/useTheme';
import {
  CallbacksApi,
  ContactsApi,
  MeetingsApi,
  type ContactSummary,
} from '@/lib/api';
import { prettyE164 } from '@/lib/phone';
import { Feather } from '@expo/vector-icons';

import { Avatar } from './Avatar';
import { BottomSheet } from './BottomSheet';

type Mode = 'meeting' | 'callback';

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
  /** Fires after successful creation; the parent can refresh recent lists. */
  onCreated?: () => void;
  /** Optional pre-selected contact so we can skip the picker step. */
  initialContact?: ContactSummary;
}

/** Next sensible default: top of the next hour. */
function nextHour(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export function ScheduleSheet({
  visible,
  onClose,
  mode,
  onCreated,
  initialContact,
}: Props) {
  const t = useTheme();
  const isMeeting = mode === 'meeting';

  const [contact, setContact] = useState<ContactSummary | null>(initialContact ?? null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContactSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const [when, setWhen] = useState<Date>(nextHour);
  const [androidField, setAndroidField] = useState<'date' | 'time' | null>(null);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setContact(initialContact ?? null);
      setQuery('');
      setResults([]);
      setWhen(nextHour());
      setNotes('');
    }
  }, [visible, initialContact]);

  // Debounced contact search.
  const reqId = useRef(0);
  useEffect(() => {
    if (!visible || contact) return;
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
  }, [query, contact, visible]);

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
      onCreated?.();
      onClose();
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
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isMeeting ? 'New meeting' : 'New callback'}
      maxHeight="92%"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        contentContainerStyle={{ paddingBottom: 12 }}
      >
        {/* Contact */}
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
              marginBottom: 22,
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
          <View style={{ marginBottom: 22 }}>
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
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: t.border,
                      opacity: pressed ? 0.6 : 1,
                    })}
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

        {/* Date & Time */}
        <SectionLabel>{isMeeting ? 'Meeting time' : 'When to call back'}</SectionLabel>
        {isIOS ? (
          <View style={{ gap: 10, marginBottom: 22 }}>
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
          <View style={{ gap: 10, marginBottom: 22 }}>
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

        {/* Notes */}
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
            minHeight: 80,
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
            marginBottom: 22,
          }}
        />

        <Pressable
          disabled={!canSubmit}
          onPress={submit}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: t.primary,
            opacity: !canSubmit ? 0.4 : pressed ? 0.85 : 1,
          })}
        >
          {submitting ? (
            <ActivityIndicator color={t.primaryForeground} size="small" />
          ) : (
            <Feather
              name={isMeeting ? 'calendar' : 'phone-call'}
              size={16}
              color={t.primaryForeground}
            />
          )}
          <Text
            style={{
              color: t.primaryForeground,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            {isMeeting ? 'Schedule meeting' : 'Schedule callback'}
          </Text>
        </Pressable>
      </ScrollView>
    </BottomSheet>
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
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        opacity: pressed ? 0.6 : 1,
      })}
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
