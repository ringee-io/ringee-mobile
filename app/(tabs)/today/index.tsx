import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionRow,
  CallButton,
  EmptyState,
  ErrorState,
  LoadingState,
  RowSeparator,
  SectionHeader,
  StatusPill,
  SummaryCard,
} from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { CallbacksApi, TodayApi } from '@/lib/api';
import type { Call, Callback, Meeting, Reminder } from '@/lib/api';
import { useResource } from '@/lib/hooks/useResource';
import {
  formatDateLong,
  formatRelativeFromNow,
  formatTime,
} from '@/lib/format';

type Row =
  | { kind: 'callback'; item: Callback }
  | { kind: 'meeting'; item: Meeting }
  | { kind: 'missed'; item: Call }
  | { kind: 'reminder'; item: Reminder };

export default function TodayScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const today = useResource(() => TodayApi.getToday(), []);
  const [completing, setCompleting] = useState<string | null>(null);

  const sections = useMemo(() => {
    const data = today.data;
    if (!data) return [];
    const result: { title: string; count: number; data: Row[] }[] = [];
    if (data.callbacks?.length) {
      result.push({
        title: 'Callbacks',
        count: data.callbacks.length,
        data: data.callbacks.map((item) => ({ kind: 'callback', item })),
      });
    }
    if (data.meetings?.length) {
      result.push({
        title: 'Upcoming meetings',
        count: data.meetings.length,
        data: data.meetings.map((item) => ({ kind: 'meeting', item })),
      });
    }
    if (data.missedCalls?.length) {
      result.push({
        title: 'Missed calls',
        count: data.missedCalls.length,
        data: data.missedCalls.map((item) => ({ kind: 'missed', item })),
      });
    }
    if (data.reminders?.length) {
      result.push({
        title: 'Reminders',
        count: data.reminders.length,
        data: data.reminders.map((item) => ({ kind: 'reminder', item })),
      });
    }
    return result;
  }, [today.data]);

  const completeCallback = useCallback(
    async (id: string) => {
      try {
        setCompleting(id);
        await CallbacksApi.completeCallback(id);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        today.reload();
      } catch (err) {
        Alert.alert(
          'Could not mark complete',
          err instanceof Error ? err.message : 'Try again',
        );
      } finally {
        setCompleting(null);
      }
    },
    [today],
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.firstName?.trim();
  const subtitle = `${firstName ? `${greeting}, ${firstName}` : greeting} · ${formatDateLong(new Date())}`;

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      if (item.kind === 'callback') {
        const c = item.item;
        const name = c.contactName || c.phoneNumber || 'Unknown contact';
        return (
          <ActionRow
            avatarName={c.contactName}
            avatarFallback={c.phoneNumber}
            title={name}
            subtitle={c.contactCompany || c.phoneNumber || undefined}
            meta={formatTime(c.scheduledAt)}
            status={
              <StatusPill
                label={c.status === 'due' ? 'Due now' : formatRelativeFromNow(c.scheduledAt)}
                tone={c.status === 'due' ? 'warning' : 'neutral'}
              />
            }
            trailing={
              <CallButton phoneNumber={c.phoneNumber} variant="inline" />
            }
            onPress={() => router.push(`/callback/${c.id}` as never)}
          />
        );
      }
      if (item.kind === 'meeting') {
        const m = item.item;
        return (
          <ActionRow
            avatarName={m.contactName}
            avatarFallback={m.title}
            title={m.title || (m.contactName ? `Meeting with ${m.contactName}` : 'Meeting')}
            subtitle={m.contactCompany || m.contactName || undefined}
            meta={formatTime(m.scheduledAt)}
            status={
              <StatusPill
                label={formatRelativeFromNow(m.scheduledAt)}
                tone="meeting"
              />
            }
            trailing={
              m.meetingUrl ? (
                <CallButton
                  phoneNumber="open"
                  variant="inline"
                  onPress={async () => {
                    try {
                      await Linking.openURL(m.meetingUrl!);
                    } catch {
                      Alert.alert('Could not open meeting link');
                    }
                  }}
                />
              ) : undefined
            }
            onPress={() => router.push(`/meeting/${m.id}` as never)}
          />
        );
      }
      if (item.kind === 'missed') {
        const c = item.item;
        const name = c.contactName || c.phoneNumber || c.fromNumber;
        return (
          <ActionRow
            avatarName={c.contactName}
            avatarFallback={c.phoneNumber || c.fromNumber}
            title={name || 'Unknown'}
            subtitle={c.contactCompany || c.phoneNumber || c.fromNumber}
            meta={formatRelativeFromNow(c.startedAt)}
            status={<StatusPill label="Missed" tone="danger" />}
            trailing={
              <CallButton
                phoneNumber={c.phoneNumber || c.fromNumber}
                variant="inline"
              />
            }
            onPress={() => router.push(`/call/${c.id}` as never)}
          />
        );
      }
      const r = item.item;
      return (
        <ActionRow
          avatarFallback={r.title || r.subjectType}
          title={r.title || 'Reminder'}
          subtitle={r.subjectType}
          meta={formatTime(r.fireAt)}
          status={
            <StatusPill
              label={formatRelativeFromNow(r.fireAt)}
              tone={r.status === 'pending' ? 'warning' : 'neutral'}
            />
          }
        />
      );
    },
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: 'Today' }} />

      {today.loading && !today.data ? (
        <LoadingState />
      ) : today.error && !today.data ? (
        <ErrorState message={today.error} onRetry={today.reload} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, idx) =>
            `${item.kind}-${(item as { item: { id: string } }).item.id}-${idx}`
          }
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} count={section.count} />
          )}
          ItemSeparatorComponent={RowSeparator}
          stickySectionHeadersEnabled={false}
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={
            today.data ? (
              <View style={{ marginTop: 4 }}>
                <Text
                  style={{
                    color: t.textMuted,
                    fontSize: 14,
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                  }}
                >
                  {subtitle}
                </Text>
                <SummaryCard
                  items={[
                    {
                      label: 'Callbacks',
                      value: today.data.summary.callbacks,
                    },
                    {
                      label: 'Meetings',
                      value: today.data.summary.meetings,
                    },
                    {
                      label: 'Missed',
                      value: today.data.summary.missedCalls,
                      tint: today.data.summary.missedCalls > 0 ? t.missed : undefined,
                    },
                  ]}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="check-circle"
              title="You're clear for today"
              message="No callbacks, meetings, or missed calls need your attention."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={today.refreshing}
              onRefresh={today.refresh}
              tintColor={t.text}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          style={{ backgroundColor: t.background }}
        />
      )}
    </View>
  );
}
