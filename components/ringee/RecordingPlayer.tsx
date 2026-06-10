import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { decryptRecordingToFile } from '@/lib/crypto/recording';

import { NativeCard } from './NativeCard';

interface Props {
  recordingUrl: string;
  callId: string;
}

type ExpoAudioModule = {
  setAudioModeAsync: (mode: { playsInSilentMode?: boolean }) => Promise<void>;
  useAudioPlayer: (uri?: string) => {
    play: () => void;
    pause: () => void;
    seekTo: (seconds: number) => Promise<void> | void;
  };
  useAudioPlayerStatus: (player: unknown) => {
    isLoaded: boolean;
    playing: boolean;
    didJustFinish: boolean;
    duration: number;
    currentTime: number;
    isBuffering?: boolean;
  };
};

let expoAudio: ExpoAudioModule | null = null;
try {
  // Avoid crashing the whole screen when running in a binary without ExpoAudio.
  const loaded = require('expo-audio') as Partial<ExpoAudioModule>;
  if (
    typeof loaded?.setAudioModeAsync === 'function' &&
    typeof loaded?.useAudioPlayer === 'function' &&
    typeof loaded?.useAudioPlayerStatus === 'function'
  ) {
    expoAudio = loaded as ExpoAudioModule;
  }
} catch {
  expoAudio = null;
}

/**
 * In-app player for an encrypted call recording. On first play it downloads and
 * decrypts the recording to a local file (see `lib/crypto/recording.ts`), then
 * plays it with `expo-audio` — never leaving the app. Subsequent taps toggle
 * play/pause and the bar is tap-to-seek.
 */
export function RecordingPlayer({ recordingUrl, callId }: Props) {
  if (!expoAudio) {
    return <RecordingPlayerUnavailable />;
  }

  return (
    <RecordingPlayerWithExpoAudio
      recordingUrl={recordingUrl}
      callId={callId}
      audio={expoAudio}
    />
  );
}

function RecordingPlayerWithExpoAudio({
  recordingUrl,
  callId,
  audio,
}: Props & { audio: ExpoAudioModule }) {
  const t = useTheme();
  const [uri, setUri] = useState<string | undefined>(undefined);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const pendingPlay = useRef(false);

  const player = audio.useAudioPlayer(uri);
  const status = audio.useAudioPlayerStatus(player);

  // Recording playback is media, not call audio — play even on silent switch.
  useEffect(() => {
    audio.setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, [audio]);

  // Autoplay once the freshly decrypted source has loaded.
  useEffect(() => {
    if (uri && status.isLoaded && pendingPlay.current) {
      pendingPlay.current = false;
      player.play();
    }
  }, [uri, status.isLoaded, player]);

  const toggle = useCallback(async () => {
    if (decrypting) return;

    if (!uri) {
      setError(false);
      setDecrypting(true);
      try {
        const fileUri = await decryptRecordingToFile(recordingUrl, callId);
        pendingPlay.current = true;
        setUri(fileUri);
      } catch {
        setError(true);
      } finally {
        setDecrypting(false);
      }
      return;
    }

    if (status.playing) {
      player.pause();
      return;
    }
    if (
      status.didJustFinish ||
      (status.duration > 0 && status.currentTime >= status.duration)
    ) {
      await player.seekTo(0);
    }
    player.play();
  }, [decrypting, uri, recordingUrl, callId, status, player]);

  const onBarPress = useCallback(
    (locationX: number) => {
      if (!uri || !status.isLoaded || status.duration <= 0 || barWidth <= 0) {
        return;
      }
      const ratio = Math.max(0, Math.min(1, locationX / barWidth));
      player.seekTo(ratio * status.duration);
    },
    [uri, status.isLoaded, status.duration, barWidth, player],
  );

  const duration = status.duration > 0 ? status.duration : 0;
  const progress = duration > 0 ? status.currentTime / duration : 0;
  const buffering = !!uri && (status.isBuffering || !status.isLoaded);

  return (
    <NativeCard
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
    >
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={
          error
            ? 'Retry loading recording'
            : status.playing
              ? 'Pause recording'
              : 'Play recording'
        }
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: t.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: t.border,
        }}
      >
        {decrypting || buffering ? (
          <ActivityIndicator size="small" color={t.accent} />
        ) : (
          <Feather
            name={error ? 'rotate-ccw' : status.playing ? 'pause' : 'play'}
            size={20}
            color={error ? t.missed : t.accent}
          />
        )}
      </Pressable>

      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>
          {error
            ? "Couldn't load recording"
            : decrypting
              ? 'Decrypting…'
              : 'Call recording'}
        </Text>

        {error ? (
          <Text style={{ color: t.textMuted, fontSize: 12 }}>
            Tap to try again
          </Text>
        ) : uri ? (
          <View style={{ gap: 4 }}>
            <Pressable
              onLayout={(e: LayoutChangeEvent) =>
                setBarWidth(e.nativeEvent.layout.width)
              }
              onPress={(e) => onBarPress(e.nativeEvent.locationX)}
              hitSlop={{ top: 10, bottom: 10 }}
            >
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: t.border,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: t.accent,
                    width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
                  }}
                />
              </View>
            </Pressable>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: t.textMuted, fontSize: 11 }}>
                {fmtTime(status.currentTime)}
              </Text>
              <Text style={{ color: t.textMuted, fontSize: 11 }}>
                {fmtTime(duration)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: t.textMuted, fontSize: 12 }}>
            Tap to play · plays in-app
          </Text>
        )}
      </View>
    </NativeCard>
  );
}

function RecordingPlayerUnavailable() {
  const t = useTheme();

  return (
    <NativeCard style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Feather name="alert-triangle" size={16} color={t.warning} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>
          Recording playback unavailable
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 12 }}>
          Rebuild and reinstall the dev app to include ExpoAudio.
        </Text>
      </View>
    </NativeCard>
  );
}

function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
