import { api } from './client';
import type { Meeting, Paginated } from './types';

// Web `/meetings` returns `{ data, meta }`. Normalize to mobile `Paginated`.
export async function listMeetings(params?: {
  upcoming?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Meeting>> {
  const res = await api.get<{
    data: Meeting[];
    meta?: { total?: number; page?: number; totalPages?: number };
  }>('/meetings', {
    upcoming: params?.upcoming ? 'true' : undefined,
    search: params?.search,
    page: params?.page,
    limit: params?.limit,
  });
  const meta = res.meta || {};
  return {
    data: res.data ?? [],
    total: meta.total ?? (res.data?.length ?? 0),
    page: meta.page ?? params?.page ?? 1,
    totalPages: meta.totalPages ?? 1,
  };
}

export function getMeeting(id: string) {
  return api.get<Meeting>(`/meetings/${id}`);
}

export function createMeeting(body: {
  contactId: string;
  scheduledAt: string; // ISO
  title?: string;
  duration?: number;
  location?: string;
  notes?: string;
  attendeeEmail?: string;
  callId?: string;
}) {
  return api.post<Meeting>('/meetings', body);
}

export function cancelMeeting(id: string) {
  return api.patch<Meeting>(`/meetings/${id}/cancel`);
}
