import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

interface Props {
  visible: boolean;
  title?: string;
  placeholder?: string;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void> | void;
}

export function NoteModal({
  visible,
  title = 'Add note',
  placeholder = 'What happened on this call?',
  onClose,
  onSubmit,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  function reset() {
    setContent('');
    setBusy(false);
  }

  async function handleSave() {
    const value = content.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      await onSubmit(value);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      reset();
      onClose();
    } catch {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setBusy(false);
    }
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
            {title}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!content.trim() || busy}
            hitSlop={10}
          >
            <Text
              style={{
                color: !content.trim() || busy ? t.textMuted : t.accent,
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
          <View style={{ padding: 16, flex: 1 }}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={placeholder}
              placeholderTextColor={t.textMuted}
              multiline
              autoFocus
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surface,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: t.text,
                fontSize: 16,
                textAlignVertical: 'top',
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
