// Mobile-facing types. Mirror the relevant subset of @ringee/database
// without dragging the whole schema into the mobile app.

export type CallDirection = 'inbound' | 'outbound' | 'outgoing';

export type CallStatus =
  | 'pending'
  | 'ringing'
  | 'answered'
  | 'recording'
  | 'completed'
  | 'failed';

export type CallOutcome =
  | 'meeting_booked'
  | 'sale'
  | 'interested'
  | 'follow_up'
  | 'callback_scheduled'
  | 'not_interested'
  | 'no_answer'
  | 'voicemail'
  | 'wrong_number'
  | 'gatekeeper';

export type CallbackStatus =
  | 'scheduled'
  | 'due'
  | 'in_progress'
  | 'completed'
  | 'missed'
  | 'cancelled';

export type MeetingStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type ReminderStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'cancelled'
  | 'snoozed';

export type ReminderSubjectType = 'callback' | 'meeting' | 'followup';

export interface Contact {
  id: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phoneNumber: string;
  email?: string | null;
  jobTitle?: string | null;
  lastCallAt?: string | null;
}

export interface ContactSummary extends Contact {
  lastOutcome?: CallOutcome | null;
  lastContactedAt?: string | null;
}

export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  createdAt: string;
}

export interface Call {
  id: string;
  contactId?: string | null;
  contactName?: string | null;
  contactCompany?: string | null;
  fromNumber: string;
  toNumber: string;
  phoneNumber?: string; // contact-facing number derived server-side
  direction: CallDirection | null;
  status: CallStatus;
  durationSeconds?: number | null;
  startedAt?: string | null;
  endedAt?: string | null;
  answeredAt?: string | null;
  missed?: boolean;
  outcome?: CallOutcome | null;
  outcomeNote?: string | null;
  hasRecording?: boolean;
  recordingUrl?: string | null;
  hasTranscription?: boolean;
  notes?: { id: string; content: string; createdAt: string }[];
}

// ─── Transcription ──────────────────────────────────────────────────────────
// Mirrors the backend CallTranscriptionView (packages/services transcription),
// same shape the web client consumes.

export type TranscriptionStatus =
  | 'idle'
  | 'starting'
  | 'transcribing'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'unavailable'
  | 'stopped';

export type TranscriptionSource = 'realtime' | 'recording';

export interface TranscriptSegment {
  id: string;
  text: string;
  speaker: number | null;
  track: string | null;
  confidence: number | null;
  startMs: number | null;
  endMs: number | null;
  createdAt: string;
}

export interface Transcription {
  id: string;
  source: TranscriptionSource;
  status: TranscriptionStatus;
  text: string | null;
  language: string | null;
  confidence: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  segments: TranscriptSegment[];
}

export interface CallTranscription {
  callId: string;
  recordingAvailable: boolean;
  transcriptionEnabled: boolean;
  realtime: Transcription | null;
  recording: Transcription | null;
  livePartial: { track: string | null; text: string } | null;
}

/** Statuses that mean "something is in flight" → keep polling. */
export const IN_FLIGHT_TRANSCRIPTION_STATUSES: TranscriptionStatus[] = [
  'starting',
  'transcribing',
  'processing',
];

export interface Callback {
  id: string;
  contactId: string;
  contactName?: string | null;
  contactCompany?: string | null;
  phoneNumber?: string | null;
  scheduledAt: string;
  status: CallbackStatus;
  note?: string | null;
}

export interface Meeting {
  id: string;
  title?: string | null;
  contactId: string;
  contactName?: string | null;
  contactCompany?: string | null;
  scheduledAt: string;
  duration: number;
  location?: string | null;
  notes?: string | null;
  status: MeetingStatus;
  meetingUrl?: string | null;
}

export interface Reminder {
  id: string;
  subjectType: ReminderSubjectType;
  subjectId: string;
  title?: string | null;
  fireAt: string;
  status: ReminderStatus;
}

export interface TodaySummary {
  callbacks: number;
  meetings: number;
  missedCalls: number;
  reminders: number;
}

export interface TodayPayload {
  summary: TodaySummary;
  callbacks: Callback[];
  meetings: Meeting[];
  missedCalls: Call[];
  reminders: Reminder[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
