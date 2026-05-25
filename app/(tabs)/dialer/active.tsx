import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Keypad } from '@/components/ringee';
import { useTheme } from '@/hooks/useTheme';
import { detectCountry, flagEmoji, parseNumber } from '@/lib/phone';
import { useVoice } from '@/lib/voice';
import { Feather } from '@expo/vector-icons';

const STATE_LABEL: Record<string, string> = {
  connecting: 'Calling…',
  ringing: 'Ringing…',
  active: 'In call',
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

  // Auto-dismiss once the call clears.
  useEffect(() => {
    if (!call) {
      const id = setTimeout(() => router.back(), 250);
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
  const timer = isLive ? formatElapsed(elapsed) : null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.background,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
      }}
    >
      {/* Top bar: minimize back to the app while staying on the call. */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Minimize call"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Feather name="chevron-down" size={22} color={t.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      {/* Caller identity */}
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <View
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          {display.flag ? (
            <Text style={{ fontSize: 44 }}>{display.flag}</Text>
          ) : (
            <Feather name="user" size={42} color={t.textMuted} />
          )}
        </View>

        {/* Status + recording chip */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 18 }}>
          <Text
            style={{
              color: t.textMuted,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            {statusLabel}
          </Text>
          {call.recording ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: t.missed,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
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
            fontSize: 32,
            fontWeight: '600',
            letterSpacing: 0.3,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          {display.line}
        </Text>

        {call.callerId ? (
          <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }}>
            from {call.callerId}
          </Text>
        ) : null}

        {/* Timer slot is reserved so the layout doesn't jump when it appears. */}
        <Text
          style={{
            color: t.text,
            fontSize: 18,
            fontWeight: '500',
            marginTop: 16,
            height: 22,
            fontVariant: ['tabular-nums'],
          }}
        >
          {timer ?? ''}
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {showKeypad ? (
        <View style={{ marginBottom: 28 }}>
          <Keypad size={64} onKey={(d) => voice.sendDtmf(d)} onLongZero={() => voice.sendDtmf('+')} />
          <Pressable
            onPress={() => setShowKeypad(false)}
            hitSlop={10}
            style={{ alignSelf: 'center', marginTop: 20 }}
            accessibilityRole="button"
            accessibilityLabel="Hide keypad"
          >
            <Text style={{ color: t.textMuted, fontWeight: '600', fontSize: 15 }}>Hide</Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 40,
          }}
        >
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
            icon={call.onHold ? 'play' : 'pause'}
            label={call.onHold ? 'Resume' : 'Hold'}
            active={call.onHold}
            onPress={voice.toggleHold}
            disabled={!isLive}
          />
          <ControlButton
            icon={call.recording ? 'stop-circle' : 'circle'}
            label={call.recording ? 'Stop' : 'Record'}
            active={call.recording}
            activeColor={t.missed}
            onPress={() => {
              voice.toggleRecording();
            }}
            disabled={!isLive}
          />
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
            backgroundColor: t.missed,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          })}
        >
          <Feather
            name="phone-off"
            size={28}
            color="#fff"
            style={Platform.OS === 'ios' ? { transform: [{ rotate: '135deg' }] } : undefined}
          />
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
  /** Color used as background when `active` (defaults to t.text). */
  activeColor?: string;
  disabled?: boolean;
}

function ControlButton({ icon, label, onPress, active, activeColor, disabled }: ControlProps) {
  const t = useTheme();
  const bg = active ? (activeColor ?? t.text) : t.surface;
  // Colored accents (e.g. record red) read best with white; the neutral
  // active state inverts against the foreground token.
  const fg = active ? (activeColor ? '#fff' : t.primaryForeground) : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: active ? 'transparent' : t.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={22} color={fg} />
      </View>
      <Text style={{ marginTop: 10, color: t.textMuted, fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}:${String(sec).padStart(2, '0')}`;
  const h = Math.floor(m / 60);
  return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
