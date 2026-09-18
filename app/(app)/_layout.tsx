import { Redirect, Stack } from 'expo-router';

import { LoadingState } from '../../src/components/LoadingState';
import { useSession } from '../../src/features/auth/useSession';
import { useAppTheme } from '../../src/theme/theme';

export default function PrivateLayout() {
  const { isLoading, session } = useSession();
  // G6.1: tắt header navigator (trước đây hiện tên file route, chồng với
  // Paper Appbar ở màn Notes); header duy nhất là Paper Appbar từng màn.
  const theme = useAppTheme();

  if (isLoading) {
    return <LoadingState message="Đang kiểm tra phiên đăng nhập…" />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerShown: false,
      }}
    />
  );
}
