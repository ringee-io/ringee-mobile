import { isClerkAPIResponseError, useSignIn } from '@clerk/clerk-expo';
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
  email: z
    .string({ message: 'Email is required' })
    .email('Enter a valid email address'),
});

type Fields = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const t = useTheme();
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = form.handleSubmit(async (data) => {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: data.email,
      });
      setSent(data.email);
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((e) => {
          if (e.meta?.paramName === 'identifier') {
            form.setError('email', { message: e.longMessage || e.message });
          } else {
            form.setError('root', { message: e.longMessage || e.message });
          }
        });
      } else {
        Alert.alert('Error', 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthContainer>
      <StepView>
        <AuthBackButton onPress={() => router.back()} />

        {sent ? (
          <>
            <AuthHeader
              title="Check your email"
              subtitle={`We sent a password reset link to ${sent}.`}
              showLogo={false}
            />
            <AuthButton
              title="Back to sign in"
              onPress={() => router.replace('/(auth)/continue' as never)}
            />
          </>
        ) : (
          <>
            <AuthHeader
              title="Reset your password"
              subtitle="Enter your email and we'll send you a reset link."
              showLogo={false}
            />

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
                returnKeyType="send"
                onSubmitEditing={submit}
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
              title="Send reset link"
              loading={loading}
              disabled={loading || !isLoaded}
              loadingText="Sending…"
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
                Remember your password?
              </Text>
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </StepView>
    </AuthContainer>
  );
}
