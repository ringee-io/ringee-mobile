import { useCallback, useEffect, useState } from 'react';

import { TELNYX } from '@/constants/Config';
import { TelephonyApi } from '@/lib/api';

import type { CallerOption } from './types';

const PUBLIC_OPTION: CallerOption = {
  value: TELNYX.callerId,
  label: TELNYX.callerId,
  sub: 'Ringee shared number',
};

/**
 * Loads the outbound numbers the user can dial from (purchased numbers +
 * verified caller IDs), always including the shared Ringee number as a
 * fallback so there is a valid caller ID even before/without the API.
 */
export function useCallerOptions() {
  const [options, setOptions] = useState<CallerOption[]>([PUBLIC_OPTION]);
  const [loading, setLoading] = useState(false);
  const [defaultCallerId, setDefaultCallerId] = useState<string | null>(
    TELNYX.callerId,
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [purchased, callerIds] = await Promise.all([
        TelephonyApi.listPhoneNumbers().catch(() => []),
        TelephonyApi.listCallerIds().catch(() => []),
      ]);

      const merged: CallerOption[] = [
        ...purchased.map((n) => ({
          value: n.phoneNumber,
          label: n.phoneNumber,
          sub: n.connectionName || 'Ringee number',
        })),
        ...callerIds
          .filter((c) => c.status === 'verified')
          .map((c) => ({
            value: c.phoneNumber,
            label: c.phoneNumber,
            sub: c.label || 'Verified caller ID',
          })),
        PUBLIC_OPTION,
      ];

      const seen = new Set<string>();
      const deduped = merged.filter((o) => {
        if (seen.has(o.value)) return false;
        seen.add(o.value);
        return true;
      });

      setOptions(deduped);
      setDefaultCallerId((prev) => prev ?? deduped[0]?.value ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { options, loading, refresh, defaultCallerId, setDefaultCallerId };
}
