// Self-contained country dataset for the dialer. We intentionally avoid a heavy
// dependency (libphonenumber) — the dialer only needs a dial code, a flag, and a
// reasonable "as you type" grouping per country. `groups` describes how the
// national number is chunked for display (leftover digits are grouped in 3s).

export interface Country {
  /** ISO 3166-1 alpha-2, also used to derive the flag emoji. */
  iso2: string;
  name: string;
  /** Country calling code without the leading '+'. */
  dialCode: string;
  /** National-number display grouping, e.g. US [3,3,4] -> 305 555 1234. */
  groups?: number[];
}

// Curated list — the countries Ringee users dial most, kept short on purpose.
// Add more here as needed; everything else falls back to generic grouping.
export const COUNTRIES: Country[] = [
  { iso2: 'US', name: 'United States', dialCode: '1', groups: [3, 3, 4] },
  { iso2: 'CA', name: 'Canada', dialCode: '1', groups: [3, 3, 4] },
  { iso2: 'MX', name: 'Mexico', dialCode: '52', groups: [3, 3, 4] },
  { iso2: 'GB', name: 'United Kingdom', dialCode: '44', groups: [4, 6] },
  { iso2: 'ES', name: 'Spain', dialCode: '34', groups: [3, 3, 3] },
  { iso2: 'FR', name: 'France', dialCode: '33', groups: [1, 2, 2, 2, 2] },
  { iso2: 'DE', name: 'Germany', dialCode: '49', groups: [4, 7] },
  { iso2: 'IT', name: 'Italy', dialCode: '39', groups: [3, 3, 4] },
  { iso2: 'PT', name: 'Portugal', dialCode: '351', groups: [3, 3, 3] },
  { iso2: 'BR', name: 'Brazil', dialCode: '55', groups: [2, 5, 4] },
  { iso2: 'AR', name: 'Argentina', dialCode: '54', groups: [2, 4, 4] },
  { iso2: 'CO', name: 'Colombia', dialCode: '57', groups: [3, 3, 4] },
  { iso2: 'CL', name: 'Chile', dialCode: '56', groups: [1, 4, 4] },
  { iso2: 'PE', name: 'Peru', dialCode: '51', groups: [3, 3, 3] },
  { iso2: 'VE', name: 'Venezuela', dialCode: '58', groups: [3, 7] },
  { iso2: 'EC', name: 'Ecuador', dialCode: '593', groups: [2, 3, 4] },
  { iso2: 'GT', name: 'Guatemala', dialCode: '502', groups: [4, 4] },
  { iso2: 'DO', name: 'Dominican Republic', dialCode: '1', groups: [3, 3, 4] },
  { iso2: 'CR', name: 'Costa Rica', dialCode: '506', groups: [4, 4] },
  { iso2: 'PA', name: 'Panama', dialCode: '507', groups: [4, 4] },
  { iso2: 'NL', name: 'Netherlands', dialCode: '31', groups: [2, 8] },
  { iso2: 'BE', name: 'Belgium', dialCode: '32', groups: [3, 2, 2, 2] },
  { iso2: 'CH', name: 'Switzerland', dialCode: '41', groups: [2, 3, 2, 2] },
  { iso2: 'AT', name: 'Austria', dialCode: '43', groups: [3, 7] },
  { iso2: 'SE', name: 'Sweden', dialCode: '46', groups: [2, 3, 2, 2] },
  { iso2: 'NO', name: 'Norway', dialCode: '47', groups: [3, 2, 3] },
  { iso2: 'DK', name: 'Denmark', dialCode: '45', groups: [2, 2, 2, 2] },
  { iso2: 'FI', name: 'Finland', dialCode: '358', groups: [2, 3, 4] },
  { iso2: 'IE', name: 'Ireland', dialCode: '353', groups: [2, 3, 4] },
  { iso2: 'PL', name: 'Poland', dialCode: '48', groups: [3, 3, 3] },
  { iso2: 'RO', name: 'Romania', dialCode: '40', groups: [3, 3, 3] },
  { iso2: 'GR', name: 'Greece', dialCode: '30', groups: [3, 3, 4] },
  { iso2: 'RU', name: 'Russia', dialCode: '7', groups: [3, 3, 2, 2] },
  { iso2: 'TR', name: 'Turkey', dialCode: '90', groups: [3, 3, 2, 2] },
  { iso2: 'IL', name: 'Israel', dialCode: '972', groups: [2, 3, 4] },
  { iso2: 'AE', name: 'United Arab Emirates', dialCode: '971', groups: [2, 3, 4] },
  { iso2: 'SA', name: 'Saudi Arabia', dialCode: '966', groups: [2, 3, 4] },
  { iso2: 'ZA', name: 'South Africa', dialCode: '27', groups: [2, 3, 4] },
  { iso2: 'NG', name: 'Nigeria', dialCode: '234', groups: [3, 3, 4] },
  { iso2: 'EG', name: 'Egypt', dialCode: '20', groups: [3, 3, 4] },
  { iso2: 'IN', name: 'India', dialCode: '91', groups: [5, 5] },
  { iso2: 'PK', name: 'Pakistan', dialCode: '92', groups: [3, 7] },
  { iso2: 'CN', name: 'China', dialCode: '86', groups: [3, 4, 4] },
  { iso2: 'JP', name: 'Japan', dialCode: '81', groups: [2, 4, 4] },
  { iso2: 'KR', name: 'South Korea', dialCode: '82', groups: [2, 4, 4] },
  { iso2: 'HK', name: 'Hong Kong', dialCode: '852', groups: [4, 4] },
  { iso2: 'SG', name: 'Singapore', dialCode: '65', groups: [4, 4] },
  { iso2: 'MY', name: 'Malaysia', dialCode: '60', groups: [2, 4, 4] },
  { iso2: 'ID', name: 'Indonesia', dialCode: '62', groups: [3, 4, 4] },
  { iso2: 'PH', name: 'Philippines', dialCode: '63', groups: [3, 3, 4] },
  { iso2: 'TH', name: 'Thailand', dialCode: '66', groups: [2, 3, 4] },
  { iso2: 'VN', name: 'Vietnam', dialCode: '84', groups: [3, 4, 3] },
  { iso2: 'AU', name: 'Australia', dialCode: '61', groups: [3, 3, 3] },
  { iso2: 'NZ', name: 'New Zealand', dialCode: '64', groups: [2, 3, 4] },
];

/** Default selection — Ringee's shared outbound number is a US (+1) line. */
export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.iso2 === 'US') ?? COUNTRIES[0];

/** Derive the 🇺🇸-style flag emoji from an ISO2 code via regional indicators. */
export function flagEmoji(iso2: string): string {
  if (iso2.length !== 2) return '🏳️';
  const base = 0x1f1e6;
  const a = iso2.toUpperCase().charCodeAt(0) - 65;
  const b = iso2.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(base + a, base + b);
}
