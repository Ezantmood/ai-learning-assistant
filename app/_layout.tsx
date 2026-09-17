import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';

import { AppProviders } from '../src/providers/AppProviders';

// Giữ splash cho tới khi AuthProvider khôi phục session xong (cổng khởi động G3).
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
