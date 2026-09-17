import { useColorScheme } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

/**
 * Bộ token theme duy nhất của app (G3).
 * Sáng/tối theo hệ điều hành, mọi màn hình dùng useAppTheme().
 */
export function useAppTheme(): MD3Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
