import { ScrollView } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { ContactSummary } from '@/lib/api';

import { BottomSheet } from './BottomSheet';
import { ActionRow } from './ActionRow';
import { formatRelativeFromNow } from '@/lib/format';
import { CallButton } from './CallButton';

interface Props {
  visible: boolean;
  contacts: ContactSummary[];
  onClose: () => void;
  onSelect: (contact: ContactSummary) => void;
}

/**
 * Bottom sheet listing every contact that matched the dialed digits. Tapping a
 * row places the call. Opened from the dialer's "N more results" row.
 */
export function ContactResultsSheet({ visible, contacts, onClose, onSelect }: Props) {
  const t = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`${contacts.length} ${contacts.length === 1 ? 'result' : 'results'}`}
      padded={false}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {contacts.map((item) => (
          <ActionRow
            key={item.id}
            avatarName={item.name}
            avatarFallback={item.phoneNumber}
            title={item.name || item.phoneNumber}
            subtitle={item.company || item.phoneNumber}
            meta={
              item.lastContactedAt
                ? formatRelativeFromNow(item.lastContactedAt)
                : ''
            }
            trailing={
              <CallButton phoneNumber={item.phoneNumber} variant="inline" />
            }
            onPress={() => onSelect(item)}
          />
        ))}
      </ScrollView>
    </BottomSheet>
  );
}
