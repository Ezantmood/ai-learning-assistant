import * as SplashScreen from 'expo-splash-screen';
import { Stack, ThemeProvider } from 'expo-router';

import { AppProviders } from '../src/providers/AppProviders';
import { ThemeModeProvider, useThemeMode } from '../src/theme/ThemeContext';

// Giữ splash cho tới khi AuthProvider khôi phục session xong (cổng khởi động G3).
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  // G7: ThemeModeProvider bọc ngoài cùng để PaperProvider (trong
  // AppProviders) và ThemeProvider navigation cùng ăn một theme.
  return (
    <ThemeModeProvider>
      <RootStack />
    </ThemeModeProvider>
  );
}

function RootStack() {
  // G6.1: navigation theme đồng bộ Paper theme (hết header light/flash
  // trắng); contentStyle nền theo theme cho mọi route.
  // G7: theme lấy từ context (theo lựa chọn light/dark/system của user),
  // không còn đọc useColorScheme trực tiếp ở đây.
  const { navigationTheme, theme } = useThemeMode();

  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: theme.colors.background },
            headerShown: false,
          }}
        />
      </ThemeProvider>
    </AppProviders>
  );
}
