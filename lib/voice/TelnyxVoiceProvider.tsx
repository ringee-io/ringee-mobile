import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { TELNYX } from '@/constants/Config';
import { ApiError, TelephonyApi } from '@/lib/api';

import { buildCustomHeaders, isTerminal, mapSdkState, normalizeDestination } from './callState';
import { CallAudio } from './callAudio';
import { loadTelnyx, type TelnyxCall, type TelnyxVoipClient } from './telnyx';
import type { ActiveCall, CallerOption } from './types';
import { useCallerOptions } from './useCallerOptions';

interface PlaceCallArgs {
  destination: string;
  callerId?: string | null;
  /** Push to the active-call screen after the call object is created. */
  navigate?: boolean;
}

interface VoiceContextValue {
  ready: boolean;
  connecting: boolean;
  registered: boolean;
  activeCall: ActiveCall | null;
  /** Default outbound caller-id (E.164). Falls back to the shared Ringee number. */
  defaultCallerId: string | null;
  setDefaultCallerId: (value: string | null) => void;
  /** All outbound numbers the user can dial from (purchased + verified + shared). */
  callerOptions: CallerOption[];
  callerOptionsLoading: boolean;
  refreshCallerOptions: () => Promise<void>;
  placeCall: (args: PlaceCallArgs) => Promise<void>;
  /**
   * Like placeCall but, when more than one caller ID is available, first
   * prompts the user to pick the outbound number.
   */
  placeCallWithCallerPrompt: (destination: string) => Promise<void>;
  hangup: () => Promise<void>;
  toggleMute: () => void;
  toggleHold: () => void;
  toggleRecording: () => Promise<void>;
  /** Toggle loudspeaker output. Earpiece is the default. */
  toggleSpeaker: () => void;
  sendDtmf: (digit: string) => void;
  errorMessage: string | null;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error('useVoice must be used inside <TelnyxVoiceProvider>');
  }
  return ctx;
}

/** Hook-safe accessor for screens that need to no-op when provider is missing. */
export function useOptionalVoice(): VoiceContextValue | null {
  return useContext(VoiceContext);
}

