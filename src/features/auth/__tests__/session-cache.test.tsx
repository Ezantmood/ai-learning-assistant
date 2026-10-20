import { afterEach, expect, it, jest } from '@jest/globals';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import { AuthProvider } from '../AuthProvider';
import { queryClient } from '../../../shared/lib/queryClient';

let mockAuthEvent: (event: AuthChangeEvent, session: Session | null) => void;
jest.mock('../../../shared/lib/supabase', () => ({ supabase: { auth: {
  onAuthStateChange: (callback: typeof mockAuthEvent) => { mockAuthEvent = callback; return { data: { subscription: { unsubscribe: jest.fn() } } }; },
  getSession: async () => ({ data: { session: null } }),
} } }));
jest.mock('expo-splash-screen', () => ({ hideAsync: async () => undefined }));
let tree: ReturnType<typeof create>;
afterEach(() => { act(() => tree?.unmount()); queryClient.clear(); });
it('FR-05: hết phiên/đổi user xóa cache A; refresh cùng user giữ cache', async () => {
  await act(async () => { tree = create(<AuthProvider><Text>App</Text></AuthProvider>); });
  const a = { user: { id: 'a' } } as Session;
  const b = { user: { id: 'b' } } as Session;
  act(() => mockAuthEvent('SIGNED_IN', a));
  queryClient.setQueryData(['document', 'private-a'], { text: 'Dữ liệu giả A' });
  act(() => mockAuthEvent('TOKEN_REFRESHED', a));
  expect(queryClient.getQueryData(['document', 'private-a'])).toBeDefined();
  act(() => mockAuthEvent('SIGNED_OUT', null));
  expect(queryClient.getQueryData(['document', 'private-a'])).toBeUndefined();
  act(() => mockAuthEvent('SIGNED_IN', a));
  queryClient.setQueryData(['summary', 'private-a'], 'Bản giả A');
  act(() => mockAuthEvent('SIGNED_IN', b));
  expect(queryClient.getQueryData(['summary', 'private-a'])).toBeUndefined();
});
