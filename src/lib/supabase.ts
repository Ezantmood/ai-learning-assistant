import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from './env';

export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      AsyncStorage: true,
      persistSession: true,
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    },
  },
);

export function subscribeToSupabaseAutoRefresh() {
  if (Platform.OS === 'web') {
    return () => undefined;
  }

  if (AppState.currentState === 'active') {
    supabase.auth.startAutoRefresh();
  }

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
      return;
    }

    supabase.auth.stopAutoRefresh();
  });

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
  };
}
