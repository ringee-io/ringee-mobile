// Thin adapter over @telnyx/react-voice-commons-sdk.
//
// The SDK ships native modules and only works in a custom dev client
// (expo prebuild + EAS build), not in Expo Go. We import it lazily so the
// JS bundle still loads on screens that never touch voice.

export type SipHeader = { name: string; value: string };

// Subset of the underlying `@telnyx/react-native-voice-sdk` Call exposed by
// the commons-SDK wrapper via its `telnyxCall` getter. Holds the IDs the
// Ringee backend needs to attribute the call (see telephony.controller.ts —
// `findOneBySessionId` looks up by Telnyx session id).
export interface UnderlyingTelnyxCall {
  telnyxSessionId?: string | null;
  telnyxLegId?: string | null;
  callId?: string | null;
}

export interface TelnyxCall {
  id?: string;
  callId?: string;
  callState$?: { subscribe: (cb: (state: unknown) => void) => { unsubscribe: () => void } };
  telnyxCall?: UnderlyingTelnyxCall;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  off?: (event: string, cb: (...args: unknown[]) => void) => void;
  hangup?: () => Promise<void> | void;
  muteAudio?: () => void;
  unmuteAudio?: () => void;
  mute?: () => void;
  unmute?: () => void;
  hold?: () => void;
  unhold?: () => void;
  resume?: () => void;
  sendDTMF?: (digit: string) => void;
  dtmf?: (digit: string) => void;
}

export interface TelnyxConnectionStream {
  subscribe: (cb: (state: string) => void) => { unsubscribe: () => void };
}

export interface TelnyxVoipClient {
  login: (config: unknown) => Promise<void>;
  disconnect?: () => void;
  logout?: () => Promise<void>;
  connectionState$?: TelnyxConnectionStream;
  currentConnectionState?: string;
  // The SDK's own view of the live call(s). After a background → foreground
  // reconnect the SDK can rebuild the call object, so these — not a cached
  // reference — are the source of truth for hanging up the call that the
  // current socket actually owns.
  currentActiveCall?: TelnyxCall | null;
  currentCalls?: TelnyxCall[];
  // The wrapper types customHeaders as Record<string,string>, but at runtime
  // the underlying @telnyx/react-native-voice-sdk forwards a {name,value}[]
  // array (this matches the web SDK + the Ringee backend). We pass the array.
  newCall: (
    destination: string,
    callerName?: string,
    callerNumber?: string,
    customHeaders?: SipHeader[],
  ) => Promise<TelnyxCall>;
}

interface TelnyxModule {
  createTelnyxVoipClient: (opts?: Record<string, unknown>) => TelnyxVoipClient;
  createCredentialConfig: (
    user: string,
    password: string,
    opts?: Record<string, unknown>,
  ) => unknown;
}

let cached: TelnyxModule | null = null;

export async function loadTelnyx(): Promise<TelnyxModule | null> {
  if (cached) return cached;
  try {
    // Dynamic specifier keeps Metro/TS from resolving statically when the
    // optional native package isn't installed in the dev environment.
    const id = '@telnyx/react-voice-commons-sdk';
    cached = (await import(/* @ts-ignore optional native package */ id)) as TelnyxModule;
    return cached;
  } catch (err) {
    console.warn(
      '[voice] @telnyx/react-voice-commons-sdk is not installed or native modules missing',
      err,
    );
    return null;
  }
}
