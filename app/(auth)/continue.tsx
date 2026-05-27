import React from 'react';

import AuthContainer from './_components/AuthContainer';
import EmailStep from './_components/steps/EmailStep';
import SignInStep from './_components/steps/SignInStep';
import SignUpStep from './_components/steps/SignUpStep';
import VerifyStep from './_components/steps/VerifyStep';
import { useAuthFlow } from './_components/useAuthFlow';

export default function ContinueWithAuth() {
  const flow = useAuthFlow();

  return (
    <AuthContainer>
      {flow.step === 'email' ? (
        <EmailStep
          onContinue={flow.continueWithEmail}
          loading={flow.isLoading}
          ready={flow.ready}
        />
      ) : null}

      {flow.step === 'signin' ? (
        <SignInStep
          email={flow.email}
          loading={flow.isLoading}
          onBack={flow.back}
          onSubmit={flow.submitSignIn}
        />
      ) : null}

      {flow.step === 'signup' ? (
        <SignUpStep
          email={flow.email}
          loading={flow.isLoading}
          onBack={flow.back}
          onSubmit={flow.submitSignUp}
        />
      ) : null}

      {flow.step === 'verify' ? (
        <VerifyStep
          email={flow.email}
          loading={flow.isLoading}
          onBack={flow.back}
          onResend={flow.resendCode}
          onSubmit={flow.submitVerify}
        />
      ) : null}
    </AuthContainer>
  );
}