export function TelnyxVoiceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { userId, orgId } = useAuth();

  const clientRef = useRef<TelnyxVoipClient | null>(null);
  const callRef = useRef<TelnyxCall | null>(null);
  const stateSubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const connectionSubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const sessionIdPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorRef = useRef<string | null>(null);
  // When a freshly-placed call should push the active-call screen. Consumed by
  // the navigation effect below so we never call router.push during render.
  const pendingNavigateRef = useRef(false);
  // Mirror of the latest activeCall so event handlers (proximity sensor, the
  // control toggles) can read current call state without re-subscribing or
  // mutating state inside a setState updater.
  const activeCallRef = useRef<ActiveCall | null>(null);

  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [errorMessage, setErrorMessageState] = useState<string | null>(null);

  const setErrorMessage = useCallback((msg: string | null) => {
    errorRef.current = msg;
    setErrorMessageState(msg);
  }, []);

  const {
    options: callerOptions,
    loading: callerOptionsLoading,
    refresh: refreshCallerOptions,
    defaultCallerId,
    setDefaultCallerId,
  } = useCallerOptions();

  // Subscribe to connectionState$ so `registered` reflects the live socket
  // status. Without this, a silent disconnect (background → resume) leaves us
  // thinking we're still logged in and the next `newCall` fails.
  const subscribeConnection = useCallback((client: TelnyxVoipClient) => {
    connectionSubRef.current?.unsubscribe();
    if (!client.connectionState$?.subscribe) return;
    connectionSubRef.current = client.connectionState$.subscribe((raw) => {
      const state = typeof raw === 'string' ? raw.toUpperCase() : '';
      const connected = state === 'CONNECTED';
      setRegistered(connected);
      if (connected) {
        setReady(true);
        setErrorMessage(null);
      } else if (state === 'ERROR') {
        setReady(false);
      }
    });
  }, [setErrorMessage]);

  // Lazy-init the SDK + log in with the hardcoded credentials from the single
  // config point. Returns the live client or null on failure. Re-runs login
  // if the cached client has lost its socket since the last call.
  const ensureClient = useCallback(async () => {
    setErrorMessage(null);
    setConnecting(true);
    try {
      const mod = await loadTelnyx();
      if (!mod) {
        throw new Error('Telnyx SDK not installed. Run a dev build (expo prebuild + EAS build).');
      }
      if (!clientRef.current) {
        clientRef.current = mod.createTelnyxVoipClient({
          enableAppStateManagement: true,
          debug: TELNYX.debug,
        });
        subscribeConnection(clientRef.current);
      }

      // Bail early when the SDK reports we're still connected — `login()` on a
      // live client is a no-op at best and a re-handshake at worst, which
      // throws "already connected" on some SDK versions and leaves us stuck.
      const currentState = (clientRef.current.currentConnectionState ?? '').toUpperCase();
      if (currentState === 'CONNECTED' || registered) {
        setReady(true);
        return clientRef.current;
      }

      if (!TELNYX.sipUsername || !TELNYX.sipPassword) {
        throw new Error('Missing Telnyx SIP credentials in constants/Config.ts.');
      }
      const config = mod.createCredentialConfig(TELNYX.sipUsername, TELNYX.sipPassword, {
        debug: TELNYX.debug,
        callerName: TELNYX.callerName,
      });
      await clientRef.current.login(config);
      setReady(true);
      return clientRef.current;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      console.warn('[voice] login failed', msg);
      return null;
    } finally {
      setConnecting(false);
    }
  }, [registered, setErrorMessage, subscribeConnection]);

  // Warm the client on mount so "place call" is snappy and config errors
  // surface at app start instead of mid-dial.
  useEffect(() => {
    ensureClient();
    return () => {
      stateSubRef.current?.unsubscribe();
      connectionSubRef.current?.unsubscribe();
      if (sessionIdPollRef.current) clearInterval(sessionIdPollRef.current);
      try {
        clientRef.current?.disconnect?.();
      } catch {}
      // Provider tear-down (logout, app unmount) — make sure audio routing
      // is not stuck in speaker mode and the proximity sensor is released.
      CallAudio.stop();
    };
  }, [ensureClient]);

  // Keep the ref in sync so event handlers always see the latest call.
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Auto-drop the loudspeaker when the phone is raised to the ear. The OS
  // blanks the screen via the proximity sensor on its own; this additionally
  // routes audio back to the earpiece (and reflects it in the UI) so the caller
  // isn't still on speaker against their head. We never re-enable speaker when
  // the phone moves away — matching the platform phone-app behavior. The sensor
  // only emits while a call's audio session is active, so a single
  // provider-lifetime subscription is enough.
  useEffect(() => {
    return CallAudio.addProximityListener((isNear) => {
      if (!isNear) return;
      const current = activeCallRef.current;
      if (!current?.speakerOn) return;
      CallAudio.setSpeaker(false);
      setActiveCall((prev) => (prev ? { ...prev, speakerOn: false } : prev));
    });
  }, []);

  const subscribeCall = useCallback(
    (
      call: TelnyxCall,
      base: ActiveCall,
      onFailedFast: (reason: string | null, reachedRinging: boolean) => void,
    ) => {
      stateSubRef.current?.unsubscribe();
      if (sessionIdPollRef.current) clearInterval(sessionIdPollRef.current);
      setActiveCall(base);

      let reachedActive = false;
      let reachedRinging = false;
      let answered = false;

      // Poll the underlying call object for the telnyx_session_id — it is
      // populated asynchronously after the SDK receives Telnyx's response, so
      // it's not available at newCall() return time. The Ringee backend keys
      // its Call records on this id, so recording / outcome features need it.
      const captureIds = () => {
        const underlying = call.telnyxCall;
        const sid = underlying?.telnyxSessionId ?? null;
        const lid = underlying?.telnyxLegId ?? null;
        if (!sid && !lid) return false;
        setActiveCall((prev) => {
          if (!prev) return prev;
          if (prev.telnyxSessionId === sid && prev.telnyxLegId === lid) return prev;
          return { ...prev, telnyxSessionId: sid, telnyxLegId: lid };
        });
        return Boolean(sid);
      };

      // First attempt synchronously in case the SDK already populated them
      // (incoming/re-attached calls).
      if (!captureIds()) {
        sessionIdPollRef.current = setInterval(() => {
          if (captureIds() && sessionIdPollRef.current) {
            clearInterval(sessionIdPollRef.current);
            sessionIdPollRef.current = null;
          }
        }, 400);
      }

      const handle = (raw: unknown) => {
        const next = mapSdkState(raw);
        if (next === 'active') reachedActive = true;
        if (next === 'ringing') reachedRinging = true;
        if (next === 'active') answered = true;
        // Session id often lands right after the first state event.
        captureIds();

        setActiveCall((prev) => {
          if (!prev) return prev;
          const answeredAt = next === 'active' && !prev.answeredAt ? Date.now() : prev.answeredAt;
          const endedAt = isTerminal(next) && !prev.endedAt ? Date.now() : prev.endedAt;
          // The SDK is the source of truth for hold: it emits `held` on hold and
          // `active` on resume, so keep onHold in lock-step with it. This is what
          // corrects the button after a resume even if the optimistic toggle and
          // the SDK round-trip momentarily disagree.
          const onHold = next === 'held' ? true : next === 'active' ? false : prev.onHold;
          return { ...prev, state: next, answeredAt, endedAt, onHold };
        });

        if (isTerminal(next)) {
          stateSubRef.current?.unsubscribe();
          stateSubRef.current = null;
          if (sessionIdPollRef.current) {
            clearInterval(sessionIdPollRef.current);
            sessionIdPollRef.current = null;
          }
          callRef.current = null;
          // Restore default audio routing the moment the call ends, regardless
          // of whether it was answered. Proximity monitoring stops here too.
          CallAudio.stop();
          // Give the bye/error event one tick to populate errorRef, then clear
          // the call and, if it died before being answered, surface a failure.
          setTimeout(() => {
            setActiveCall(null);
            if (!answered && !reachedActive) {
              onFailedFast(errorRef.current, reachedRinging);
            }
          }, 600);
        }
      };

      const state$ = call.callState$;
      if (state$?.subscribe) {
        stateSubRef.current = state$.subscribe(handle);
      } else if (typeof call.on === 'function') {
        call.on('stateChange', handle);
        stateSubRef.current = { unsubscribe: () => call.off?.('stateChange', handle) };
      }
    },
    [],
  );

  // Navigate to the active-call screen once a freshly-placed call exists and is
  // still alive. Done in an effect (not during render) to avoid router.push
  // being called inside a setState updater. The route lives at the root layout
  // so it's reachable from any tab — pushing /dialer/active from a non-dialer
  // tab's stack used to silently fail.
  useEffect(() => {
    if (pendingNavigateRef.current && activeCall && !isTerminal(activeCall.state)) {
      pendingNavigateRef.current = false;
      router.push('/active-call' as never);
    }
  }, [activeCall, router]);

  const placeCall = useCallback(
    async ({ destination, callerId, navigate = true }: PlaceCallArgs) => {
      const e164 = normalizeDestination(destination);
      if (!e164) {
        Alert.alert('Invalid number', 'Enter a valid phone number to dial.');
        return;
      }
      const client = await ensureClient();
      if (!client) {
        Alert.alert(
          'Voice unavailable',
          errorRef.current || 'Could not connect to Telnyx. Check your SIP credentials and network.',
        );
        return;
      }

      // Always dial with a caller ID Telnyx will accept. Falls back to the
      // single config caller ID to avoid SIP 403 "Caller Origination Number is
      // Invalid" when no number is explicitly chosen.
      const cid = callerId ?? defaultCallerId ?? TELNYX.callerId;
      const customHeaders = buildCustomHeaders({ callerId: cid, userId, orgId });

      try {
        setErrorMessage(null);
        if (TELNYX.debug) {
          console.log('[voice] placing call', { destination: e164, callerNumber: cid, customHeaders });
        }
        // Route audio to the earpiece and enable proximity monitoring *before*
        // the SDK attaches its audio stream so the call audio is never briefly
        // routed through the loudspeaker on Android.
        CallAudio.start();

        const call = await client.newCall(e164, undefined, cid, customHeaders);
        callRef.current = call;

        const base: ActiveCall = {
          id: call.id || call.callId || String(Date.now()),
          telnyxSessionId: call.telnyxCall?.telnyxSessionId ?? null,
          telnyxLegId: call.telnyxCall?.telnyxLegId ?? null,
          destination: e164,
          callerId: cid,
          direction: 'outbound',
          state: 'connecting',
          startedAt: Date.now(),
          answeredAt: null,
          endedAt: null,
          muted: false,
          onHold: false,
          recording: false,
          recordingId: null,
          speakerOn: false,
        };

        pendingNavigateRef.current = navigate;
        subscribeCall(call, base, (reason, reachedRinging) => {
          // If the call already rang, it wasn't a caller-ID/routing reject — it
          // was ended (callee declined, or CallKit could not hold the call,
          // which happens on the iOS Simulator). Only the never-rang case
          // points at the caller ID / account.
          const message = reason
            ? reason
            : reachedRinging
              ? `The call to ${e164} ended before connecting. On the iOS Simulator CallKit cannot keep a call up — test on a physical device. Otherwise the other side declined or was unreachable.`
              : `Telnyx did not route the call from ${cid} to ${e164}. Check the destination and that ${cid} belongs to your Telnyx account. The SIP cause is in the Metro logs ("[Call] Hangup event received").`;
          Alert.alert('Call failed', message);
        });
      } catch (err) {
        // newCall threw before the call ever started — undo the audio routing.
        CallAudio.stop();
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
        Alert.alert('Call failed', msg);
      }
    },
    [defaultCallerId, ensureClient, orgId, setErrorMessage, subscribeCall, userId],
  );

  const placeCallWithCallerPrompt = useCallback(
    async (destination: string) => {
      if (callerOptions.length <= 1) {
        await placeCall({ destination, callerId: callerOptions[0]?.value });
        return;
      }
      const labels = callerOptions.map((o) => `${o.label}  ·  ${o.sub}`);
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: 'Call from',
            message: destination,
            options: [...labels, 'Cancel'],
            cancelButtonIndex: labels.length,
          },
          (idx) => {
            if (idx >= 0 && idx < callerOptions.length) {
              placeCall({ destination, callerId: callerOptions[idx].value });
            }
          },
        );
      } else {
        Alert.alert(
          'Call from',
          destination,
          [
            ...callerOptions.map((o) => ({
              text: o.label,
              onPress: () => placeCall({ destination, callerId: o.value }),
            })),
            { text: 'Cancel', style: 'cancel' as const },
          ],
          { cancelable: true },
        );
      }
    },
    [callerOptions, placeCall],
  );

  const hangup = useCallback(async () => {
    try {
      await callRef.current?.hangup?.();
    } catch (err) {
      console.warn('[voice] hangup error', err);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const call = callRef.current;
    const current = activeCallRef.current;
    if (!call || !current) return;
    const next = !current.muted;
    setActiveCall((prev) => (prev ? { ...prev, muted: next } : prev));
    // mute/unmute may be async on the SDK — fire-and-handle so a rejected
    // promise never escapes as an unhandled rejection.
    Promise.resolve()
      .then(() => (next ? (call.mute ?? call.muteAudio)?.() : (call.unmute ?? call.unmuteAudio)?.()))
      .catch((err) => console.warn('[voice] mute toggle error', err));
  }, []);

  const toggleHold = useCallback(async () => {
    const call = callRef.current;
    const current = activeCallRef.current;
    if (!call || !current) return;
    // Only meaningful once media is flowing; ignore taps while connecting.
    if (current.state !== 'active' && current.state !== 'held') return;
    const goingOnHold = !current.onHold;
    // Optimistic flip for instant feedback; the SDK state event confirms it and
    // the catch below reverts if the SDK rejects the request.
    setActiveCall((prev) =>
      prev ? { ...prev, onHold: goingOnHold, state: goingOnHold ? 'held' : 'active' } : prev,
    );
    try {
      if (goingOnHold) await call.hold?.();
      else await (call.resume ?? call.unhold)?.();
    } catch (err) {
      console.warn('[voice] hold toggle failed', err);
      setActiveCall((prev) =>
        prev ? { ...prev, onHold: !goingOnHold, state: !goingOnHold ? 'held' : 'active' } : prev,
      );
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    const current = activeCallRef.current;
    if (!current) return;
    const next = !current.speakerOn;
    CallAudio.setSpeaker(next);
    setActiveCall((prev) => (prev ? { ...prev, speakerOn: next } : prev));
  }, []);

  const sendDtmf = useCallback((digit: string) => {
    try {
      (callRef.current?.sendDTMF ?? callRef.current?.dtmf)?.(digit);
    } catch (err) {
      console.warn('[voice] dtmf error', err);
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (!callRef.current || !activeCall) return;
    const { recording, recordingId } = activeCall;

    // The backend looks up the Call row by Telnyx's session id (see
    // telephony.controller.ts → findOneBySessionId). The SDK-local
    // `activeCall.id` is just the JS object id and the backend would 404 on it
    // with "Call not found". Read the live id from the underlying call so we
    // also pick up late assignments after this callback was scheduled.
    const sessionId =
      callRef.current.telnyxCall?.telnyxSessionId ?? activeCall.telnyxSessionId;

    if (!sessionId) {
      Alert.alert(
        'Recording not ready',
        'The call is still being acknowledged by the carrier. Try again in a moment.',
      );
      return;
    }

    try {
      if (!recording) {
        setActiveCall((prev) => (prev ? { ...prev, recording: true } : prev));
        const rec = await TelephonyApi.startRecording(sessionId);
        setActiveCall((prev) =>
          prev ? { ...prev, recording: true, recordingId: rec.id } : prev,
        );
      } else {
        if (!recordingId) {
          setActiveCall((prev) =>
            prev ? { ...prev, recording: false, recordingId: null } : prev,
          );
          return;
        }
        setActiveCall((prev) => (prev ? { ...prev, recording: false } : prev));
        await TelephonyApi.stopRecording(recordingId, sessionId);
        setActiveCall((prev) =>
          prev ? { ...prev, recording: false, recordingId: null } : prev,
        );
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      console.warn('[voice] recording toggle error', msg);
      // Revert optimistic update.
      setActiveCall((prev) => (prev ? { ...prev, recording, recordingId } : prev));
      Alert.alert('Recording error', msg);
    }
  }, [activeCall]);

  const value = useMemo<VoiceContextValue>(
    () => ({
      ready,
      connecting,
      registered,
      activeCall,
      defaultCallerId,
      setDefaultCallerId,
      callerOptions,
      callerOptionsLoading,
      refreshCallerOptions,
      placeCall,
      placeCallWithCallerPrompt,
      hangup,
      toggleMute,
      toggleHold,
      toggleRecording,
      toggleSpeaker,
      sendDtmf,
      errorMessage,
    }),
    [
      ready,
      connecting,
      registered,
      activeCall,
      defaultCallerId,
      setDefaultCallerId,
      callerOptions,
      callerOptionsLoading,
      refreshCallerOptions,
      placeCall,
      placeCallWithCallerPrompt,
      hangup,
      toggleMute,
      toggleHold,
      toggleRecording,
      toggleSpeaker,
      sendDtmf,
      errorMessage,
    ],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

// Web fallback: react-native-web has no native modules, but we still want the
// rest of the app to mount.
export function platformSupportsVoice(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
