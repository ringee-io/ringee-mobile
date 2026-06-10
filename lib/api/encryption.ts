import { api } from './client';

/**
 * Per-context (active org, else personal) AES-256-GCM key used to decrypt call
 * recordings. Returned as a 64-char hex string. Mirrors the web client, which
 * hits the same endpoint before playing an encrypted recording.
 */
export function getKey() {
  return api.get<{ key: string }>('/encryption/key');
}
