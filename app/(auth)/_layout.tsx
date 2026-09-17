import { Redirect, Stack } from 'expo-router';

import { FullScreenStatus } from '../../src/components/FullScreenStatus';
import { useSession } from '../../src/features/auth/useSession';

export default function AuthLayout() {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return <FullScreenStatus message="Đang kiểm tra phiên đăng nhập…" />;
  }

  if (session) {
    return <Redirect href="/notes" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
