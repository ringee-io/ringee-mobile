import { api } from './client';
import type { TodayPayload } from './types';

// Mobile-specific aggregated endpoint. Returns callbacks + meetings + missed
// calls + reminders in one round-trip so Today renders instantly.
// See apps/backend/src/api/routes/mobile.controller.ts.
export function getToday() {
  return api.get<TodayPayload>('/mobile/today');
}
