import { api } from './client';
import type {
  Call,
  Callback,
  ContactNote,
  ContactSummary,
  Meeting,
  Paginated,
} from './types';

export function listContacts(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return api.get<Paginated<ContactSummary>>('/mobile/contacts', {
    search: params?.search,
    page: params?.page,
    limit: params?.limit,
  });
}

/**
 * Dialer autocomplete — match contacts by the digits typed on the keypad.
 * Backed by `GET /mobile/contacts/search`, which normalizes the query to
 * digits and returns the total match count for the "N more results" row.
 */
export function searchContactsByPhone(query: string, limit = 20) {
  return api.get<{ data: ContactSummary[]; total: number }>(
    '/mobile/contacts/search',
    { q: query, limit },
  );
}

export interface ContactDetail extends ContactSummary {
  recentCalls: Call[];
  notes: ContactNote[];
  upcomingCallback: Callback | null;
  upcomingMeeting: Meeting | null;
}

export function getContact(id: string) {
  return api.get<ContactDetail>(`/mobile/contacts/${id}`);
}

export function addContactNote(contactId: string, content: string) {
  return api.post<ContactNote>(`/mobile/contacts/${contactId}/notes`, {
    content,
  });
}
