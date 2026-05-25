import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionRow,
  CallButton,
  EmptyState,
  ErrorState,
  LoadingState,
  RowSeparator,
} from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { ContactsApi } from '@/lib/api';
import type { ContactSummary } from '@/lib/api';
import { useInfiniteList } from '@/lib/hooks/useInfiniteList';
import { formatRelativeFromNow } from '@/lib/format';

const PAGE_SIZE = 30;

export default function ContactsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const fetcher = useCallback(
    ({ page, limit }: { page: number; limit: number }) =>
      ContactsApi.listContacts({
        search: debounced || undefined,
        page,
        limit,
      }),
    [debounced],
  );

  const contacts = useInfiniteList<ContactSummary>(fetcher, [debounced], {
    pageSize: PAGE_SIZE,
    getId: (c) => c.id,
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: 'Contacts',
          headerSearchBarOptions: {
            placeholder: 'Search name, company, phone',
            onChangeText: (e) => setSearch(e.nativeEvent.text),
            hideWhenScrolling: false,
          },
        }}
      />

      {contacts.loading && contacts.items.length === 0 ? (
        <LoadingState />
      ) : contacts.error && contacts.items.length === 0 ? (
        <ErrorState message={contacts.error} onRetry={contacts.reload} />
      ) : (
        <FlatList<ContactSummary>
          data={contacts.items}
          keyExtractor={(c) => c.id}
          ItemSeparatorComponent={RowSeparator}
          renderItem={({ item }) => (
            <ActionRow
              avatarName={item.name}
              avatarFallback={item.phoneNumber}
              title={item.name || item.phoneNumber}
              subtitle={item.company || item.phoneNumber}
              meta={
                item.lastContactedAt
                  ? formatRelativeFromNow(item.lastContactedAt)
                  : undefined
              }
              trailing={
                <CallButton phoneNumber={item.phoneNumber} variant="inline" />
              }
              onPress={() => router.push(`/contact/${item.id}` as never)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title={debounced ? 'No matches' : 'No contacts yet'}
              message={
                debounced
                  ? 'Try a different name or number.'
                  : "Contacts you've called or imported in Ringee will appear here."
              }
            />
          }
          ListFooterComponent={
            contacts.loadingMore ? <LoadingState inline /> : null
          }
          onEndReached={contacts.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={contacts.refreshing}
              onRefresh={contacts.refresh}
              tintColor={t.text}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}
