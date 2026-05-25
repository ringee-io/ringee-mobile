import { api } from './client';
import type { Callback, Paginated } from './types';

// The web `/callbacks` endpoint returns `{ data, meta: { total, page, limit,
// totalPages } }`. Normalize to the mobile `Paginated<T>` shape so screens
// can treat every list endpoint uniformly.
export async function listCallbacks(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Callback>> {
  const res = await api.get<{
    data: Callback[];
    meta?: { total?: number; page?: number; totalPages?: number };
  }>('/callbacks', params);
  const meta = res.meta || {};
  return {
    data: res.data ?? [],
    total: meta.total ?? (res.data?.length ?? 0),
    page: meta.page ?? params?.page ?? 1,
    totalPages: meta.totalPages ?? 1,
  };
}

export function createCallback(body: {
  contactId: string;
  scheduledAt: string; // ISO
  note?: string;
  callId?: string;
}) {
  return api.post<Callback>('/callbacks', body);
}

export function completeCallback(id: string) {
  return api.patch<Callback>(`/callbacks/${id}/complete`);
}

export function rescheduleCallback(id: string, scheduledAt: string) {
  return api.patch<Callback>(`/callbacks/${id}/reschedule`, { scheduledAt });
}

export function cancelCallback(id: string) {
  return api.patch<Callback>(`/callbacks/${id}/cancel`);
}
