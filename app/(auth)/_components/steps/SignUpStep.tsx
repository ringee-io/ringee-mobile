import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useTheme } from '@/hooks/useTheme';
import AuthBackButton from '../AuthBackButton';
import AuthButton from '../AuthButton';
import AuthFormInput from '../AuthFormInput';
import AuthHeader from '../AuthHeader';
import AuthLegal from '../AuthLegal';
import StepView from '../StepView';
import { type SignUpPayload } from '../useAuthFlow';

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type Fields = z.infer<typeof schema>;

interface Props {
  email: string;
  loading: boolean;
  onBack: () => void;
  onSubmit: (
    payload: SignUpPayload,
    form: { setError: (field: any, message: string) => void },
  ) => Promise<void>;
}

export default function SignUpStep({ email, loading, onBack, onSubmit }: Props) {
  const t = useTheme();
  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { email, password: '', firstName: '', lastName: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    form.setValue('email', email);
    form.setValue('password', '', { shouldValidate: false });
  }, [email, form]);

  const submit = form.handleSubmit((data) =>
    onSubmit(data, {
      setError: (field, message) => form.setError(field, { message }),
    }),
  );

  const rootError = form.formState.errors.root?.message;

  return (
    <StepView>
      <AuthBackButton onPress={onBack} />

      <AuthHeader
        title="Create your account"
        emailLabel="Creating account for"
        email={email}
        showLogo={false}
      />

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <AuthFormInput
            control={form.control}
            name="firstName"
            placeholder="First name"
            autoComplete="given-name"
            autoCapitalize="words"
            autoFocus
            returnKeyType="next"
          />
        </View>
        <View style={{ flex: 1 }}>
          <AuthFormInput
            control={form.control}
            name="lastName"
            placeholder="Last name"
            autoComplete="family-name"
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={{ marginBottom: 18 }}>
        <AuthFormInput
          control={form.control}
          name="password"
          placeholder="Create a password"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      <AuthLegal />

      {rootError ? (
        <Text
          style={{
            color: t.missed,
            fontSize: 13,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {rootError}
        </Text>
      ) : null}

      <AuthButton
        title="Create account"
        loading={loading}
        disabled={loading}
        loadingText="Creating account…"
        onPress={submit}
      />
    </StepView>
  );
}
