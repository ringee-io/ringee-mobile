import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'meeting';

interface Props {
  label: string;
  tone?: Tone;
}

export function StatusPill({ label, tone = 'neutral' }: Props) {
  const t = useTheme();

  const tones: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: t.surface, fg: t.textSubtle },
    success: { bg: 'rgba(16,185,129,0.12)', fg: t.call },
    warning: { bg: 'rgba(245,158,11,0.14)', fg: t.warning },
    danger: { bg: 'rgba(239,68,68,0.12)', fg: t.missed },
    info: { bg: 'rgba(59,130,246,0.12)', fg: t.accent },
    meeting: { bg: 'rgba(99,102,241,0.12)', fg: t.meeting },
  };

  const c = tones[tone];

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: c.bg,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: c.fg,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
