import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';

type SessionState = {
  isLoading: boolean;
  session: Session | null;
};

export function useSession() {
  const [state, setState] = useState<SessionState>({
    isLoading: true,
    session: null,
  });

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setState({ isLoading: false, session });
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setState({ isLoading: false, session: data.session });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
