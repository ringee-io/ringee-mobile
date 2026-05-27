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

function load(): InCallManager | null {
  if (mod !== undefined) return mod;
  try {
    // require keeps the import out of web/Expo Go bundles that lack the
    // native module — same lazy-load pattern as ./telnyx.ts.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const required = require('react-native-incall-manager');
    mod = (required?.default ?? required) as InCallManager;
  } catch (err) {
    console.warn('[callAudio] react-native-incall-manager not available', err);
    mod = null;
  }
  return mod;
}

function isNative(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
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
    try {
      // `auto: true` lets the OS keep an already-selected route
      // (Bluetooth / wired headset) instead of forcing earpiece.
      im.start({ media: 'audio', auto: true });
      // Default to earpiece. setForceSpeakerphoneOn(false) means "do not
      // force speaker"; the OS picks earpiece unless an external device
      // is plugged in.
      im.setForceSpeakerphoneOn(false);
      im.setSpeakerphoneOn(false);
      im.setKeepScreenOn(true);
    } catch (err) {
      console.warn('[callAudio] start failed', err);
    }
  },

  /**
   * Toggle the loudspeaker. Pass `false` to return to the earpiece (or to
   * the active external device, if any).
   */
  setSpeaker(on: boolean): void {
    if (!isNative()) return;
    const im = load();
    if (!im) return;
    try {
      im.setSpeakerphoneOn(on);
      // -1 = "don't force" (let the OS decide based on external devices);
      // true = force speaker on; false = force off.
      im.setForceSpeakerphoneOn(on ? true : -1);
    } catch (err) {
      console.warn('[callAudio] setSpeaker failed', err);
    }
  },

  /**
   * Restore the device's default audio routing. Call after hangup.
   */
  stop(): void {
    if (!isNative()) return;
    const im = load();
    if (!im) return;
    try {
      im.setKeepScreenOn(false);
      im.setForceSpeakerphoneOn(-1);
      im.stop();
    } catch (err) {
      console.warn('[callAudio] stop failed', err);
    }
  },
};
