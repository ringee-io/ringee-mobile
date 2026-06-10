import { api } from './client';
import type { CallTranscription, TranscriptionSource } from './types';

/**
 * Full transcription view for a call — drives the Final Transcript card in the
 * call detail. Poll while a transcription is in flight. Same endpoint the web
 * client uses.
 */
export function getCallTranscription(callId: string) {
  return api.get<CallTranscription>(`/transcription/calls/${callId}`);
}

/** Transcribe (or re-transcribe) a call from its recording. */
export function transcribeFromRecording(callId: string) {
  return api.post(`/transcription/calls/${callId}/recording`);
}

/** "Try again" for a failed transcription of the given source. */
export function retryTranscription(callId: string, source: TranscriptionSource) {
  return api.post(`/transcription/calls/${callId}/retry`, { source });
}
