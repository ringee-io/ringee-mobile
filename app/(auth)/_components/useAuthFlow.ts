import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

const USER_NOT_FOUND_CODES = ['form_identifier_not_found'] as const;
const USER_NOT_FOUND_HINTS = ['not found', 'no account'] as const;

export type AuthStep = 'email' | 'signin' | 'signup' | 'verify';

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface VerifyPayload {
  code: string;
}

export interface FormApi {
  setError: (
    field: 'root' | 'password' | 'email' | 'firstName' | 'lastName' | 'code',
    message: string,
  ) => void;
}

export function useAuthFlow() {
  const router = useRouter();
  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp();

  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ready = signInLoaded && signUpLoaded;

  const goHome = useCallback(() => {
    router.replace('/(tabs)/today' as never);
  }, [router]);

  const reset = useCallback(() => {
    setStep('email');
    setEmail('');
  }, []);

  const checkUserExists = useCallback(
    async (identifier: string): Promise<boolean> => {
      if (!signInLoaded) return false;
      try {
        await signIn.create({ identifier });
        return true;
      } catch (error: any) {
        const errs: any[] = error?.errors ?? [];
        const notFound = errs.some(
          (e) =>
            USER_NOT_FOUND_CODES.includes(e.code) ||
            USER_NOT_FOUND_HINTS.some((h) => e.message?.toLowerCase().includes(h)),
        );
        return !notFound && errs.length === 0;
      }
    },
    [signIn, signInLoaded],
  );

  const continueWithEmail = useCallback(
    async (nextEmail: string) => {
      if (!ready) return;
      setIsLoading(true);
      setEmail(nextEmail);
      try {
        const exists = await checkUserExists(nextEmail);
        setStep(exists ? 'signin' : 'signup');
      } catch {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [ready, checkUserExists],
  );

  const submitSignIn = useCallback(
    async (data: SignInPayload, form: FormApi) => {
      if (!signInLoaded) return;
      setIsLoading(true);
      try {
        const attempt = await signIn.create({
          identifier: data.email,
          password: data.password,
        });
        if (attempt.status === 'complete') {
          await setActive({ session: attempt.createdSessionId });
          goHome();
        } else {
          form.setError('root', 'Sign in could not be completed');
        }
      } catch (error: any) {
        applyClerkErrors(error, form);
      } finally {
        setIsLoading(false);
      }
    },
    [signIn, signInLoaded, setActive, goHome],
  );

  const submitSignUp = useCallback(
    async (data: SignUpPayload, form: FormApi) => {
      if (!signUpLoaded) return;
      setIsLoading(true);
      try {
        const attempt = await signUp.create({
          emailAddress: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        });
        if (attempt.status === 'missing_requirements') {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setStep('verify');
        } else if (attempt.status === 'complete') {
          await setActiveSignUp({ session: attempt.createdSessionId });
          goHome();
        }
      } catch (error: any) {
        applyClerkErrors(error, form);
      } finally {
        setIsLoading(false);
      }
    },
    [signUp, signUpLoaded, setActiveSignUp, goHome],
  );

  const submitVerify = useCallback(
    async (data: VerifyPayload, form: FormApi) => {
      if (!signUpLoaded) return;
      setIsLoading(true);
      try {
        const attempt = await signUp.attemptEmailAddressVerification({
          code: data.code,
        });
        if (attempt.status === 'complete') {
          await setActiveSignUp({ session: attempt.createdSessionId });
          goHome();
        } else {
          form.setError('code', 'Verification failed. Please try again.');
        }
      } catch {
        form.setError('code', 'Invalid verification code.');
      } finally {
        setIsLoading(false);
      }
    },
    [signUp, signUpLoaded, setActiveSignUp, goHome],
  );

  const resendCode = useCallback(async () => {
    if (!signUpLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code sent', 'We sent a new verification code.');
    } catch {
      Alert.alert('Error', 'Could not resend code. Try again.');
    }
  }, [signUp, signUpLoaded]);

  const back = useCallback(() => {
    setStep((prev) => {
      if (prev === 'signin' || prev === 'signup') return 'email';
      if (prev === 'verify') return 'signup';
      return prev;
    });
  }, []);

  return {
    step,
    email,
    isLoading,
    ready,
    continueWithEmail,
    submitSignIn,
    submitSignUp,
    submitVerify,
    resendCode,
    back,
    reset,
  };
}

function applyClerkErrors(error: any, form: FormApi) {
  const errs: any[] = error?.errors ?? [];
  if (errs.length === 0) {
    form.setError('root', 'Unknown error occurred');
    return;
  }
  for (const err of errs) {
    const field = err.meta?.paramName as FormApi extends infer _ ? string : never;
    const message = err.longMessage || err.message || 'Something went wrong';
    if (field === 'password' || field === 'email_address' || field === 'first_name' || field === 'last_name') {
      const mapped =
        field === 'email_address'
          ? 'email'
          : field === 'first_name'
            ? 'firstName'
            : field === 'last_name'
              ? 'lastName'
              : field;
      form.setError(mapped as any, message);
    } else {
      form.setError('root', message);
    }
  }
}
