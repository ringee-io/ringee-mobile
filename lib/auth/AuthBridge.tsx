import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';

import { registerTokenGetter } from '@/lib/api/client';
import { usePushRegistration } from '@/lib/notifications/usePushRegistration';

// Bridges Clerk's session token into the API client so any module can call
// `api.get(...)` without needing Clerk hooks. Mounted once near the root.
export function AuthBridge() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    registerTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
    return () => registerTokenGetter(null);
  }, [getToken, isSignedIn]);

  usePushRegistration();

  return null;
}
