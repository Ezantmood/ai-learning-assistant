import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';

import { AuthProvider } from '../features/auth/AuthProvider';
import { queryClient } from '../lib/queryClient';
import { subscribeToSupabaseAutoRefresh } from '../lib/supabase';
import { useAppTheme } from '../lib/theme';

function ThemedPaperProvider({ children }: PropsWithChildren) {
  const theme = useAppTheme();

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
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
