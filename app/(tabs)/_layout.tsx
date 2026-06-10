import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAuth } from '@clerk/clerk-expo';

import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const t = useTheme();
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && !isSignedIn) {
    return <Redirect href="/" />;
  }

  // Native tabs render a real UITabBar on iOS (SF Symbols) and a Material 3
  // bottom navigation on Android (Material Symbols via the `md` prop) — each tab
  // now gets its own icon instead of the repeated logo PNG the old library used.
  return (
    <NativeTabs
      tintColor={t.tabIconSelected}
      backgroundColor={t.background}
    >
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Icon sf="sun.max.fill" md="wb_sunny" />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calls">
        <NativeTabs.Trigger.Icon sf="phone.fill" md="call" />
        <NativeTabs.Trigger.Label>Calls</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dialer">
        <NativeTabs.Trigger.Icon sf="circle.grid.3x3.fill" md="dialpad" />
        <NativeTabs.Trigger.Label>Dialer</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="contacts">
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
        <NativeTabs.Trigger.Label>Contacts</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
