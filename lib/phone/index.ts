import { COUNTRIES, type Country } from './countries';

export { COUNTRIES, DEFAULT_COUNTRY, flagEmoji, type Country } from './countries';

// Dial codes sorted longest-first so detection prefers the most specific match
// (e.g. +593 Ecuador before +59x, +1 fallbacks last).
const BY_DIAL_LENGTH = [...COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

/** Keep only dialable characters. */
export function digitsOnly(input: string): string {
  return input.replace(/[^\d]/g, '');
}

/**
 * Detect the country for a number the user typed in international form
 * (starting with '+' or '00'). Returns null when there's no leading code to
 * match against — in that case the caller should fall back to the selected
 * country.
 */
export function detectCountry(input: string): Country | null {
  const intl = input.trim().replace(/^00/, '+');
  if (!intl.startsWith('+')) return null;
  const national = digitsOnly(intl);
  for (const c of BY_DIAL_LENGTH) {
    if (national.startsWith(c.dialCode)) return c;
  }
  return null;
}

/**
 * Group national digits for display, e.g. `3055551234` -> `305 555 1234`.
 * Uses the country's `groups` when present, then falls back to chunks of 3.
 */
export function formatNational(national: string, country?: Country): string {
  const digits = digitsOnly(national);
  if (!digits) return '';

  const out: string[] = [];
  let i = 0;
  for (const size of country?.groups ?? []) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + size));
    i += size;
  }
  // Remaining digits (or no groups defined): chunk in 3s.
  while (i < digits.length) {
    out.push(digits.slice(i, i + 3));
    i += 3;
  }
  return out.join(' ');
}

/**
 * Render a stored number (usually E.164) for display, e.g.
 * `+18299621624` -> `+1 (829) 962-1624`. Falls back to grouped national digits
 * for non-NANP countries, and to the raw input when no country is detected.
 */
export function prettyE164(input: string): string {
  if (!input) return '';
  const country = detectCountry(input);
  const digits = digitsOnly(input);
  if (!country) return input.startsWith('+') ? input : `+${digits}`;
  const national = digits.slice(country.dialCode.length);
  if (country.dialCode === '1' && national.length === 10) {
    return `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
  }
  return `+${country.dialCode} ${formatNational(national, country)}`.trim();
}

export interface ParsedNumber {
  /** Country used for display/dialing. */
  country: Country | null;
  /** National-significant digits (without the country code). */
  national: string;
  /** Pretty national form for the big display. */
  formatted: string;
  /** Full E.164 string to dial, or '' when there's nothing dialable. */
  e164: string;
}

/**
 * Resolve what the user is dialing.
 * - If `raw` is in international form, the leading code wins and we detect the
 *   country from it.
 * - Otherwise we treat `raw` as a national number under `selected`.
 */
export function parseNumber(raw: string, selected: Country | null): ParsedNumber {
  const trimmed = raw.trim();
  const detected = detectCountry(trimmed);

  if (detected) {
    const national = digitsOnly(trimmed).slice(detected.dialCode.length);
    return {
      country: detected,
      national,
      formatted: formatNational(national, detected),
      e164: `+${detected.dialCode}${national}`,
    };
  }

  const national = digitsOnly(trimmed);
  const country = selected;
  return {
    country,
    national,
    formatted: formatNational(national, country ?? undefined),
    e164: country && national ? `+${country.dialCode}${national}` : '',
  };
}
