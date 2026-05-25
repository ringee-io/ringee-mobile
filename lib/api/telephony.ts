import { api } from './client';

export interface PurchasedNumber {
  id: string;
  phoneNumber: string;
  countryCode?: string | null;
  phoneNumberType?: string | null;
  connectionId?: string | null;
  connectionName?: string | null;
  status?: string | null;
}

export interface CallerId {
  id: string;
  phoneNumber: string;
  status: 'pending' | 'verified' | 'failed' | string;
  label?: string | null;
  verifiedAt?: string | null;
}

export interface TelnyxCredentials {
  sipUsername: string;
  sipPassword: string;
  expiresAt?: string | null;
  connectionId?: string | null;
}

export function listPhoneNumbers() {
  return api.get<PurchasedNumber[]>('/telephony/phone-numbers');
}

export function listCallerIds() {
  return api.get<CallerId[]>('/telephony/caller-ids');
}

export function getWebRtcCredentials() {
  return api.get<TelnyxCredentials>('/webrtc/credentials');
}

export interface Recording {
  id: string;
  callId: string;
  status: string;
  url?: string | null;
}

export function startRecording(callSessionId: string) {
  return api.post<Recording>('/telephony/recordings/start', { callSessionId });
}

export function stopRecording(recordingId: string, callSessionId: string) {
  return api.post<Recording>('/telephony/recordings/stop', {
    recordingId,
    callSessionId,
  });
}
