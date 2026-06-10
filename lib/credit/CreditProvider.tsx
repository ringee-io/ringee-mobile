import { useAuth, useOrganization, useUser } from '@clerk/clerk-expo';
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { CreditApi } from '@/lib/api';
import { useResource } from '@/lib/hooks/useResource';
import { useRefreshSignal } from '@/lib/refreshBus';

interface CreditContextValue {
  balance: number;
  freeCallTrial: boolean;
  loading: boolean;
  /** Re-fetch the balance (after a call ends). */
  refresh: () => void;
  /** Open the native credit-request prompt (iOS action sheet / Android dialog). */
  openCredit: () => void;
  /**
   * Returns true when a call may proceed (positive balance or an unused free
   * trial). When it returns false it has already surfaced the credit UI, so the
   * caller should simply abort.
   */
  guardCall: () => boolean;
}

const CreditContext = createContext<CreditContextValue | null>(null);

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const { userId, orgId, isSignedIn } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();

  const requestingRef = useRef(false);

  // Keyed on user + org so switching workspace re-reads that context's balance.
  const credit = useResource(
    () =>
      isSignedIn
        ? CreditApi.getBalance()
        : Promise.resolve({ balance: 0, freeCallTrial: false }),
    [userId, orgId, isSignedIn],
  );

  const balance = credit.data?.balance ?? 0;
  const freeCallTrial = credit.data?.freeCallTrial ?? false;
  const loading = credit.loading && !credit.data;

  const refresh = useCallback(() => {
    credit.reload();
  }, [credit]);

  // The voice provider emits 'credit' when a call ends so the balance and the
  // free-trial flag stay accurate for the next call.
  useRefreshSignal('credit', refresh);

  const submitRequest = useCallback(async () => {
    if (requestingRef.current) return;
    requestingRef.current = true;
    try {
      const res = await CreditApi.requestCredit({
        email: user?.primaryEmailAddress?.emailAddress ?? undefined,
        name: user?.fullName ?? undefined,
        workspace: organization?.name ?? 'Personal workspace',
      });
      if (res?.success) {
        Alert.alert(
          'Request sent',
          'The Ringee team will review your request and update your account by email shortly.',
        );
      } else {
        Alert.alert(
          'Something went wrong',
          'We could not send your request. Please try again in a moment.',
        );
      }
    } catch {
      Alert.alert(
        'Something went wrong',
        'We could not send your request. Please try again in a moment.',
      );
    } finally {
      requestingRef.current = false;
    }
  }, [organization?.name, user?.fullName, user?.primaryEmailAddress?.emailAddress]);

  const openCredit = useCallback(() => {
    // Administrative-request framing only — no prices, no purchase. This is an
    // account request to the Ringee team, which keeps the app clear of the App
    // Store / Play Store in-app-purchase requirements.
    const message = freeCallTrial
      ? 'Your first call is free. Send a request and the Ringee team will add credit to your account.'
      : 'Your account credit is managed by the Ringee team. Send a request and they will review and update your account.';
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Account credit',
          message,
          options: ['Send request', 'Cancel'],
          cancelButtonIndex: 1,
        },
        (index) => {
          if (index === 0) submitRequest();
        },
      );
    } else {
      // Android (and any non-iOS): native AlertDialog with the same single
      // request action, mirroring the iOS flow.
      Alert.alert('Account credit', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send request', onPress: submitRequest },
      ]);
    }
  }, [freeCallTrial, submitRequest]);

  const guardCall = useCallback(() => {
    // Unknown balance (still loading first read): let the call through — the
    // backend enforces affordability server-side as a fallback.
    if (loading) return true;
    if (balance > 0 || freeCallTrial) return true;
    openCredit();
    return false;
  }, [balance, freeCallTrial, loading, openCredit]);

  const value = useMemo<CreditContextValue>(
    () => ({ balance, freeCallTrial, loading, refresh, openCredit, guardCall }),
    [balance, freeCallTrial, loading, refresh, openCredit, guardCall],
  );

  return <CreditContext value={value}>{children}</CreditContext>;
}

export function useCredit(): CreditContextValue {
  const ctx = use(CreditContext);
  if (!ctx) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return ctx;
}

/** Non-throwing variant for components that may render outside the provider. */
export function useOptionalCredit(): CreditContextValue | null {
  return use(CreditContext);
}
