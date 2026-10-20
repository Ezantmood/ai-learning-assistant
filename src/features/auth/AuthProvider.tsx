import type { Session, User } from '@supabase/supabase-js';
import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { supabase } from '../../shared/lib/supabase';
import { queryClient } from '../../shared/lib/queryClient';

type AuthState = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
};

const initialState: AuthState = {
  isLoading: true,
  session: null,
  user: null,
};

export const AuthContext = createContext<AuthState>(initialState);

/**
 * Nguồn sự thật duy nhất về session (G3).
 * - Một subscription onAuthStateChange duy nhất, cleanup khi unmount.
 * - Cổng khởi động: giữ splash cho tới khi getSession() xong nên app
 *   không bao giờ nháy màn hình đăng nhập với user đã login.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let isMounted = true;
    let activeUserId: string | null | undefined;
    const acceptSession = (session: Session | null) => {
      if (!isMounted) return;
      const userId = session?.user.id ?? null;
      // FR-05: hết phiên/đổi tài khoản cũng dọn cache, không chỉ nút Đăng xuất.
      if (activeUserId !== userId) queryClient.clear();
      activeUserId = userId;
      setState({ isLoading: false, session, user: session?.user ?? null });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      acceptSession(session);
    });

    async function restoreSession() {
      try {
        const { data } = await supabase.auth.getSession();
        acceptSession(data.session);
      } catch {
        acceptSession(null);
      } finally {
        await SplashScreen.hideAsync().catch(() => undefined);
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);

  if (state.isLoading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
