import { Colors, type ColorSchemeName } from '@/theme/colors';
import { useColorScheme } from '@/theme/use-color-scheme';

export function useSchemeName(): ColorSchemeName {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  return Colors[useSchemeName()];
}
