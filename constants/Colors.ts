/**
 * Ringee Mobile theme tokens.
 *
 * Ringee's web product is intentionally monochrome (near-black primary, neutral
 * grays, sparing accent colors). The mobile theme mirrors that — sharp, premium,
 * B2B SaaS — and adds platform-friendly call/missed/success/warning accents.
 */

export const Palette = {
  // Brand & neutrals
  black: '#0A0A0A',
  ink: '#171717',
  charcoal: '#262626',
  graphite: '#404040',
  steel: '#525252',
  slate: '#737373',
  mute: '#A3A3A3',
  hairline: '#E5E5E5',
  whisper: '#F5F5F5',
  off: '#FAFAFA',
  white: '#FFFFFF',

  // Status / semantic
  call: '#10B981',
  callPressed: '#059669',
  missed: '#EF4444',
  missedSoft: '#FEE2E2',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',
  meeting: '#6366F1',
  meetingSoft: '#E0E7FF',
} as const;

interface Theme {
  text: string;
  textMuted: string;
  textSubtle: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  tint: string;
  icon: string;
  iconMuted: string;
  tabIconDefault: string;
  tabIconSelected: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  call: string;
  missed: string;
  warning: string;
  meeting: string;
}

export const Colors: { light: Theme; dark: Theme } = {
  light: {
    text: Palette.black,
    textMuted: Palette.slate,
    textSubtle: Palette.steel,
    background: Palette.white,
    surface: Palette.off,
    surfaceElevated: Palette.white,
    border: Palette.hairline,
    borderStrong: '#D4D4D4',
    tint: Palette.black,
    icon: Palette.steel,
    iconMuted: Palette.mute,
    tabIconDefault: Palette.mute,
    tabIconSelected: Palette.black,
    primary: Palette.black,
    primaryForeground: Palette.white,
    accent: Palette.info,
    call: Palette.call,
    missed: Palette.missed,
    warning: Palette.warning,
    meeting: Palette.meeting,
  },
  dark: {
    text: Palette.off,
    textMuted: Palette.mute,
    textSubtle: '#D4D4D4',
    background: '#0B0B0B',
    surface: '#141414',
    surfaceElevated: '#1A1A1A',
    border: '#262626',
    borderStrong: '#333333',
    tint: Palette.white,
    icon: Palette.mute,
    iconMuted: Palette.steel,
    tabIconDefault: Palette.steel,
    tabIconSelected: Palette.white,
    primary: Palette.white,
    primaryForeground: Palette.black,
    accent: '#60A5FA',
    call: '#34D399',
    missed: '#F87171',
    warning: '#FBBF24',
    meeting: '#818CF8',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = Theme;
