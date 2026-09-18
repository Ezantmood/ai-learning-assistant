import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '../features/auth/AuthProvider';
import { queryClient } from '../lib/queryClient';
import { subscribeToSupabaseAutoRefresh } from '../lib/supabase';
import { useAppTheme } from '../theme/theme';

function ThemedPaperProvider({ children }: PropsWithChildren) {
  const theme = useAppTheme();

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
