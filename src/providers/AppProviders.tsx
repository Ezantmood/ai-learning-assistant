import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';

import { queryClient } from '../lib/queryClient';
import { subscribeToSupabaseAutoRefresh } from '../lib/supabase';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => subscribeToSupabaseAutoRefresh(), []);

  return (
    <PaperProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PaperProvider>
  );
}
