import { gcm } from '@noble/ciphers/aes';
import { File, Paths } from 'expo-file-system';

import { getKey } from '@/lib/api/encryption';

/**
 * Decrypts call recordings for in-app playback. The backend stores recordings
 * as AES-256-GCM with the layout:
 *
 *   [ IV (12 bytes) ][ AuthTag (16 bytes) ][ Ciphertext ]
 *
 * This mirrors the web client (`packages/frontend-shared/src/lib/crypto.ts`),
 * except we can't use `crypto.subtle`/`URL.createObjectURL` in React Native:
 * we decrypt with a pure-JS AES-GCM (`@noble/ciphers`) and write the plaintext
 * to a cache file so `expo-audio` can play it from a `file://` URI.
 */

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// callId -> decrypted file URI. A recording's bytes never change, so once
// decrypted we can replay without re-downloading/decrypting.
const fileCache = new Map<string, string>();

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Download + decrypt an encrypted recording and return a local `file://` URI
 * ready to feed to an audio player. Results are cached per call.
 */
export async function decryptRecordingToFile(
  recordingUrl: string,
  callId: string,
): Promise<string> {
  const cached = fileCache.get(callId);
  if (cached) return cached;

  const { key } = await getKey();

  const response = await fetch(recordingUrl);
  if (!response.ok) {
    throw new Error('Failed to download recording');
  }
  const encrypted = new Uint8Array(await response.arrayBuffer());

  const iv = encrypted.slice(0, IV_LENGTH);
  const tag = encrypted.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = encrypted.slice(IV_LENGTH + TAG_LENGTH);

  // noble (like WebCrypto) expects the auth tag appended *after* the ciphertext.
  const sealed = new Uint8Array(ciphertext.length + tag.length);
  sealed.set(ciphertext);
  sealed.set(tag, ciphertext.length);

  const decrypted = gcm(hexToBytes(key), iv).decrypt(sealed);

  const file = new File(Paths.cache, `rec-${callId}.mp3`);
  if (file.exists) file.delete();
  file.create();
  file.write(decrypted);

  fileCache.set(callId, file.uri);
  return file.uri;
}

/** Drop a cached decrypted file (e.g. on org switch or sign-out). */
export function clearRecordingCache(callId?: string) {
  if (callId) {
    fileCache.delete(callId);
    return;
  }
  fileCache.clear();
}
