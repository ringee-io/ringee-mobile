import { api } from './client';

export interface NotificationPreferences {
  callbacks: boolean;
  meetings: boolean;
  missedCalls: boolean;
}

export function getNotificationPreferences() {
  return api.get<NotificationPreferences>('/mobile/preferences/notifications');
}

export function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
) {
  return api.patch<NotificationPreferences>(
    '/mobile/preferences/notifications',
    patch,
  );
}
