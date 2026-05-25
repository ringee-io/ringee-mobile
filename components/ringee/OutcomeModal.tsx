import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import type { CallOutcome } from '@/lib/api';
import { Feather } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { outcome: CallOutcome; note?: string }) => Promise<void> | void;
  onPickCallbackTime?: () => void;
}

const OPTIONS: { value: CallOutcome; label: string; icon: keyof typeof Feather.glyphMap; tone?: 'positive' | 'neutral' | 'negative' }[] = [
  { value: 'interested', label: 'Interested', icon: 'thumbs-up', tone: 'positive' },
  { value: 'meeting_booked', label: 'Booked meeting', icon: 'calendar', tone: 'positive' },
  { value: 'callback_scheduled', label: 'Call back later', icon: 'clock', tone: 'neutral' },
  { value: 'follow_up', label: 'Follow up', icon: 'rotate-ccw', tone: 'neutral' },
  { value: 'no_answer', label: 'No answer', icon: 'phone-missed', tone: 'neutral' },
  { value: 'voicemail', label: 'Voicemail', icon: 'mic', tone: 'neutral' },
  { value: 'gatekeeper', label: 'Gatekeeper', icon: 'shield', tone: 'neutral' },
  { value: 'not_interested', label: 'Not interested', icon: 'thumbs-down', tone: 'negative' },
];

export function OutcomeModal({ visible, onClose, onSubmit, onPickCallbackTime }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<CallOutcome | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  function reset() {
    setSelected(null);
    setNote('');
    setBusy(false);
  }

  async function handleSave() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await onSubmit({ outcome: selected, note: note.trim() || undefined });
      reset();
      onClose();
      if (selected === 'callback_scheduled') onPickCallbackTime?.();
    } catch {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setBusy(false);
    }
  }

  function toneColor(tone?: 'positive' | 'neutral' | 'negative') {
    if (tone === 'positive') return t.call;
    if (tone === 'negative') return t.missed;
    return t.textSubtle;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        reset();
        onClose();
      }}
    >
      <View style={{ flex: 1, backgroundColor: t.background }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 8,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          <Pressable
            onPress={() => {
              reset();
              onClose();
            }}
            hitSlop={10}
          >
            <Text style={{ color: t.text, fontSize: 16 }}>Cancel</Text>
          </Pressable>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>
            Call outcome
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!selected || busy}
            hitSlop={10}
          >
            <Text
              style={{
                color: !selected || busy ? t.textMuted : t.accent,
                fontWeight: '600',
                fontSize: 16,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
              {OPTIONS.map((opt) => {
                const active = selected === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                      setSelected(opt.value);
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 14,
                        borderRadius: 12,
                        backgroundColor: active ? t.surface : 'transparent',
                        borderWidth: 1,
                        borderColor: active ? t.text : t.border,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          backgroundColor: t.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Feather
                          name={opt.icon}
                          size={16}
                          color={toneColor(opt.tone)}
                        />
                      </View>
                      <Text
                        style={{
                          color: t.text,
                          fontSize: 16,
                          fontWeight: active ? '600' : '500',
                          flex: 1,
                        }}
                      >
                        {opt.label}
                      </Text>
                      {active ? (
                        <Feather name="check" size={20} color={t.text} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  marginBottom: 8,
                }}
              >
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a short note for context"
                placeholderTextColor={t.textMuted}
                multiline
                style={{
                  minHeight: 80,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: t.text,
                  fontSize: 15,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
