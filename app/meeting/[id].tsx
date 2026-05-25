import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Linking,
  Pressable,
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
  StatusPill,
} from '@/components/ringee';
import type { HeaderMenuItem } from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { MeetingsApi } from '@/lib/api';
import { useResource } from '@/lib/hooks/useResource';
import {
  formatDayLabel,
  formatRelativeFromNow,
  formatTime,
} from '@/lib/format';
import { Feather } from '@expo/vector-icons';

export default function MeetingDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const meeting = useResource(() => MeetingsApi.getMeeting(id!), [id]);

  if (meeting.loading && !meeting.data) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <Stack.Screen options={{ title: 'Meeting' }} />
        <LoadingState />
      </View>
    );
  }
  if (meeting.error || !meeting.data) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <Stack.Screen options={{ title: 'Meeting' }} />
        <ErrorState
          message={meeting.error ?? 'Meeting not found'}
          onRetry={meeting.reload}
        />
      </View>
    );
  }

  const m = meeting.data;
  const tone =
    m.status === 'completed'
      ? 'success'
      : m.status === 'cancelled'
        ? 'danger'
        : 'meeting';

  async function cancel() {
    Alert.alert('Cancel meeting?', 'The contact will be notified by your normal flow.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel meeting',
        style: 'destructive',
        onPress: async () => {
          try {
            await MeetingsApi.cancelMeeting(m.id);
            router.back();
          } catch (err) {
            Alert.alert('Failed', err instanceof Error ? err.message : 'Try again');
          }
        },
      },
    ]);
  }

  const menuItems: HeaderMenuItem[] = [
    ...(m.meetingUrl
      ? [
          {
            label: 'Open meeting link',
            onPress: () =>
              Linking.openURL(m.meetingUrl!).catch(() => {}),
          },
        ]
      : []),
    ...(m.contactId
      ? [
          {
            label: 'View contact',
            onPress: () => router.push(`/contact/${m.contactId}` as never),
          },
        ]
      : []),
    ...(m.status === 'scheduled'
      ? [{ label: 'Cancel meeting', onPress: cancel, destructive: true }]
      : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: 'Meeting',
          headerRight: () => (
            <HeaderMenuButton items={menuItems} title={m.title || 'Meeting'} />
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
      >
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Avatar name={m.contactName} fallback={m.title} size={72} />
          <Text
            style={{
              color: t.text,
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.4,
              textAlign: 'center',
            }}
          >
            {m.title || (m.contactName ? `Meeting with ${m.contactName}` : 'Meeting')}
          </Text>
          {m.contactCompany ? (
            <Text style={{ color: t.textMuted, fontSize: 14 }}>
              {m.contactCompany}
            </Text>
          ) : null}
          <StatusPill label={m.status} tone={tone} />
        </View>

        <NativeCard>
          <DetailRow
            icon="calendar"
            label="Scheduled"
            value={`${formatDayLabel(m.scheduledAt)} · ${formatTime(m.scheduledAt)}`}
          />
          <DetailRow
            icon="clock"
            label="When"
            value={formatRelativeFromNow(m.scheduledAt)}
          />
          <DetailRow
            icon="watch"
            label="Duration"
            value={`${m.duration} min`}
            last={!m.location}
          />
          {m.location ? (
            <DetailRow icon="map-pin" label="Location" value={m.location} last />
          ) : null}
        </NativeCard>

        {m.notes ? (
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
              Notes
            </Text>
            <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
              {m.notes}
            </Text>
          </NativeCard>
        ) : null}

        <View style={{ gap: 12 }}>
          {m.meetingUrl ? (
            <ActionButton
              icon="video"
              label="Open meeting link"
              variant="primary"
              onPress={() => Linking.openURL(m.meetingUrl!).catch(() => {})}
            />
          ) : null}

          <CallButton
            phoneNumber={undefined}
            label="Call contact"
            disabled
            fullWidth
          />

          {m.status === 'scheduled' ? (
            <ActionButton
              label="Cancel meeting"
              variant="destructive"
              onPress={cancel}
            />
          ) : null}
        </View>

        {m.contactId ? (
          <Pressable
            onPress={() => router.push(`/contact/${m.contactId}` as never)}
          >
            <NativeCard
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Feather name="user" size={18} color={t.icon} />
              <Text style={{ color: t.text, fontWeight: '600', flex: 1 }}>
                View contact
              </Text>
              <Feather name="chevron-right" size={18} color={t.iconMuted} />
            </NativeCard>
          </Pressable>
        ) : null}
      </ScrollView>

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
