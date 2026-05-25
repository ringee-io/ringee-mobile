import { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Optional sheet title rendered in the grabber row. */
  title?: string;
  /** Optional trailing element next to the title (e.g. a "Done" button). */
  headerRight?: ReactNode;
  children: ReactNode;
  /** Caps the sheet height; useful for long scrollable content. */
  maxHeight?: ViewStyle['maxHeight'];
  /** Pad the body horizontally (off for full-bleed lists). Default true. */
  padded?: boolean;
}

/**
 * Shared bottom sheet shell so every sheet in the app shares one look: a dimmed
 * backdrop, rounded top corners, a grabber, an optional title row, and safe-area
 * aware bottom padding. Content is supplied by the caller.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  headerRight,
  children,
  maxHeight,
  padded = true,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderCurve: 'continuous',
            paddingTop: 8,
            paddingBottom: insets.bottom + 12,
            maxHeight: maxHeight ?? '88%',
          }}
        >
          {/* Grabber */}
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 5,
              borderRadius: 999,
              backgroundColor: t.borderStrong,
              marginBottom: title ? 6 : 10,
            }}
          />

          {title ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 6,
                paddingBottom: 12,
                gap: 12,
              }}
            >
              <Text
                style={{
                  color: t.text,
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {title}
              </Text>
              {headerRight}
            </View>
          ) : null}

          <View style={padded ? { paddingHorizontal: 20 } : undefined}>
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
