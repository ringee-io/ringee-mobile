import { useAuth } from '@clerk/clerk-expo';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionRow,
  CallButton,
  CreditPill,
  EmptyState,
  ErrorState,
  LoadingState,
  OrgSwitcher,
  RowSeparator,
  StatusPill,
} from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { CallsApi } from '@/lib/api';
import type { Call } from '@/lib/api';
import { formatDuration, formatRelativeFromNow } from '@/lib/format';
import { useInfiniteList } from '@/lib/hooks/useInfiniteList';
import { useRefreshSignal } from '@/lib/refreshBus';
import { Feather } from '@expo/vector-icons';

type Filter = 'all' | 'missed';

const PAGE_SIZE = 30;
const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

export default function CallsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const { orgId } = useAuth();

  const fetcher = useCallback(
    ({ page, limit }: { page: number; limit: number }) =>
      CallsApi.listRecentCalls({
        page,
        limit,
        missedOnly: filter === 'missed',
      }),
    [filter],
  );

  const calls = useInfiniteList<Call>(fetcher, [filter, orgId], {
    pageSize: PAGE_SIZE,
    getId: (c) => c.id,
  });

  useRefreshSignal('calls', calls.refresh);

  const header = (
    <View style={{ backgroundColor: t.background }}>
      <View
        style={{
          justifyContent: 'space-between',
          flexDirection: 'row',
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 24,
          // gap: 24,
        }}
      >
        <QuickAction
          icon="calendar"
          label="Schedule"
          onPress={() => router.push('/(tabs)/calls/schedule?mode=meeting' as never)}
        />
        <QuickAction
          icon="phone-call"
          label="Callback"
          onPress={() => router.push('/(tabs)/calls/schedule?mode=callback' as never)}
        />
        <QuickAction
          icon="smartphone"
          label="Key Pad"
          onPress={() => router.push('/(tabs)/calls/keypad' as never)}
        />
        <QuickAction
          icon="users"
          label="Contacts"
          onPress={() => router.push('/contacts' as never)}
        />
      </View>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            color: t.text,
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: -0.4,
          }}
        >
          Recent
        </Text>
        <FilterSegment value={filter} onChange={setFilter} />
      </View>
    </View>
  );

  const showLoading = calls.loading && calls.items.length === 0;
  const showError = !!calls.error && calls.items.length === 0;

  return (
    <>
    <Stack.Screen
      options={{
        headerLeft: () => <CreditPill />,
        headerRight: () => <OrgSwitcher />,
      }}
    />
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
                {item.hasTranscription ? (
                  <Feather name="file-text" size={12} color={t.meeting} />
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
        showLoading ? (
          <LoadingState />
        ) : showError ? (
          <ErrorState message={calls.error!} onRetry={calls.reload} />
        ) : (
          <EmptyState
            icon="phone"
            title="No calls yet"
            message="When you make or receive a call, it'll show up here."
          />
        )
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
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      contentInsetAdjustmentBehavior="automatic"
    />
    </>
  );
}

interface QuickActionProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  const t = useTheme();

  const circle = { width: 56, height: 56, borderRadius: 28 } as const;
  const center = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 8,
        opacity: 1,
      }}
    >
      {LIQUID_GLASS ? (
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={[circle, center, { overflow: 'hidden' }]}
        >
          <Feather name={icon} size={22} color={t.text} />
        </GlassView>
      ) : (
        <View
          style={[
            circle,
            center,
            {
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
            },
          ]}
        >
          <Feather name={icon} size={22} color={t.text} />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={{
          color: t.text,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface FilterSegmentProps {
  value: Filter;
  onChange: (next: Filter) => void;
}

function FilterSegment({ value, onChange }: FilterSegmentProps) {
  const t = useTheme();
  const options: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'missed', label: 'Missed' },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.surface,
        borderRadius: 999,
        padding: 2,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: active ? t.background : 'transparent',
              opacity: 1,
              boxShadow: active ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none',
            }}
          >
            <Text
              style={{
                color: active ? t.text : t.textMuted,
                fontWeight: active ? '600' : '500',
                fontSize: 13,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function prettyOutcome(o: string) {
  return o.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
