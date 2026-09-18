import * as SplashScreen from 'expo-splash-screen';
import { Stack, ThemeProvider } from 'expo-router';

import { AppProviders } from '../src/providers/AppProviders';
import { useAppTheme } from '../src/theme/theme';
import { useNavigationTheme } from '../src/theme/navigation';

// Giữ splash cho tới khi AuthProvider khôi phục session xong (cổng khởi động G3).
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  // G6.1: navigation theme đồng bộ Paper theme (hết header light/flash
  // trắng); contentStyle nền theo theme cho mọi route.
  const theme = useAppTheme();
  const navigationTheme = useNavigationTheme();

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
