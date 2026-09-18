import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '../features/auth/AuthProvider';
import { queryClient } from '../lib/queryClient';
import { subscribeToSupabaseAutoRefresh } from '../lib/supabase';
import { useThemeMode } from '../theme/ThemeContext';

function ThemedPaperProvider({ children }: PropsWithChildren) {
  // G7: theme từ ThemeModeProvider (lựa chọn light/dark/system của user),
  // StatusBar giữ một chỗ duy nhất tại đây, đổi theo theme hiệu lực.
  const { theme } = useThemeMode();

  return (
    // G6: Paper mặc định resolve icon qua react-native-vector-icons (không có
    // trong Expo Go) nên icon render rỗng im lặng. Cầu nối sang
    // MaterialCommunityIcons của @expo/vector-icons để icon hiện đủ.
    <PaperProvider
      settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }}
      theme={theme}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {children}
    </PaperProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => subscribeToSupabaseAutoRefresh(), []);

  return (
    <ThemedPaperProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ThemedPaperProvider>
  );
}
