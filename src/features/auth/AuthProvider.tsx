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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setState({
          isLoading: false,
          session,
          user: session?.user ?? null,
        });
      }
    });

    async function restoreSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setState({
            isLoading: false,
            session: data.session,
            user: data.session?.user ?? null,
          });
        }
      } catch {
        if (isMounted) {
          setState({ isLoading: false, session: null, user: null });
        }
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
