import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
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
  OutcomeModal,
} from '@/components/ringee';
import { CallTranscript } from '@/components/ringee/CallTranscript';
import { RecordingPlayer } from '@/components/ringee/RecordingPlayer';
import type { HeaderMenuItem } from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { CallsApi } from '@/lib/api';
import { useResource } from '@/lib/hooks/useResource';
import {
  formatDateLong,
  formatDuration,
  formatRelativeFromNow,
  formatTime,
} from '@/lib/format';
import { Feather } from '@expo/vector-icons';

export default function CallDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const call = useResource(() => CallsApi.getCall(id!), [id]);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  if (call.loading && !call.data) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <Stack.Screen options={{ title: 'Call' }} />
        <LoadingState />
      </View>
    );
  }
  if (call.error || !call.data) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <Stack.Screen options={{ title: 'Call' }} />
        <ErrorState message={call.error ?? 'Call not found'} onRetry={call.reload} />
      </View>
    );
  }

  const c = call.data;
  const inbound = c.direction === 'inbound';
  const partyNumber = c.phoneNumber || (inbound ? c.fromNumber : c.toNumber);
  const name = c.contactName || partyNumber;

  const menuItems: HeaderMenuItem[] = [
    {
      label: c.outcome ? 'Edit outcome' : 'Set outcome',
      onPress: () => setOutcomeOpen(true),
    },
    { label: 'Add note', onPress: () => setNoteOpen(true) },
    ...(c.contactId
      ? [
          {
            label: 'View contact',
            onPress: () => router.push(`/contact/${c.contactId}` as never),
          },
        ]
      : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: inbound ? 'Inbound call' : 'Outbound call',
          headerBackground: () => <View style={{ backgroundColor: t.background, flex: 1 }} />,
          headerRight: () => <HeaderMenuButton items={menuItems} title={name} />,
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
            refreshing={call.refreshing}
            onRefresh={call.refresh}
            tintColor={t.text}
          />
        }
      >
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Avatar name={c.contactName} fallback={partyNumber} size={72} />
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
            {name}
          </Text>
          {c.contactCompany ? (
            <Text style={{ color: t.textMuted, fontSize: 14 }}>
              {c.contactCompany}
            </Text>
          ) : null}
          {partyNumber && partyNumber !== name ? (
            <Text style={{ color: t.textMuted, fontSize: 14 }}>
              {partyNumber}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <CallButton phoneNumber={partyNumber} label="Call" fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton
              icon="tag"
              label={c.outcome ? 'Edit outcome' : 'Set outcome'}
              onPress={() => setOutcomeOpen(true)}
            />
          </View>
        </View>

        <NativeCard>
          <DetailRow
            icon={inbound ? 'phone-incoming' : 'phone-outgoing'}
            label="Direction"
            value={inbound ? 'Inbound' : 'Outbound'}
          />
          <DetailRow
            icon="clock"
            label="Started"
            value={
              c.startedAt
                ? `${formatDateLong(c.startedAt)} · ${formatTime(c.startedAt)}`
                : '—'
            }
          />
          <DetailRow
            icon="watch"
            label="Duration"
            value={formatDuration(c.durationSeconds) || '—'}
            last={!c.outcome}
          />
          {c.outcome ? (
            <DetailRow
              icon="tag"
              label="Outcome"
              value={prettyOutcome(c.outcome)}
              last
            />
          ) : null}
        </NativeCard>

        {c.outcomeNote ? (
          <NativeCard>
            <Text
              style={{
                color: t.textMuted,
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              Outcome note
            </Text>
            <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
              {c.outcomeNote}
            </Text>
          </NativeCard>
        ) : null}

        {c.hasRecording && c.recordingUrl ? (
          <RecordingPlayer recordingUrl={c.recordingUrl} callId={c.id} />
        ) : null}

        <CallTranscript callId={c.id} />

        {Array.isArray(c.notes) && c.notes.length > 0 ? (
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
            {c.notes.map((n) => (
              <NativeCard key={n.id}>
                <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
                  {n.content}
                </Text>
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

      <OutcomeModal
        visible={outcomeOpen}
        onClose={() => setOutcomeOpen(false)}
        onSubmit={async ({ outcome, note }) => {
          await CallsApi.setCallOutcome(c.id, {
            outcome,
            outcomeNote: note,
          });
          call.reload();
        }}
      />
      <NoteModal
        visible={noteOpen}
        title="Add call note"
        onClose={() => setNoteOpen(false)}
        onSubmit={async (content) => {
          await CallsApi.addCallNote(c.id, content);
          call.reload();
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
