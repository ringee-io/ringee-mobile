import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  Alert,
  Platform,
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
  DateTimePickerSheet,
  ErrorState,
  HeaderMenuButton,
  LoadingState,
  NativeCard,
  StatusPill,
} from '@/components/ringee';
import type { HeaderMenuItem } from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { CallbacksApi } from '@/lib/api';
import type { Callback } from '@/lib/api';
import { useResource } from '@/lib/hooks/useResource';
import {
  formatDayLabel,
  formatRelativeFromNow,
  formatTime,
} from '@/lib/format';
import { Feather } from '@expo/vector-icons';

export default function CallbackDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const cb = useResource(async () => {
    const list = await CallbacksApi.listCallbacks({ limit: 100 });
    return list.data.find((c) => c.id === id) ?? null;
  }, [id]);

  const [reschedOpen, setReschedOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function complete() {
    if (!cb.data || busy) return;
    try {
      setBusy(true);
      await CallbacksApi.completeCallback(cb.data.id);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (err) {
      Alert.alert('Could not complete', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(false);
    }
  }

  async function cancelCb() {
    if (!cb.data || busy) return;
    Alert.alert('Cancel callback?', 'This removes the reminder.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel callback',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusy(true);
            await CallbacksApi.cancelCallback(cb.data!.id);
            router.back();
          } catch (err) {
            Alert.alert('Failed', err instanceof Error ? err.message : 'Try again');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  if (cb.loading && !cb.data) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <Stack.Screen options={{ title: 'Callback' }} />
        <LoadingState />
      </View>
    );
  }
  if (cb.error || !cb.data) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <Stack.Screen options={{ title: 'Callback' }} />
        <ErrorState
          message={cb.error ?? 'Callback not found'}
          onRetry={cb.reload}
        />
      </View>
    );
  }

  const c: Callback = cb.data;
  const name = c.contactName || c.phoneNumber || 'Contact';
  const isCompleted = c.status === 'completed';
  const tone =
    c.status === 'completed'
      ? 'success'
      : c.status === 'cancelled' || c.status === 'missed'
        ? 'danger'
        : c.status === 'due'
          ? 'warning'
          : 'neutral';

  const menuItems: HeaderMenuItem[] = isCompleted
    ? c.contactId
      ? [
          {
            label: 'View contact',
            onPress: () => router.push(`/contact/${c.contactId}` as never),
          },
        ]
      : []
    : [
        { label: 'Mark complete', onPress: complete },
        { label: 'Reschedule', onPress: () => setReschedOpen(true) },
        ...(c.contactId
          ? [
              {
                label: 'View contact',
                onPress: () =>
                  router.push(`/contact/${c.contactId}` as never),
              },
            ]
          : []),
        { label: 'Cancel callback', onPress: cancelCb, destructive: true },
      ];

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: 'Callback',
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
      >
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Avatar name={c.contactName} fallback={c.phoneNumber} size={72} />
          <Text
            style={{
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
          <StatusPill label={c.status} tone={tone} />
        </View>

        <NativeCard>
          <DetailRow
            icon="calendar"
            label="Scheduled"
            value={`${formatDayLabel(c.scheduledAt)} · ${formatTime(c.scheduledAt)}`}
          />
          <DetailRow
            icon="clock"
            label="When"
            value={formatRelativeFromNow(c.scheduledAt)}
            last
          />
        </NativeCard>

        {c.note ? (
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
              Note
            </Text>
            <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
              {c.note}
            </Text>
          </NativeCard>
        ) : null}

        {!isCompleted ? (
          <View style={{ gap: 12 }}>
            <CallButton phoneNumber={c.phoneNumber} label="Call now" fullWidth />
            <ActionButton
              icon="check"
              label="Mark complete"
              variant="primary"
              onPress={complete}
              disabled={busy}
            />
            <ActionButton
              icon="clock"
              label="Reschedule"
              onPress={() => setReschedOpen(true)}
              disabled={busy}
            />
            <ActionButton
              label="Cancel callback"
              variant="destructive"
              onPress={cancelCb}
              disabled={busy}
            />
          </View>
        ) : null}

        {c.contactId ? (
          <Pressable
            onPress={() => router.push(`/contact/${c.contactId}` as never)}
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

      <DateTimePickerSheet
        visible={reschedOpen}
        onClose={() => setReschedOpen(false)}
        title="Reschedule callback"
        onPick={async (date) => {
          try {
            await CallbacksApi.rescheduleCallback(c.id, date.toISOString());
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            cb.reload();
          } catch (err) {
            Alert.alert('Failed', err instanceof Error ? err.message : 'Try again');
          }
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
