import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import AuthButton from '../AuthButton';
import AuthFormInput from '../AuthFormInput';
import AuthHeader from '../AuthHeader';
import AuthLink from '../AuthLink';
import SocialAuth from '../SocialAuth';
import StepView from '../StepView';

const schema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Enter a valid email address'),
});

type Fields = z.infer<typeof schema>;

interface Props {
  onContinue: (email: string) => void;
  loading: boolean;
  ready: boolean;
}

export default function EmailStep({ onContinue, loading, ready }: Props) {
  const router = useRouter();
  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <StepView>
      <AuthHeader
        title="Continue to Ringee"
        subtitle="Sign in or create an account to get started."
      />

      <SocialAuth />

      <View style={{ marginBottom: 16 }}>
        <AuthFormInput
          control={form.control}
          name="email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={form.handleSubmit(({ email }) => onContinue(email))}
        />
      </View>

      <AuthButton
        title="Continue"
        loadingText={!ready ? 'Loading…' : 'Checking…'}
        loading={loading || !ready}
        disabled={loading || !ready}
        onPress={form.handleSubmit(({ email }) => onContinue(email))}
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
