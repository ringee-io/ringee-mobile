import { api } from './client';

// TODO: wire up once backend push module is ready. Endpoints are stubbed here
// so screens can call them safely; the backend should accept and store the
// device token against the authenticated user/org.
export function registerPushToken(token: string, platform: 'ios' | 'android') {
  return api.post('/mobile/push/register', { token, platform });
}

export function unregisterPushToken(token: string) {
  return api.delete('/mobile/push/unregister', { token });
}
