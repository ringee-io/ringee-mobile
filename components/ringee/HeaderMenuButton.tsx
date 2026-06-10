import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

export interface HeaderMenuItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface Props {
  items: HeaderMenuItem[];
  title?: string;
  message?: string;
}

export function HeaderMenuButton({ items, title, message }: Props) {
  const t = useTheme();

  function open() {
    const visible = items.filter(Boolean);
    if (visible.length === 0) return;

    if (Platform.OS === 'ios') {
      const labels = visible.map((i) => i.label);
      const destructiveIndices = visible
        .map((i, idx) => (i.destructive ? idx : -1))
        .filter((i) => i >= 0);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, 'Cancel'],
          cancelButtonIndex: labels.length,
          destructiveButtonIndex: destructiveIndices.length
            ? destructiveIndices
            : undefined,
          title,
          message,
          userInterfaceStyle: undefined,
        },
        (index) => {
          if (index < labels.length) visible[index].onPress();
        },
      );
      return;
    }

    Alert.alert(
      title ?? 'Options',
      message,
      [
        ...visible.map((i) => ({
          text: i.label,
          style: (i.destructive ? 'destructive' : 'default') as
            | 'destructive'
            | 'default',
          onPress: i.onPress,
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
      { cancelable: true },
    );
  }

  return (
    <Pressable
      onPress={open}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="More options"
      style={[
        { paddingHorizontal: 4, paddingVertical: 4, opacity: 1 },
      ]}
    >
      <Feather name="more-horizontal" size={22} color={t.text} />
    </Pressable>
  );
}
