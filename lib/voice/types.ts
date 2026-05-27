// Shape the backend voice/session endpoint should return when native VoIP
// is integrated. Kept here so the mobile UI can be typed against it ahead
// of the backend work landing. See lib/voice/README.md.

export interface VoiceSession {
  userId: string;
  organizationId: string | null;
  ringeeNumberId: string;
  callerId: string;
  token: string;
  sipUsername?: string;
  expiresAt: string;
}

export type CallStateName =
  | 'idle'
  | 'connecting'
  | 'ringing'
  | 'active'
  | 'held'
  | 'ended'
  | 'failed';

export type SipHeader = { name: string; value: string };

export interface CallerOption {
  value: string;
  label: string;
  sub: string;
}

export interface ActiveCall {
  id: string;
  destination: string;
  callerId: string | null;
  direction: 'outbound' | 'inbound';
  state: CallStateName;
  startedAt: number;
  answeredAt: number | null;
  endedAt: number | null;
  muted: boolean;
  onHold: boolean;
  recording: boolean;
  recordingId: string | null;
  /** Loudspeaker output toggled by the user; earpiece is the default. */
  speakerOn: boolean;
  errorMessage?: string | null;
}
