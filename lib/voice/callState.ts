import type { CallStateName, SipHeader } from './types';

// The Telnyx SDK emits a variety of raw state shapes (string enum, or an
// object with `state`/`name`). Normalize them to our UI state machine.
export function mapSdkState(raw: unknown): CallStateName {
  const name =
    typeof raw === 'string'
      ? raw.toLowerCase()
      : (raw as { state?: string })?.state?.toLowerCase?.() ||
        (raw as { name?: string })?.name?.toLowerCase?.() ||
        '';

  if (name.includes('new') || name.includes('trying') || name.includes('requesting'))
    return 'connecting';
  if (name.includes('early') || name.includes('ringing')) return 'ringing';
  if (name.includes('active') || name.includes('answered')) return 'active';
  if (name.includes('held')) return 'held';
  if (name.includes('destroy') || name.includes('hangup') || name.includes('ended'))
    return 'ended';
  if (name.includes('error') || name.includes('failed')) return 'failed';
  return 'connecting';
}

export const isTerminal = (s: CallStateName): boolean => s === 'ended' || s === 'failed';

// Custom SIP headers the Ringee backend expects on every outbound INVITE so it
// can attribute the call and so Telnyx accepts our caller identity. Identical
// shape to the working web client (see apps/frontend use.call.ts).
export function buildCustomHeaders(args: {
  callerId: string;
  userId?: string | null;
  orgId?: string | null;
}): SipHeader[] {
  const sip = `sip:${args.callerId}@sip.telnyx.com`;
  const headers: SipHeader[] = [
    { name: 'From', value: sip },
    { name: 'P-Asserted-Identity', value: sip },
    { name: 'P-Preferred-Identity', value: sip },
  ];
  if (args.userId) headers.push({ name: 'X-User-Id', value: args.userId });
  if (args.orgId) headers.push({ name: 'X-Organization-Id', value: args.orgId });
  return headers;
}

// Accepts E.164 (+1234567890), a plain digit string, or a sip: URI.
export function normalizeDestination(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('sip:')) return trimmed;
  const digits = trimmed.replace(/[^\d+]/g, '');
  return digits || null;
}
