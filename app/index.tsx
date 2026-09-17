import { Redirect } from 'expo-router';

import { FullScreenStatus } from '../src/components/FullScreenStatus';
import { useSession } from '../src/features/auth/useSession';

export default function IndexScreen() {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return <FullScreenStatus message="Đang khôi phục phiên đăng nhập…" />;
  }

  return <Redirect href={session ? '/notes' : '/sign-in'} />;
}
