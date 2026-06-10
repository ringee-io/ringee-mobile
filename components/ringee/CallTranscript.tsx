import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { TranscriptionApi } from '@/lib/api';
import {
  IN_FLIGHT_TRANSCRIPTION_STATUSES,
  type CallTranscription,
  type Transcription,
  type TranscriptionSource,
} from '@/lib/api';

import { ActionButton } from './ActionButton';
import { NativeCard } from './NativeCard';
import { StatusPill } from './StatusPill';

interface Props {
  callId: string;
}

/**
 * Final Transcript card for the call detail. Loads the call's transcription
 * view, polls while a transcription is in flight, and renders the completed
 * transcript (with speaker labels), processing/failed states, and the
 * "Transcribe" action when a recording exists but hasn't been transcribed yet.
 * Mirrors the web `FinalTranscript`.
 */
export function CallTranscript({ callId }: Props) {
  const t = useTheme();
  const [data, setData] = useState<CallTranscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    try {
      const view = await TranscriptionApi.getCallTranscription(callId);
      setData(view);
      return view;
    } catch {
      setData(null);
      return null;
    }
  }, [callId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void refetch().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refetch]);

  // Poll while any transcription is in flight.
  useEffect(() => {
    const inFlight = data
      ? [data.realtime?.status, data.recording?.status].some(
          (s) => s && IN_FLIGHT_TRANSCRIPTION_STATUSES.includes(s),
        ) || !!data.livePartial
      : false;
    if (!inFlight) return;
    timer.current = setTimeout(() => void refetch(), 2000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, refetch]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>) => {
      setPending(true);
      try {
        await fn();
        await refetch();
      } catch {
        Alert.alert('Transcription failed', 'Please try again.');
      } finally {
        setPending(false);
      }
    },
    [refetch],
  );

  const primary = pickPrimary(data);
  const recordingAvailable = data?.recordingAvailable ?? false;
  const enabled = data?.transcriptionEnabled ?? true;

  const status = primary?.status;
  const inFlight =
    status === 'processing' ||
    status === 'transcribing' ||
    status === 'starting';
  const showRetry = status === 'failed';
  const showTranscribe =
    !inFlight &&
    status !== 'completed' &&
    status !== 'failed' &&
    recordingAvailable &&
    enabled;

  // Nothing to show: no transcript, no recording to transcribe, or disabled.
  if (!loading && !primary && (!recordingAvailable || !enabled)) {
    return null;
  }

  return (
    <NativeCard style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="file-text" size={16} color={t.icon} />
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>
            Transcript
          </Text>
        </View>
        {primary ? (
          <StatusPill
            label={prettyStatus(primary.status)}
            tone={statusTone(primary.status)}
          />
        ) : null}
      </View>

      {loading ? (
        <Loading t={t} label="Loading transcript…" />
      ) : primary?.status === 'completed' ? (
        <TranscriptBody transcript={primary} t={t} />
      ) : primary?.status === 'processing' ||
        primary?.status === 'transcribing' ||
        primary?.status === 'starting' ? (
        <Loading t={t} label="Transcribing…" />
      ) : primary?.status === 'failed' ? (
        <Text style={{ color: t.missed, fontSize: 14, lineHeight: 20 }}>
          {primary.errorMessage || 'Transcription failed.'}
        </Text>
      ) : recordingAvailable && enabled ? (
        <Text style={{ color: t.textMuted, fontSize: 14, lineHeight: 20 }}>
          This call has a recording. Transcribe it to read what was said.
        </Text>
      ) : null}

      {/* Actions */}
      {showRetry ? (
        <ActionButton
          icon="refresh-cw"
          label="Try again"
          disabled={pending}
          onPress={() =>
            void runAction(() =>
              TranscriptionApi.retryTranscription(
                callId,
                primary?.source ?? 'recording',
              ),
            )
          }
        />
      ) : null}

      {showTranscribe ? (
        <ActionButton
          icon="file-text"
          label="Transcribe"
          disabled={pending}
          onPress={() =>
            void runAction(() =>
              TranscriptionApi.transcribeFromRecording(callId),
            )
          }
        />
      ) : null}
    </NativeCard>
  );
}

/** Completed > whichever exists, preferring the recording (post-call) source. */
function pickPrimary(data: CallTranscription | null): Transcription | null {
  if (!data) return null;
  const { realtime, recording } = data;
  if (recording?.status === 'completed') return recording;
  if (realtime?.status === 'completed') return realtime;
  return recording ?? realtime ?? null;
}

function speakerLabel(track: string | null, speaker: number | null): string {
  if (track === 'inbound') return 'You';
  if (track === 'outbound') return 'Contact';
  if (typeof speaker === 'number') return speaker === 0 ? 'Contact' : 'You';
  return 'Speaker';
}

function TranscriptBody({
  transcript,
  t,
}: {
  transcript: Transcription;
  t: ReturnType<typeof useTheme>;
}) {
  if (transcript.segments.length === 0) {
    return (
      <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
        {transcript.text || 'No transcript text available.'}
      </Text>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {transcript.segments.map((s) => (
        <View key={s.id} style={{ gap: 2 }}>
          <Text
            style={{
              color: t.textMuted,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {speakerLabel(s.track, s.speaker)}
          </Text>
          <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
            {s.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Loading({
  t,
  label,
}: {
  t: ReturnType<typeof useTheme>;
  label: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
      }}
    >
      <ActivityIndicator size="small" color={t.textMuted} />
      <Text style={{ color: t.textMuted, fontSize: 14 }}>{label}</Text>
    </View>
  );
}

function prettyStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTone(
  status: string,
): 'success' | 'info' | 'danger' | 'neutral' {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'danger';
  if (
    status === 'processing' ||
    status === 'transcribing' ||
    status === 'starting'
  ) {
    return 'info';
  }
  return 'neutral';
}
