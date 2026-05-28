import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { registerPushToken, unregisterPushToken } from '@/lib/api/push';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensurePermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return (
    req.granted ||
    req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function getDeviceToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Ringee',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0A0A0A',
    });
  }

  // Backend posts to Expo's HTTP Push API, which expects an ExponentPushToken
  // — Expo brokers APNs (iOS) and FCM (Android) for us so we don't manage
  // either credential set directly. The projectId pin is required so the
  // token belongs to *this* EAS project even when the binary is a dev client.
  try {
    const projectId = (
      Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
    )?.eas?.projectId;
    const t = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return typeof t.data === 'string' ? t.data : null;
  } catch {
    return null;
  }
}

// Map notification payloads → in-app routes. Backend sends `data.type` plus
// the relevant id (callId, callbackId, contactId, meetingId, etc.) — we
// route to the matching detail screen so a tap lands the user in context.
function routeFromNotificationData(data: Record<string, unknown>) {
  const type = typeof data.type === 'string' ? data.type : null;
  const get = (k: string) => (typeof data[k] === 'string' ? (data[k] as string) : null);

  if (type === 'INCOMING_CALL') {
    const callId = get('callId');
    if (callId) return `/call/${callId}` as const;
  }
  if (type === 'CALLBACK_DUE' || type === 'CALLBACK_REMINDER') {
    const id = get('callbackId') || get('subjectId');
    if (id) return `/callback/${id}` as const;
  }
  if (type === 'MEETING_REMINDER') {
    const id = get('meetingId') || get('subjectId');
    if (id) return `/meeting/${id}` as const;
  }
  if (type === 'CONTACT') {
    const id = get('contactId');
    if (id) return `/contact/${id}` as const;
  }
  return null;
}

export function usePushRegistration() {
  const { isSignedIn, isLoaded } = useAuth();
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    async function run() {
      if (!isSignedIn) {
        const t = lastTokenRef.current;
        if (t) {
          try {
            await unregisterPushToken(t);
          } catch {
            // best effort
          }
          lastTokenRef.current = null;
        }
        return;
      }

      const allowed = await ensurePermissions();
      if (!allowed || cancelled) return;

      const token = await getDeviceToken();
      if (!token || cancelled) return;
      if (lastTokenRef.current === token) return;

      try {
        await registerPushToken(
          token,
          Platform.OS === 'ios' ? 'ios' : 'android',
        );
        lastTokenRef.current = token;
      } catch {
        // backend not ready or transient — try again on next mount
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  // Tap handler: open the relevant detail screen when the user taps a
  // notification. Also handles the cold-start case (`getLastNotificationResp`)
  // for when the app was killed when the notification arrived.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const handle = (resp: Notifications.NotificationResponse) => {
      const data = (resp.notification.request.content.data || {}) as Record<
        string,
        unknown
      >;
      const path = routeFromNotificationData(data);
      if (path) {
        try {
          router.push(path as never);
        } catch {
          // navigation isn't ready yet — Expo Router will catch up on next tick
        }
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (resp) handle(resp);
    });

    return () => sub.remove();
  }, [isLoaded, isSignedIn]);
}
