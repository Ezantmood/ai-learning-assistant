import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { PaperProvider } from 'react-native-paper';

import { queryClient } from '../lib/queryClient';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <PaperProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PaperProvider>
  );
}
