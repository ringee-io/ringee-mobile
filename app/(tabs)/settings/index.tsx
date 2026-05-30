import { useAuth, useUser, useOrganization } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, OrgSwitcher } from '@/components/ringee';
import { WEB_URL_PRIVACY, WEB_URL_TERMS } from '@/constants/Config';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { PreferencesApi } from '@/lib/api';
import type { NotificationPreferences } from '@/lib/api/preferences';
import { useResource } from '@/lib/hooks/useResource';

async function openInBrowser(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      controlsColor: '#3B82F6',
    });
  } catch {
    // swallow — opening an external page should never crash Settings
  }
}

export default function SettingsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { signOut } = useAuth();

  const prefs = useResource(
    () => PreferencesApi.getNotificationPreferences(),
    [],
  );
  const [saving, setSaving] = useState<keyof NotificationPreferences | null>(
    null,
  );

  const current: NotificationPreferences = prefs.data ?? {
    callbacks: true,
    meetings: true,
    missedCalls: true,
  };

  const togglePref = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      // Optimistic update — the toggle should feel snappy. Roll back on
      // failure so the UI reflects the actual persisted value.
      const previous = prefs.data;
      prefs.setData((p) => ({
        ...(p ?? { callbacks: true, meetings: true, missedCalls: true }),
        [key]: value,
      }));
      setSaving(key);
      try {
        const next = await PreferencesApi.updateNotificationPreferences({
          [key]: value,
        });
        prefs.setData(next);
      } catch {
        if (previous) prefs.setData(previous);
        Alert.alert('Could not save', 'Please try again.');
      } finally {
        setSaving(null);
      }
    },
    [prefs],
  );

  const version = Constants.expoConfig?.version || '1.0.0';
  const email = user?.primaryEmailAddress?.emailAddress;
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || email || '';

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerRight: () => <OrgSwitcher />,
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 12 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.push('/(tabs)/settings/profile' as never)}
          accessibilityRole="button"
          accessibilityLabel="Open profile settings"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              marginHorizontal: 20,
              backgroundColor: t.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: t.border,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Avatar name={displayName || email} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>
                {displayName || 'Signed in'}
              </Text>
              {email ? (
                <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 2 }}>
                  {email}
                </Text>
              ) : null}
              {organization?.name ? (
                <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>
                  {organization.name}
                </Text>
              ) : null}
            </View>
            <Feather name="chevron-right" size={20} color={t.iconMuted} />
          </View>
        </Pressable>

        <SettingsSection title="Notifications">
          <SettingsToggle
            icon="phone-call"
            label="Callback reminders"
            value={current.callbacks}
            onChange={(v) => togglePref('callbacks', v)}
            disabled={prefs.loading || saving !== null}
            busy={saving === 'callbacks'}
          />
          <SettingsToggle
            icon="calendar"
            label="Meeting reminders"
            value={current.meetings}
            onChange={(v) => togglePref('meetings', v)}
            disabled={prefs.loading || saving !== null}
            busy={saving === 'meetings'}
          />
          <SettingsToggle
            icon="phone-missed"
            label="Missed call alerts"
            value={current.missedCalls}
            onChange={(v) => togglePref('missedCalls', v)}
            disabled={prefs.loading || saving !== null}
            busy={saving === 'missedCalls'}
            last
          />
        </SettingsSection>

        {prefs.error ? (
          <Text
            style={{
              color: t.missed,
              fontSize: 12,
              lineHeight: 16,
              paddingHorizontal: 20,
              marginTop: 8,
            }}
          >
            Couldn’t load notification preferences. Pull to retry.
          </Text>
        ) : null}

        <SettingsSection title="Legal">
          <SettingsLinkRow
            icon="shield"
            label="Privacy Policy"
            onPress={() => openInBrowser(WEB_URL_PRIVACY)}
          />
          <SettingsLinkRow
            icon="file-text"
            label="Terms of Use"
            onPress={() => openInBrowser(WEB_URL_TERMS)}
            last
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow icon="info" label="Version" value={version} last />
        </SettingsSection>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Pressable onPress={handleSignOut}>
            <View
              style={{
                paddingVertical: 14,
                alignItems: 'center',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surface,
              }}
            >
              <Text style={{ color: t.missed, fontWeight: '600', fontSize: 15 }}>
                Sign out
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          color: t.textMuted,
          fontSize: 12,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          paddingHorizontal: 20,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          marginHorizontal: 20,
          backgroundColor: t.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: t.border,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function SettingsToggle({
  icon,
  label,
  value,
  onChange,
  last,
  disabled,
  busy,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
        opacity: disabled && !busy ? 0.6 : 1,
      }}
    >
      <Feather name={icon} size={18} color={t.icon} />
      <Text
        style={{
          color: t.text,
          fontSize: 15,
          marginLeft: 12,
          flex: 1,
        }}
      >
        {label}
      </Text>
      {busy ? (
        <ActivityIndicator
          size="small"
          color={t.icon}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Switch value={value} onValueChange={onChange} disabled={disabled} />
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
      }}
    >
      <Feather name={icon} size={18} color={t.icon} />
      <Text style={{ color: t.text, fontSize: 15, marginLeft: 12, flex: 1 }}>
        {label}
      </Text>
      {value ? (
        <Text style={{ color: t.textMuted, fontSize: 14 }}>{value}</Text>
      ) : null}
    </View>
  );
}

function SettingsLinkRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: t.border,
        }}
      >
        <Feather name={icon} size={18} color={t.icon} />
        <Text style={{ color: t.text, fontSize: 15, marginLeft: 12, flex: 1 }}>
          {label}
        </Text>
        <Feather name="external-link" size={16} color={t.iconMuted} />
      </View>
    </Pressable>
  );
}
