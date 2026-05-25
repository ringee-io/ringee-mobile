import { Colors, type ThemeColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme ?? 'light'];
}
