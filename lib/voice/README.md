# Voice module (placeholder)

The MVP ships with **`tel:` fallback** via `expo-linking`. Tapping a call button
hands the phone number off to the system dialer.

## Why not native Telnyx voice yet?

Telnyx React Native Voice Commons (`@telnyx/react-voice-commons-sdk`) is a real
option, but for this MVP it pulls in non-trivial work:

1. **Dev build required** — Expo Go can't run the native modules; we'd need
   `expo prebuild` + EAS builds for both platforms.
2. **CallKit (iOS) / ConnectionService (Android)** — native config and entitlements.
3. **Push credentials** — APNs (VoIP push) and FCM data messages so incoming
   calls can wake the app cold.
4. **Backend session/credential issuance** — the mobile app must never see
   long-lived Telnyx API keys. The backend must mint a scoped, short-lived
   token tied to the Clerk user and active Ringee number on demand.
5. **Real-device QA** — outgoing/incoming, killed-state, audio routing,
   Bluetooth, lock-screen, poor-network.

Doing all of the above gracefully blocks the rest of the companion-app value
(Today, callbacks, meetings, missed calls, contacts) for weeks. The product
brief explicitly says: *"do not let native Telnyx integration delay the entire
MVP"*.

## What's wired now

- `components/ringee/CallButton.tsx` triggers `Linking.openURL('tel:…')` by default.
- `onPress` is overridable per-screen, so we can swap in a native call action
  without changing the surface of every screen.
- API client has `lib/api/push.ts` stubs that match the future
  `POST /mobile/push/register` route — the backend route is already a no-op
  scaffold in `apps/backend/src/api/routes/mobile.controller.ts`.

## Next steps when ready

1. Add `@telnyx/react-voice-commons-sdk` (and the expo config plugin if needed).
2. Add backend route `POST /mobile/voice/session` that returns a scoped Telnyx
   token + caller-id config for the authenticated user/org.
3. Replace `CallButton`'s default `tel:` action with a `useVoiceClient()` hook
   that places the call through the Telnyx client.
4. Configure CallKit (iOS) and ConnectionService (Android) for native call UI.
5. Wire VoIP push: APNs voip-push for iOS, high-priority data messages for
   Android.
6. Register devices via `POST /mobile/push/register` once the backend persists
   tokens (the no-op stub returns `{ ok: true }` today).
