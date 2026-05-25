import { api } from './client';
import type {
  Call,
  CallOutcome,
  Paginated,
} from './types';

export function listRecentCalls(params?: {
  page?: number;
  limit?: number;
  missedOnly?: boolean;
}) {
  return api.get<Paginated<Call>>('/mobile/calls', {
    page: params?.page,
    limit: params?.limit,
    missedOnly: params?.missedOnly ? 'true' : undefined,
  });
}

export function getCall(id: string) {
  return api.get<Call>(`/mobile/calls/${id}`);
}

export function setCallOutcome(
  callId: string,
  body: { outcome: CallOutcome; outcomeNote?: string },
) {
  return api.post(`/mobile/calls/${callId}/outcome`, body);
}

export function addCallNote(callId: string, content: string) {
  return api.post(`/mobile/calls/${callId}/notes`, { content });
}
