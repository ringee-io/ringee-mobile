import { api } from './client';
import type { Paginated, Reminder } from './types';

export async function listReminders(params?: {
  subjectType?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Reminder>> {
  const res = await api.get<{
    data: Reminder[];
    meta?: { total?: number; page?: number; totalPages?: number };
  }>('/reminders', params);
  const meta = res.meta || {};
  return {
    data: res.data ?? [],
    total: meta.total ?? (res.data?.length ?? 0),
    page: meta.page ?? params?.page ?? 1,
    totalPages: meta.totalPages ?? 1,
  };
}

export function snoozeReminder(id: string, minutes = 10) {
  return api.patch<Reminder>(`/reminders/${id}/snooze`, { minutes });
}
