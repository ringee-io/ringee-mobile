import { Platform, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder = 'Search', autoFocus }: Props) {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginVertical: 8,
        backgroundColor: t.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <Feather name="search" size={16} color={t.iconMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        clearButtonMode="while-editing"
        returnKeyType="search"
        style={{
          flex: 1,
          marginLeft: 8,
          color: t.text,
          fontSize: 15,
          paddingVertical: Platform.OS === 'ios' ? 0 : 4,
        }}
      />
    </View>
  );
}
