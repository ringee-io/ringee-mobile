import React from 'react';
import {
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

type AuthFormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
} & TextInputProps;

export default function AuthFormInput<T extends FieldValues>({
  control,
  name,
  label,
  style,
  ...props
}: AuthFormInputProps<T>) {
  const t = useTheme();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View>
          {label ? (
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
              {label}
            </Text>
          ) : null}
          <TextInput
            {...props}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={t.textMuted}
            style={[
              {
                height: 52,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: error ? t.missed : t.border,
                backgroundColor: t.surface,
                color: t.text,
                fontSize: 16,
              },
              style,
            ]}
          />
          {error ? (
            <Text
              style={{
                color: t.missed,
                fontSize: 12,
                marginTop: 6,
                marginLeft: 4,
              }}
            >
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}
