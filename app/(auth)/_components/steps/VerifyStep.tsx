import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useTheme } from '@/hooks/useTheme';
import AuthBackButton from '../AuthBackButton';
import AuthButton from '../AuthButton';
import AuthFormInput from '../AuthFormInput';
import AuthHeader from '../AuthHeader';
import StepView from '../StepView';
import { type VerifyPayload } from '../useAuthFlow';

const schema = z.object({
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits'),
});

type Fields = z.infer<typeof schema>;

interface Props {
  email: string;
  loading: boolean;
  onBack: () => void;
  onResend: () => void;
  onSubmit: (
    payload: VerifyPayload,
    form: { setError: (field: any, message: string) => void },
  ) => Promise<void>;
}

export default function VerifyStep({
  email,
  loading,
  onBack,
  onResend,
  onSubmit,
}: Props) {
  const t = useTheme();
  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const submit = form.handleSubmit((data) =>
    onSubmit(data, {
      setError: (field, message) => form.setError(field, { message }),
    }),
  );

  return (
    <StepView>
      <AuthBackButton onPress={onBack} />

      <AuthHeader
        title="Verify your email"
        subtitle={`We sent a 6-digit code to ${email}`}
        showLogo={false}
      />

      <View style={{ marginBottom: 16 }}>
        <AuthFormInput
          control={form.control}
          name="code"
          placeholder="123456"
          keyboardType="number-pad"
          autoFocus
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          returnKeyType="go"
          onSubmitEditing={submit}
          style={{ letterSpacing: 6, textAlign: 'center', fontSize: 22, fontWeight: '600' }}
        />
      </View>

      <AuthButton
        title="Verify email"
        loading={loading}
        disabled={loading}
        loadingText="Verifying…"
        onPress={submit}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 8,
          gap: 4,
        }}
      >
        <Text style={{ color: t.textMuted, fontSize: 13 }}>
          Didn&apos;t receive a code?
        </Text>
        <Pressable onPress={onResend} disabled={loading} hitSlop={8}>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>
            Resend
          </Text>
        </Pressable>
      </View>
    </StepView>
  );
}
