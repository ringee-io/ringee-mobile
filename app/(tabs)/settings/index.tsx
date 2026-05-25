import { useAuth, useUser, useOrganization } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

export default function SettingsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { signOut } = useAuth();

  const [notifyCallbacks, setNotifyCallbacks] = useState(true);
  const [notifyMeetings, setNotifyMeetings] = useState(true);
  const [notifyMissed, setNotifyMissed] = useState(true);

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
      <Stack.Screen options={{ title: 'Settings' }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 12 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
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
        </View>

        <SettingsSection title="Notifications">
          <SettingsToggle
            icon="phone-call"
            label="Callback reminders"
            value={notifyCallbacks}
            onChange={setNotifyCallbacks}
          />
          <SettingsToggle
            icon="calendar"
            label="Meeting reminders"
            value={notifyMeetings}
            onChange={setNotifyMeetings}
          />
          <SettingsToggle
            icon="phone-missed"
            label="Missed call alerts"
            value={notifyMissed}
            onChange={setNotifyMissed}
            last
          />
        </SettingsSection>

        <Text
          style={{
            color: t.textMuted,
            fontSize: 12,
            lineHeight: 16,
            paddingHorizontal: 20,
            marginTop: 8,
          }}
        >
          Push notifications require backend configuration. These preferences are stored locally for now.
        </Text>

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
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
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
      <Switch value={value} onValueChange={onChange} />
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
