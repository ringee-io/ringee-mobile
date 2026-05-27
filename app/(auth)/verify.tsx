import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useTheme } from '@/hooks/useTheme';
import AuthBackButton from './_components/AuthBackButton';
import AuthButton from './_components/AuthButton';
import AuthContainer from './_components/AuthContainer';
import AuthFormInput from './_components/AuthFormInput';
import AuthHeader from './_components/AuthHeader';
import StepView from './_components/StepView';

const schema = z.object({
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits'),
});

type Fields = z.infer<typeof schema>;

export default function VerifyScreen() {
  const router = useRouter();
  const t = useTheme();
  const { signUp, isLoaded, setActive } = useSignUp();
  const [loading, setLoading] = useState(false);

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const pendingEmail =
    signUp?.emailAddress || signUp?.unverifiedFields?.[0] || 'your email';

  const submit = form.handleSubmit(async (data) => {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({
        code: data.code,
      });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)/today' as never);
      } else {
        form.setError('code', {
          message: 'Verification failed. Please try again.',
        });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((e) => {
          if (e.code === 'verification_failed' || e.meta?.paramName === 'code') {
            form.setError('code', {
              message: 'Invalid verification code. Please try again.',
            });
          } else {
            form.setError('root', { message: e.longMessage || e.message });
          }
        });
      } else {
        form.setError('root', { message: 'Unknown error occurred' });
      }
    } finally {
      setLoading(false);
    }
  });

  async function resend() {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code sent', 'We sent a new verification code.');
    } catch {
      Alert.alert('Error', 'Could not resend code. Try again.');
    }
  }

  return (
    <AuthContainer>
      <StepView>
        <AuthBackButton onPress={() => router.back()} />

        <AuthHeader
          title="Verify your email"
          subtitle={`We sent a 6-digit code to ${pendingEmail}.`}
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
            style={{
              letterSpacing: 6,
              textAlign: 'center',
              fontSize: 22,
              fontWeight: '600',
            }}
          />
        </View>

        {form.formState.errors.root?.message ? (
          <Text
            style={{
              color: t.missed,
              fontSize: 13,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {form.formState.errors.root.message}
          </Text>
        ) : null}

        <AuthButton
          title="Verify email"
          loading={loading}
          disabled={loading || !isLoaded}
          loadingText="Verifying…"
          onPress={submit}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 12,
            gap: 4,
          }}
        >
          <Text style={{ color: t.textMuted, fontSize: 13 }}>
            Didn&apos;t receive a code?
          </Text>
          <Pressable onPress={resend} disabled={loading} hitSlop={8}>
            <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>
              Resend
            </Text>
          </Pressable>
        </View>
      </StepView>
    </AuthContainer>
  );
}
