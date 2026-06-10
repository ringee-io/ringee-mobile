import { api } from './client';

export interface CreditBalance {
  balance: number;
  freeCallTrial: boolean;
}

export interface RequestCreditPayload {
  amount?: number;
  note?: string;
  email?: string;
  name?: string;
  workspace?: string;
}

/** Current credit balance and whether the free-call trial is still available. */
export function getBalance() {
  return api.get<CreditBalance>('/credits/balance');
}

/**
 * Ask the Ringee team for credit (iOS + Android). The backend emails the team
 * and the user — there is no in-app purchase on either platform.
 */
export function requestCredit(payload: RequestCreditPayload) {
  return api.post<{ success: boolean }>('/credits/request', payload);
}
