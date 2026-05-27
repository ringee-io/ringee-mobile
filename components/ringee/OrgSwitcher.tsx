import {
  useOrganization,
  useOrganizationList,
  useUser,
} from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { initialsFor } from '@/lib/format';
import { emitRefresh } from '@/lib/refreshBus';

import { BottomSheet } from './BottomSheet';

const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();
const BUTTON_SIZE = 32;
const TAP_TARGET = 44;

type Membership = {
  id: string;
  organization: {
    id: string;
    name: string;
    imageUrl?: string | null;
    hasImage?: boolean;
  };
};

export function OrgSwitcher() {
  const t = useTheme();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { isLoaded, userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true, pageSize: 20 },
  });

  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const memberships = (userMemberships?.data ?? []) as unknown as Membership[];
  const activeOrgId = organization?.id ?? null;

  // Visual identity for the trigger.
  const triggerImage = organization?.imageUrl ?? user?.imageUrl ?? null;
  const triggerInitials = initialsFor(
    organization?.name ?? user?.fullName ?? user?.primaryEmailAddress?.emailAddress,
  );

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setOpen(true);
  };

  const handleSelect = async (orgId: string | null) => {
    if (!setActive) return;
    if (orgId === activeOrgId) {
      setOpen(false);
      return;
    }
    try {
      setSwitching(orgId ?? 'personal');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await setActive({ organization: orgId });
      // Nudge any subscribed lists to reload immediately — the data hooks also
      // re-fetch on orgId change, but emitting covers any screen that only
      // listens to the refresh bus.
      emitRefresh('calls');
      emitRefresh('today');
      emitRefresh('contacts');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setOpen(false);
    } catch {
      // No-op: Clerk surfaces the failure via the resource hooks; keep the
      // sheet open so the user can retry.
    } finally {
      setSwitching(null);
    }
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Switch organization"
        style={({ pressed }) => ({
          width: TAP_TARGET,
          height: TAP_TARGET,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <TriggerAvatar
          imageUrl={triggerImage}
          initials={triggerInitials}
          size={BUTTON_SIZE}
        />
      </Pressable>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Workspaces"
        padded={false}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 460 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        >
          <OrgRow
            label="Personal workspace"
            sublabel={user?.primaryEmailAddress?.emailAddress ?? undefined}
            imageUrl={user?.imageUrl ?? null}
            initials={initialsFor(user?.fullName, user?.primaryEmailAddress?.emailAddress)}
            active={activeOrgId === null}
            loading={switching === 'personal'}
            onPress={() => handleSelect(null)}
          />

          {!isLoaded ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator color={t.text} />
            </View>
          ) : null}

          {memberships.length > 0 ? (
            <>
              <SectionLabel label="Organizations" />
              {memberships.map((m) => (
                <OrgRow
                  key={m.organization.id}
                  label={m.organization.name}
                  imageUrl={m.organization.imageUrl ?? null}
                  initials={initialsFor(m.organization.name)}
                  active={m.organization.id === activeOrgId}
                  loading={switching === m.organization.id}
                  onPress={() => handleSelect(m.organization.id)}
                />
              ))}
            </>
          ) : null}

          {isLoaded && memberships.length === 0 ? (
            <Text
              style={{
                color: t.textMuted,
                fontSize: 13,
                paddingHorizontal: 4,
                paddingVertical: 16,
                textAlign: 'center',
              }}
            >
              You're not in any organizations yet.
            </Text>
          ) : null}

          {userMemberships?.hasNextPage ? (
            <LoadMoreButton
              loading={userMemberships.isFetching ?? false}
              onPress={() => userMemberships.fetchNext?.()}
            />
          ) : null}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

function TriggerAvatar({
  imageUrl,
  initials,
  size,
}: {
  imageUrl: string | null;
  initials: string;
  size: number;
}) {
  const t = useTheme();
  const dims = { width: size, height: size, borderRadius: size / 2 };
  const center = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const fallback = (
    <Text style={{ color: t.text, fontSize: size * 0.4, fontWeight: '600' }}>
      {initials}
    </Text>
  );

  // Image fills the entire circle and sits above the glass surface.
  const image = imageUrl ? (
    <Image
      source={{ uri: imageUrl }}
      style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
    />
  ) : null;

  if (LIQUID_GLASS) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        style={[dims, center, { overflow: 'hidden' }]}
      >
        {image ?? fallback}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        dims,
        center,
        {
          overflow: 'hidden',
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
        },
      ]}
    >
      {image ?? fallback}
    </View>
  );
}

interface OrgRowProps {
  label: string;
  sublabel?: string;
  imageUrl: string | null;
  initials: string;
  active: boolean;
  loading: boolean;
  onPress: () => void;
}

function OrgRow({
  label,
  sublabel,
  imageUrl,
  initials,
  active,
  loading,
  onPress,
}: OrgRowProps) {
  const t = useTheme();
  const size = 36;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${label}`}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 4,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: size, height: size, resizeMode: 'cover' }}
          />
        ) : (
          <Text style={{ color: t.text, fontSize: size * 0.38, fontWeight: '600' }}>
            {initials}
          </Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{ color: t.text, fontSize: 15, fontWeight: '600' }}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            numberOfLines={1}
            style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={t.text} />
      ) : active ? (
        <Feather name="check" size={20} color={t.text} />
      ) : null}
    </Pressable>
  );
}

function SectionLabel({ label }: { label: string }) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: t.textMuted,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingTop: 14,
        paddingBottom: 4,
        paddingHorizontal: 4,
      }}
    >
      {label}
    </Text>
  );
}

function LoadMoreButton({
  loading,
  onPress,
}: {
  loading: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        paddingVertical: 12,
        alignItems: 'center',
        opacity: pressed || loading ? 0.6 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={t.text} />
      ) : (
        <Text style={{ color: t.text, fontSize: 14, fontWeight: '500' }}>
          Load more
        </Text>
      )}
    </Pressable>
  );
}
