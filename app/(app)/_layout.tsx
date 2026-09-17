import { Redirect, Stack } from 'expo-router';

import { FullScreenStatus } from '../../src/components/FullScreenStatus';
import { useSession } from '../../src/features/auth/useSession';

export default function PrivateLayout() {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return <FullScreenStatus message="Đang kiểm tra phiên đăng nhập…" />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <Stack />;
}
