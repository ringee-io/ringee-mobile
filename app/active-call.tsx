import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Keypad } from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { detectCountry, digitsOnly, flagEmoji, parseNumber } from '@/lib/phone';
import { useVoice } from '@/lib/voice';
import { ContactsApi, type ContactSummary } from '@/lib/api';
import { Feather } from '@expo/vector-icons';

const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

const STATE_LABEL: Record<string, string> = {
  connecting: 'Calling…',
  ringing: 'Ringing…',
  active: 'Connected',
  held: 'On hold',
  ended: 'Call ended',
  failed: 'Call failed',
  idle: 'Idle',
};

export default function ActiveCallScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const voice = useVoice();
  const call = voice.activeCall;

  const [showKeypad, setShowKeypad] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [contact, setContact] = useState<ContactSummary | null>(null);

  // Resolve contact name from the destination once per call.
  useEffect(() => {
    if (!call) return;
    const digits = digitsOnly(call.destination);
    if (digits.length < 4) {
      setContact(null);
      return;
    }
    let active = true;
    ContactsApi.searchContactsByPhone(digits, 1)
      .then((res) => {
        if (active) setContact(res.data?.[0] ?? null);
      })
      .catch(() => {
        if (active) setContact(null);
      });
    return () => {
      active = false;
    };
  }, [call?.destination]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!call?.answeredAt || call.state !== 'active') {
      setElapsed(0);
      return;
    }
    const t0 = call.answeredAt;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - t0) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [call?.answeredAt, call?.state]);

  // Pretty form of the dialed number for the header.
  const display = useMemo(() => {
    if (!call) return { line: '', flag: '' };
    const parsed = parseNumber(call.destination, detectCountry(call.destination));
    return {
      line: parsed.country ? `+${parsed.country.dialCode} ${parsed.formatted}` : call.destination,
      flag: parsed.country ? flagEmoji(parsed.country.iso2) : '',
    };
  }, [call]);

  useEffect(() => {
    if (!call) {
      const id = setTimeout(() => {
        if (router.canGoBack()) router.back();
      }, 250);
      return () => clearTimeout(id);
    }
  }, [call, router]);

  if (!call) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: t.textMuted }}>No active call</Text>
      </View>
    );
  }

  const statusLabel = STATE_LABEL[call.state] || call.state;
  const isLive = call.state === 'active' || call.state === 'held';
  const recordingReady = Boolean(call.telnyxSessionId);
  const timer = isLive ? formatElapsed(elapsed) : null;
  const displayName = contact?.name?.trim() || null;
  const headline = displayName || display.line || call.destination;
  const subline = displayName ? display.line : call.callerId ? `from ${call.callerId}` : '';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.background,
        paddingTop: insets.top + 4,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 44,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Minimize call"
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Feather name="chevron-down" size={20} color={t.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <StatusBadge
            label={statusLabel}
            tone={call.state === 'active' ? 'call' : call.state === 'failed' ? 'missed' : 'muted'}
            t={t}
          />
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Identity */}
      <View style={{ alignItems: 'center', marginTop: 36 }}>
        <View style={{ position: 'relative' }}>
          <Avatar
            name={displayName ?? undefined}
            fallback={call.destination}
            size={120}
          />
          {display.flag ? (
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.background,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: t.background,
              }}
            >
              <Text style={{ fontSize: 22 }}>{display.flag}</Text>
            </View>
          ) : null}
          {call.recording ? (
            <View
              style={{
                position: 'absolute',
                top: -4,
                left: -4,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: t.missed,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: '#fff' }} />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                REC
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: t.text,
            fontSize: 28,
            fontWeight: '700',
            letterSpacing: -0.4,
            marginTop: 22,
            textAlign: 'center',
            maxWidth: '100%',
          }}
        >
          {headline}
        </Text>

        {subline ? (
          <Text
            style={{
              color: t.textMuted,
              fontSize: 14,
              marginTop: 4,
              fontVariant: ['tabular-nums'],
            }}
            numberOfLines={1}
          >
            {subline}
          </Text>
        ) : null}

        {/* Timer */}
        <View style={{ height: 26, marginTop: 14, justifyContent: 'center' }}>
          {timer ? (
            <Text
              style={{
                color: t.text,
                fontSize: 22,
                fontWeight: '500',
                fontVariant: ['tabular-nums'],
                letterSpacing: 0.5,
              }}
            >
              {timer}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {showKeypad ? (
        <View style={{ marginBottom: 28 }}>
          <Keypad size={64} onKey={(d) => voice.sendDtmf(d)} onLongZero={() => voice.sendDtmf('+')} />
          <Pressable
            onPress={() => setShowKeypad(false)}
            hitSlop={10}
            style={{ alignSelf: 'center', marginTop: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Hide keypad"
          >
            <Text style={{ color: t.textMuted, fontWeight: '600', fontSize: 15 }}>Hide</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ marginBottom: 36 }}>
          <View style={{ flexDirection: 'row', marginBottom: 26 }}>
            <ControlButton
              icon={call.muted ? 'mic-off' : 'mic'}
              label={call.muted ? 'Unmute' : 'Mute'}
              active={call.muted}
              onPress={voice.toggleMute}
              disabled={!isLive}
            />
            <ControlButton
              icon="grid"
              label="Keypad"
              onPress={() => setShowKeypad(true)}
              disabled={!isLive}
            />
            <ControlButton
              icon="volume-2"
              label="Speaker"
              active={call.speakerOn}
              onPress={voice.toggleSpeaker}
              disabled={!isLive}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <ControlButton
              icon={call.recording ? 'stop-circle' : 'circle'}
              label={
                !recordingReady && !call.recording
                  ? 'Connecting…'
                  : call.recording
                    ? 'Stop'
                    : 'Record'
              }
              active={call.recording}
              activeColor={t.missed}
              loading={!recordingReady && !call.recording && isLive}
              onPress={voice.toggleRecording}
              disabled={!isLive || (!recordingReady && !call.recording)}
            />
            <ControlButton
              icon={call.onHold ? 'play' : 'pause'}
              label={call.onHold ? 'Resume' : 'Hold'}
              active={call.onHold}
              onPress={voice.toggleHold}
              disabled={!isLive}
            />
            <ControlButton
              icon="user-plus"
              label="Add"
              onPress={() => {}}
              disabled
            />
          </View>
        </View>
      )}

      {/* Hangup */}
      <View style={{ alignItems: 'center' }}>
        <Pressable
          onPress={async () => {
            await voice.hangup();
          }}
          accessibilityRole="button"
          accessibilityLabel="End call"
          style={({ pressed }) => ({
            width: 76,
            height: 76,
            borderRadius: 38,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {LIQUID_GLASS ? (
            <GlassView
              glassEffectStyle="regular"
              isInteractive
              tintColor={t.missed}
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Feather
                name="phone-off"
                size={28}
                color="#fff"
                style={Platform.OS === 'ios' ? { transform: [{ rotate: '135deg' }] } : undefined}
              />
            </GlassView>
          ) : (
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: t.missed,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}
            >
              <Feather
                name="phone-off"
                size={28}
                color="#fff"
                style={Platform.OS === 'ios' ? { transform: [{ rotate: '135deg' }] } : undefined}
              />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

interface ControlProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  activeColor?: string;
  disabled?: boolean;
  loading?: boolean;
}

function ControlButton({
  icon,
  label,
  onPress,
  active,
  activeColor,
  disabled,
  loading,
}: ControlProps) {
  const t = useTheme();
  const bg = active ? (activeColor ?? t.text) : t.surface;
  const fg = active ? (activeColor ? '#fff' : t.primaryForeground) : t.text;
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: active ? 'transparent' : t.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
        })}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <Feather name={icon} size={22} color={fg} />
        )}
      </Pressable>
      <Text
        numberOfLines={1}
        style={{ marginTop: 8, color: t.textMuted, fontSize: 12, fontWeight: '600' }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatusBadge({
  label,
  tone,
  t,
}: {
  label: string;
  tone: 'call' | 'missed' | 'muted';
  t: ReturnType<typeof useTheme>;
}) {
  const color = tone === 'call' ? t.call : tone === 'missed' ? t.missed : t.textMuted;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: color }} />
      <Text
        style={{
          color: t.text,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}:${String(sec).padStart(2, '0')}`;
  const h = Math.floor(m / 60);
  return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
