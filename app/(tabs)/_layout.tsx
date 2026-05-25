import { Redirect, withLayoutContext } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationEventMap,
  NativeBottomTabNavigationOptions,
} from '@bottom-tabs/react-navigation';
import type { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

const { Navigator } = createNativeBottomTabNavigator();

const NativeTabs = withLayoutContext<
  NativeBottomTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  NativeBottomTabNavigationEventMap
>(Navigator);

const ANDROID_ICON = require('../../assets/images/android-chrome-192x192.png');

function icon(sfSymbol: string) {
  return () =>
    Platform.OS === 'ios'
      ? ({ sfSymbol } as { sfSymbol: string })
      : ANDROID_ICON;
}

export default function TabLayout() {
  const t = useTheme();
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && !isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <NativeTabs
      tabBarActiveTintColor={t.tabIconSelected}
      tabBarInactiveTintColor={t.tabIconDefault}
      // ignoresTopSafeArea
    >
      <NativeTabs.Screen
        name="today"
        options={{ title: 'Today', tabBarIcon: icon('sun.max.fill') }}
      />
      <NativeTabs.Screen
        name="calls"
        options={{ title: 'Calls', tabBarIcon: icon('phone.fill') }}
      />
      <NativeTabs.Screen
        name="dialer"
        options={{
          title: 'Dialer',
          tabBarIcon: icon('circle.grid.3x3.fill'),
        }}
      />
      <NativeTabs.Screen
        name="contacts"
        options={{ title: 'Contacts', tabBarIcon: icon('person.2.fill') }}
      />
      <NativeTabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: icon('gearshape.fill') }}
      />
    </NativeTabs>
  );
}
