import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionRow,
  CallButton,
  EmptyState,
  ErrorState,
  KeypadSheet,
  LoadingState,
  RowSeparator,
  ScheduleSheet,
  StatusPill,
} from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { CallsApi } from '@/lib/api';
import type { Call } from '@/lib/api';
import { useInfiniteList } from '@/lib/hooks/useInfiniteList';
import { formatDuration, formatRelativeFromNow } from '@/lib/format';
import { Feather } from '@expo/vector-icons';

type Filter = 'all' | 'missed';

const PAGE_SIZE = 30;

export default function CallsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const [keypadOpen, setKeypadOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'meeting' | 'callback' | null>(null);

  const fetcher = useCallback(
    ({ page, limit }: { page: number; limit: number }) =>
      CallsApi.listRecentCalls({
        page,
        limit,
        missedOnly: filter === 'missed',
      }),
    [filter],
  );

  const calls = useInfiniteList<Call>(fetcher, [filter], {
    pageSize: PAGE_SIZE,
    getId: (c) => c.id,
  });

  const header = (
    <View style={{ backgroundColor: t.background }}>
      {/* Quick actions — WhatsApp-style circle row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 18,
          gap: 22,
        }}
      >
        <QuickAction
          icon="calendar"
          label="Schedule"
          onPress={() => setScheduleMode('meeting')}
        />
        <QuickAction
          icon="phone-call"
          label="Callback"
          onPress={() => setScheduleMode('callback')}
        />
        <QuickAction
          icon="grid"
          label="Keypad"
          onPress={() => setKeypadOpen(true)}
        />
        <QuickAction
          icon="users"
          label="Contacts"
          onPress={() => router.push('/contacts' as never)}
        />
      </View>

      {/* Recent header + filter pills */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            color: t.text,
            fontSize: 20,
            fontWeight: '700',
            letterSpacing: -0.3,
          }}
        >
          Recent
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            { id: 'all' as Filter, label: 'All' },
            { id: 'missed' as Filter, label: 'Missed' },
          ].map((opt) => {
            const active = filter === opt.id;
            return (
              <Pressable key={opt.id} onPress={() => setFilter(opt.id)}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? t.text : t.border,
                    backgroundColor: active ? t.text : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color: active ? t.primaryForeground : t.text,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: 'Calls' }} />

      {calls.loading && calls.items.length === 0 ? (
        <LoadingState />
      ) : calls.error && calls.items.length === 0 ? (
        <ErrorState message={calls.error} onRetry={calls.reload} />
      ) : (
        <FlatList<Call>
          data={calls.items}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={header}
          ItemSeparatorComponent={RowSeparator}
          renderItem={({ item }) => {
            const name =
              item.contactName ||
              item.phoneNumber ||
              (['outgoing', 'outbound'].includes(item.direction || '') ? item.fromNumber : item.toNumber);
            const inbound = item.direction === 'inbound';
            const isMissed =
              item.missed === true ||
              (inbound && !item.answeredAt && item.status !== 'answered');
            return (
              <ActionRow
                avatarName={item.contactName}
                avatarFallback={item.phoneNumber || item.fromNumber}
                title={name || 'Unknown'}
                subtitle={
                  item.contactCompany ||
                  item.phoneNumber ||
                  (inbound ? item.fromNumber : item.toNumber)
                }
                meta={formatRelativeFromNow(item.startedAt)}
                status={
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Feather
                      name={
                        isMissed
                          ? 'phone-missed'
                          : inbound
                            ? 'phone-incoming'
                            : 'phone-outgoing'
                      }
                      size={12}
                      color={isMissed ? t.missed : t.textMuted}
                    />
                    {item.outcome ? (
                      <StatusPill label={prettyOutcome(item.outcome)} />
                    ) : null}
                    {item.hasRecording ? (
                      <StatusPill label="Rec" tone="info" />
                    ) : null}
                    {item.durationSeconds ? (
                      <Text style={{ color: t.textMuted, fontSize: 12 }}>
                        {formatDuration(item.durationSeconds)}
                      </Text>
                    ) : null}
                  </View>
                }
                trailing={
                  <CallButton
                    phoneNumber={
                      item.phoneNumber ||
                      (inbound ? item.fromNumber : item.toNumber)
                    }
                    variant="inline"
                  />
                }
                onPress={() => router.push(`/call/${item.id}` as never)}
              />
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="phone"
              title="No calls yet"
              message="When you make or receive a call, it'll show up here."
            />
          }
          ListFooterComponent={
            calls.loadingMore ? <LoadingState inline /> : null
          }
          onEndReached={calls.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={calls.refreshing}
              onRefresh={calls.refresh}
              tintColor={t.text}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          contentInsetAdjustmentBehavior="automatic"
        />
      )}

      <KeypadSheet visible={keypadOpen} onClose={() => setKeypadOpen(false)} />
      <ScheduleSheet
        visible={scheduleMode !== null}
        onClose={() => setScheduleMode(null)}
        mode={scheduleMode ?? 'meeting'}
        onCreated={() => calls.refresh()}
      />
    </View>
  );
}

interface QuickActionProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

/**
 * A round icon button with a label below — the WhatsApp Calls header pattern,
 * but tuned for Ringee's monochrome theme.
 */
function QuickAction({ icon, label, onPress }: QuickActionProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={22} color={t.text} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: t.text,
          fontSize: 12,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function prettyOutcome(o: string) {
  return o.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
