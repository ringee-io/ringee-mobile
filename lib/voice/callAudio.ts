// Thin wrapper around react-native-incall-manager.
//
// Goals:
//   - Route call audio to the earpiece by default (phone-call behavior).
//   - Enable the proximity sensor while in a call so the screen turns off
//     when the phone is held to the ear.
//   - Allow the user to opt into speakerphone, and to disable it again.
//   - Never fight the system when an external audio device (Bluetooth,
//     wired headset, AirPods) is selected.
//   - Cleanly restore audio state on hangup.
//
// The native module is loaded lazily so the JS bundle still runs in Expo Go
// or on web — it just becomes a no-op there.

import { Platform } from 'react-native';

type InCallManager = {
  start: (opts?: {
    media?: 'audio' | 'video';
    auto?: boolean;
    ringback?: string;
  }) => void;
  stop: (opts?: { busytone?: string }) => void;
  setSpeakerphoneOn: (on: boolean) => void;
  setForceSpeakerphoneOn: (flag: boolean | -1 | 0 | 1) => void;
  setKeepScreenOn: (on: boolean) => void;
  turnScreenOn?: () => void;
  turnScreenOff?: () => void;
};

let mod: InCallManager | null | undefined;
// Tracks whether `start()` actually ran end-to-end. We use this to skip a
// no-op `stop()` (which would log noisy warnings on platforms where the
// native module isn't linked, e.g. dev builds without the InCallManager
// pod installed yet).
let started = false;

function load(): InCallManager | null {
  if (mod !== undefined) return mod;
  try {
    // require keeps the import out of web/Expo Go bundles that lack the
    // native module — same lazy-load pattern as ./telnyx.ts.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const required = require('react-native-incall-manager');
    const candidate = (required?.default ?? required) as InCallManager | null;
    // The package can resolve to a stub whose method properties are null
    // when the native module isn't linked. Treat that as "unavailable".
    mod =
      candidate && typeof candidate.start === 'function' ? candidate : null;
  } catch (err) {
    console.warn('[callAudio] react-native-incall-manager not available', err);
    mod = null;
  }
  return mod;
}

function isNative(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function safe(fn: () => void): void {
  try {
    fn();
  } catch {
    // Individual native-module calls can throw when the underlying bridge
    // hasn't been wired up; we deliberately swallow per-call errors so a
    // single missing method doesn't abort the rest of the routing setup.
  }
}

export const CallAudio = {
  /**
   * Begin call audio routing. Sets the earpiece as the default output and
   * starts proximity monitoring. Safe to call multiple times.
   */
  start(): void {
    if (!isNative()) return;
    const im = load();
    if (!im) return;
    if (started) return;
    // `auto: true` lets the OS keep an already-selected route
    // (Bluetooth / wired headset) instead of forcing earpiece. With
    // `media: 'audio'` the native module turns the proximity sensor on so the
    // screen blanks when the phone is held to the ear.
    safe(() => im.start({ media: 'audio', auto: true }));
    // Default audio output: earpiece. The user can switch to speaker via the
    // in-call control.
    safe(() => im.setForceSpeakerphoneOn(false));
    safe(() => im.setSpeakerphoneOn(false));
    // NOTE: we intentionally do NOT call setKeepScreenOn(true) here — on
    // Android that competes with the proximity sensor's screen dimming and
    // makes the screen stay on while the phone is at the ear. The proximity
    // sensor itself handles "screen on while you look at it" naturally.
    started = true;
  },

  /**
   * Toggle the loudspeaker. Pass `false` to return to the earpiece (or to
   * the active external device, if any).
   */
  setSpeaker(on: boolean): void {
    if (!isNative()) return;
    const im = load();
    if (!im) return;
    safe(() => im.setSpeakerphoneOn(on));
    // -1 = "don't force" (let the OS decide based on external devices);
    // true = force speaker on; false = force off.
    safe(() => im.setForceSpeakerphoneOn(on ? true : -1));
  },

  /**
   * Restore the device's default audio routing. Call after hangup.
   */
  stop(): void {
    if (!isNative()) return;
    if (!started) return;
    started = false;
    const im = load();
    if (!im) return;
    safe(() => im.setForceSpeakerphoneOn(-1));
    safe(() => im.stop());
  },
};
