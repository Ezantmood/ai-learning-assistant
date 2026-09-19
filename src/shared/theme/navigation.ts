import { DarkTheme as ExpoDarkTheme, DefaultTheme as ExpoLightTheme } from 'expo-router';
import { useColorScheme } from 'react-native';
import { adaptNavigationTheme } from 'react-native-paper';

import { darkTheme, lightTheme } from './theme';

/**
 * Theme navigation duy nhất của app (G6.1), suy ra từ theme MD3 G6.
 *
 * Nguyên nhân: expo-router dùng navigation theme độc lập với Paper theme —
 * mặc định là light (nền trắng) nên header navigator nền light + flash
 * trắng khi chuyển màn dù app đang dark theme.
 *
 * Lưu ý kỹ thuật:
 * - `ThemeProvider`/`DefaultTheme`/`DarkTheme` import từ `expo-router`
 *   (Expo Router 57 vendor navigation core bên trong, không còn package
 *   `@react-navigation/native` riêng) — đúng tinh thần “dep sẵn của
 *   expo-router”, không cài thêm package.
 * - Expo theme dùng `ColorValue` cho colors nên không thỏa trực tiếp ràng
 *   buộc `NavigationTheme` (string) của `adaptNavigationTheme`; vì vậy dựng
 *   literal từ G6 theme (một nguồn duy nhất) rồi để `adaptNavigationTheme`
 *   map màu material → navigation. `fonts` giữ nguyên của expo để đúng
 *   shape runtime `ReactNavigation.Theme` mà native-stack đọc.
 */
function toNavigationInput(mode: 'dark' | 'light') {
  const source = mode === 'dark' ? darkTheme : lightTheme;

  return {
    colors: {
      background: source.colors.background,
      border: source.colors.outline,
      card: source.colors.surface,
      notification: source.colors.error,
      primary: source.colors.primary,
      text: source.colors.onSurface,
    },
    dark: mode === 'dark',
  };
}

const { DarkTheme: AdaptedDark, LightTheme: AdaptedLight } =
  adaptNavigationTheme({
    materialDark: darkTheme,
    materialLight: lightTheme,
    reactNavigationDark: toNavigationInput('dark'),
    reactNavigationLight: toNavigationInput('light'),
  });

export const navigationLightTheme: ReactNavigation.Theme = {
  ...AdaptedLight,
  fonts: ExpoLightTheme.fonts,
};

export const navigationDarkTheme: ReactNavigation.Theme = {
  ...AdaptedDark,
  fonts: ExpoDarkTheme.fonts,
};

/**
 * Light/dark theo useColorScheme, cùng logic với `useAppTheme` G6.
 * Dùng trong `ThemeProvider` ở root layout.
 */
export function useNavigationTheme(): ReactNavigation.Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? navigationDarkTheme : navigationLightTheme;
}
