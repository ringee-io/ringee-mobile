import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useTheme } from '@/hooks/useTheme';
import AuthBackButton from '../AuthBackButton';
import AuthButton from '../AuthButton';
import AuthFormInput from '../AuthFormInput';
import AuthHeader from '../AuthHeader';
import AuthLink from '../AuthLink';
import StepView from '../StepView';
import { type SignInPayload } from '../useAuthFlow';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type Fields = z.infer<typeof schema>;

interface Props {
  email: string;
  loading: boolean;
  onBack: () => void;
  onSubmit: (
    payload: SignInPayload,
    form: { setError: (field: any, message: string) => void },
  ) => Promise<void>;
}

export default function SignInStep({ email, loading, onBack, onSubmit }: Props) {
  const router = useRouter();
  const t = useTheme();
  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { email, password: '' },
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
        title="Welcome back"
        emailLabel="Signing in as"
        email={email}
        showLogo={false}
      />

      <View style={{ marginBottom: 16 }}>
        <AuthFormInput
          control={form.control}
          name="password"
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          autoFocus
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

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
        title="Sign in"
        loading={loading}
        disabled={loading}
        loadingText="Signing in…"
        onPress={submit}
      />

      <View style={{ marginTop: 8 }}>
        <AuthLink
          text="Forgot password?"
          align="right"
          onPress={() => router.push('/(auth)/forgot-password')}
        />
      </View>
    </StepView>
  );
}
