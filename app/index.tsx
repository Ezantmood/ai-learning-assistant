import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { LoadingState } from '../src/shared/components/LoadingState';
import { getPendingRecoveryEmail } from '../src/features/auth/recoveryStorage';
import { useSession } from '../src/features/auth/useSession';

export default function IndexScreen() {
  const { isLoading, session } = useSession();
  const [pendingEmail, setPendingEmail] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    void getPendingRecoveryEmail().then(setPendingEmail);
  }, []);

  if (isLoading || pendingEmail === undefined) {
    return <LoadingState message="Đang khôi phục phiên đăng nhập…" />;
  }

  // Thoát app sau khi verify OTP rồi mở lại: recovery session còn hiệu
  // lực + cờ pending còn → tiếp tục đặt mật khẩu thay vì vào ghi chú.
  if (session && pendingEmail) {
    return <Redirect href="/reset-password" />;
  }

  return <Redirect href={session ? '/notes' : '/sign-in'} />;
}
