import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionButton,
  Avatar,
  CallButton,
  ErrorState,
  HeaderMenuButton,
  LoadingState,
  NativeCard,
  NoteModal,
  StatusPill,
} from '@/components/ringee';
import type { HeaderMenuItem } from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { ContactsApi } from '@/lib/api';
import { useResource } from '@/lib/hooks/useResource';
import {
  formatDuration,
  formatRelativeFromNow,
  formatTime,
} from '@/lib/format';
import { Feather } from '@expo/vector-icons';

export default function ContactDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const contact = useResource(() => ContactsApi.getContact(id!), [id]);
  const [noteOpen, setNoteOpen] = useState(false);

  if (contact.loading && !contact.data) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <Stack.Screen options={{ title: 'Contact' }} />
        <LoadingState />
      </View>
    );
  }
  if (contact.error || !contact.data) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <Stack.Screen options={{ title: 'Contact' }} />
        <ErrorState
          message={contact.error ?? 'Contact not found'}
          onRetry={contact.reload}
        />
      </View>
    );
  }

  const c = contact.data;
  const displayName = c.name || c.phoneNumber;

  const menuItems: HeaderMenuItem[] = [
    { label: 'Add note', onPress: () => setNoteOpen(true) },
    ...(c.email
      ? [
          {
            label: 'Email',
            onPress: () =>
              Linking.openURL(`mailto:${c.email}`).catch(() => {}),
          },
        ]
      : []),
    {
      label: 'Share',
      onPress: () =>
        Share.share({
          message: `${displayName}${c.phoneNumber ? ` — ${c.phoneNumber}` : ''}${c.email ? `\n${c.email}` : ''}`,
        }).catch(() => {}),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: 'Contact',
          headerRight: () => (
            <HeaderMenuButton items={menuItems} title={displayName} />
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 32,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={contact.refreshing}
            onRefresh={contact.refresh}
            tintColor={t.text}
          />
        }
      >
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Avatar name={c.name} fallback={c.phoneNumber} size={72} />
          <Text
            style={{
              marginTop: 6,
              color: t.text,
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.4,
              textAlign: 'center',
            }}
          >
            {displayName}
          </Text>
          {c.company ? (
            <Text style={{ color: t.textMuted, fontSize: 14 }}>{c.company}</Text>
          ) : null}
          {c.jobTitle ? (
            <Text style={{ color: t.textMuted, fontSize: 13 }}>{c.jobTitle}</Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <CallButton phoneNumber={c.phoneNumber} label="Call" fullWidth />
          </View>
          {c.email ? (
            <View style={{ flex: 1 }}>
              <ActionButton
                icon="mail"
                label="Email"
                onPress={() => Linking.openURL(`mailto:${c.email}`).catch(() => {})}
              />
            </View>
          ) : null}
        </View>

        <NativeCard>
          <DetailRow icon="phone" label="Phone" value={c.phoneNumber} />
          {c.email ? <DetailRow icon="mail" label="Email" value={c.email} /> : null}
          {c.lastContactedAt ? (
            <DetailRow
              icon="clock"
              label="Last contacted"
              value={formatRelativeFromNow(c.lastContactedAt)}
              last
            />
          ) : (
            <DetailRow icon="clock" label="Last contacted" value="—" last />
          )}
        </NativeCard>

        {c.upcomingCallback ? (
          <Pressable
            onPress={() =>
              router.push(`/callback/${c.upcomingCallback!.id}` as never)
            }
          >
            <NativeCard
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: 'rgba(245,158,11,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="phone-call" size={16} color={t.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '600' }}>
                  Callback scheduled
                </Text>
                <Text style={{ color: t.textMuted, fontSize: 13 }}>
                  {formatTime(c.upcomingCallback.scheduledAt)} ·{' '}
                  {formatRelativeFromNow(c.upcomingCallback.scheduledAt)}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={t.iconMuted} />
            </NativeCard>
          </Pressable>
        ) : null}

        {c.upcomingMeeting ? (
          <Pressable
            onPress={() =>
              router.push(`/meeting/${c.upcomingMeeting!.id}` as never)
            }
          >
            <NativeCard
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: 'rgba(99,102,241,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="calendar" size={16} color={t.meeting} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '600' }}>
                  {c.upcomingMeeting.title || 'Upcoming meeting'}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: 13 }}>
                  {formatTime(c.upcomingMeeting.scheduledAt)} ·{' '}
                  {formatRelativeFromNow(c.upcomingMeeting.scheduledAt)}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={t.iconMuted} />
            </NativeCard>
          </Pressable>
        ) : null}

        {c.recentCalls?.length ? (
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: t.textMuted,
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              Recent calls
            </Text>
            {c.recentCalls.slice(0, 8).map((call) => (
              <Pressable
                key={call.id}
                onPress={() => router.push(`/call/${call.id}` as never)}
              >
                <NativeCard
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Feather
                    name={
                      call.direction === 'inbound'
                        ? 'phone-incoming'
                        : 'phone-outgoing'
                    }
                    size={16}
                    color={t.icon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontWeight: '500' }}>
                      {call.outcome
                        ? prettyOutcome(call.outcome)
                        : call.direction === 'inbound'
                          ? 'Inbound call'
                          : 'Outbound call'}
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 13 }}>
                      {formatRelativeFromNow(call.startedAt)}
                      {call.durationSeconds
                        ? ` · ${formatDuration(call.durationSeconds)}`
                        : ''}
                    </Text>
                  </View>
                  {call.hasRecording ? (
                    <StatusPill label="Rec" tone="info" />
                  ) : null}
                </NativeCard>
              </Pressable>
            ))}
          </View>
        ) : null}

        {c.notes?.length ? (
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: t.textMuted,
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              Notes
            </Text>
            {c.notes.slice(0, 10).map((n) => (
              <NativeCard key={n.id}>
                <Text style={{ color: t.text, lineHeight: 22 }}>{n.content}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 6 }}>
                  {formatRelativeFromNow(n.createdAt)}
                </Text>
              </NativeCard>
            ))}
          </View>
        ) : null}

        <ActionButton
          icon="edit-3"
          label="Add note"
          onPress={() => setNoteOpen(true)}
        />
      </ScrollView>

      <NoteModal
        visible={noteOpen}
        title="Add contact note"
        onClose={() => setNoteOpen(false)}
        onSubmit={async (content) => {
          await ContactsApi.addContactNote(c.id, content);
          contact.reload();
        }}
      />
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
      }}
    >
      <Feather name={icon} size={16} color={t.icon} />
      <Text style={{ color: t.textMuted, fontSize: 14, marginLeft: 10, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          color: t.text,
          fontSize: 14,
          fontWeight: '500',
          marginLeft: 12,
          textAlign: 'right',
          flexShrink: 1,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function prettyOutcome(o: string) {
  return o.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
