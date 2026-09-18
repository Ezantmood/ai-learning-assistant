import { Redirect, Stack, usePathname } from 'expo-router';

import { FullScreenStatus } from '../../src/components/FullScreenStatus';
import { useSession } from '../../src/features/auth/useSession';

// verifyOtp type recovery tạo session ngay khi xác minh xong. Giữ session
// đó ở lại hai màn hình recovery để kịp đặt mật khẩu mới (FR-03);
// reset-password tự kiểm thêm cờ pending để user login thường không
// dùng ké màn hình này.
const RECOVERY_PATHS = ['/reset-password', '/verify-reset-otp'];

export default function AuthLayout() {
  const { isLoading, session } = useSession();
  const pathname = usePathname();

  if (isLoading) {
    return <FullScreenStatus message="Đang kiểm tra phiên đăng nhập…" />;
  }

  if (session && !RECOVERY_PATHS.includes(pathname)) {
    return <Redirect href="/notes" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
