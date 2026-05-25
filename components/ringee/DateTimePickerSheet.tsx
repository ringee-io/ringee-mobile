import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

import { BottomSheet } from './BottomSheet';

// Quick presets cover the common SDR follow-up cadence; the custom section below
// lets the user dial in any exact date and time via the native picker.

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (date: Date) => void;
  title?: string;
}

interface Preset {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  build: () => Date;
}

const PRESETS: Preset[] = [
  { label: 'In 15 min', icon: 'clock', build: () => new Date(Date.now() + 15 * 60_000) },
  { label: 'In 1 hour', icon: 'clock', build: () => new Date(Date.now() + 60 * 60_000) },
  { label: 'In 3 hours', icon: 'clock', build: () => new Date(Date.now() + 3 * 60 * 60_000) },
  {
    label: 'Tomorrow 9 AM',
    icon: 'sunrise',
    build: () => atHour(1, 9),
  },
  {
    label: 'Tomorrow 2 PM',
    icon: 'sun',
    build: () => atHour(1, 14),
  },
  {
    label: 'Next week',
    icon: 'calendar',
    build: () => atHour(7, 10),
  },
];

function atHour(addDays: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Next sensible default: top of the next hour. */
function nextHour(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export function DateTimePickerSheet({
  visible,
  onClose,
  onPick,
  title = 'Schedule',
}: Props) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState<Date>(nextHour);
  // Android shows the picker as a dialog; track which field is being edited.
  const [androidField, setAndroidField] = useState<'date' | 'time' | null>(null);

  // Reset the custom value each time the sheet is freshly opened.
  useEffect(() => {
    if (visible) setCustom(nextHour());
  }, [visible]);

  async function apply(date: Date) {
    if (busy) return;
    setBusy(true);
    try {
      await onPick(date);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function onAndroidChange(event: DateTimePickerEvent, selected?: Date) {
    setAndroidField(null);
    if (event.type !== 'set' || !selected) return;
    setCustom((prev) => {
      const next = new Date(prev);
      if (androidField === 'date') {
        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      }
      return next;
    });
  }

  function onIosChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setCustom(selected);
  }

  const isIOS = Platform.OS === 'ios';

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} maxHeight="90%">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <SectionLabel>Quick options</SectionLabel>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 22,
          }}
        >
          {PRESETS.map((p) => (
            <Pressable
              key={p.label}
              disabled={busy}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                apply(p.build());
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderCurve: 'continuous',
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                opacity: pressed ? 0.6 : 1,
                // Two roughly-even columns.
                flexGrow: 1,
                flexBasis: '44%',
              })}
            >
              <Feather name={p.icon} size={15} color={t.icon} />
              <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionLabel>Custom date &amp; time</SectionLabel>
        {isIOS ? (
          <View style={{ gap: 10, marginBottom: 18 }}>
            <CustomRow icon="calendar" label="Date">
              <DateTimePicker
                value={custom}
                mode="date"
                display="compact"
                minimumDate={new Date()}
                onChange={onIosChange}
                accentColor={t.tint}
              />
            </CustomRow>
            <CustomRow icon="clock" label="Time">
              <DateTimePicker
                value={custom}
                mode="time"
                display="compact"
                minuteInterval={5}
                onChange={onIosChange}
                accentColor={t.tint}
              />
            </CustomRow>
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 18 }}>
            <AndroidField
              icon="calendar"
              label="Date"
              value={custom.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              onPress={() => setAndroidField('date')}
            />
            <AndroidField
              icon="clock"
              label="Time"
              value={custom.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
              onPress={() => setAndroidField('time')}
            />
            {androidField ? (
              <DateTimePicker
                value={custom}
                mode={androidField}
                display="default"
                minimumDate={androidField === 'date' ? new Date() : undefined}
                minuteInterval={5}
                onChange={onAndroidChange}
              />
            ) : null}
          </View>
        )}

        <Pressable
          disabled={busy}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            apply(custom);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: t.primary,
            opacity: busy ? 0.5 : pressed ? 0.85 : 1,
          })}
        >
          <Feather name="check" size={18} color={t.primaryForeground} />
          <Text
            style={{ color: t.primaryForeground, fontSize: 16, fontWeight: '700' }}
          >
            Set {custom.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {' · '}
            {custom.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </Pressable>
      </ScrollView>
    </BottomSheet>
  );
}

function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: t.textMuted,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function CustomRow({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <Feather name={icon} size={16} color={t.icon} />
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '600', marginLeft: 10, flex: 1 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function AndroidField({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Feather name={icon} size={16} color={t.icon} />
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '600', marginLeft: 10, flex: 1 }}>
        {label}
      </Text>
      <Text style={{ color: t.textMuted, fontSize: 15, fontWeight: '600' }}>{value}</Text>
    </Pressable>
  );
}
