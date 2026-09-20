import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { LoadingState } from '../src/shared/components/LoadingState';
import { getPendingRecoveryEmail } from '../src/features/auth/recoveryStorage';
import { useSession } from '../src/features/auth/useSession';
import { decideRouteTarget } from '../src/shared/lib/navigation';

export default function IndexScreen() {
  const { isLoading, session } = useSession();
  const [pendingEmail, setPendingEmail] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    void getPendingRecoveryEmail().then(setPendingEmail);
  }, []);

  // Thoát app sau khi verify OTP rồi mở lại: recovery session còn hiệu
  // lực + cờ pending còn → tiếp tục đặt mật khẩu thay vì vào tabs.
  const target = decideRouteTarget({
    hasSession: Boolean(session),
    isLoading,
    recovery:
      pendingEmail === undefined
        ? 'unknown'
        : pendingEmail
          ? 'pending'
          : 'none',
  });

  if (target === 'loading') {
    return <LoadingState message="Đang khôi phục phiên đăng nhập…" />;
  }

  if (target === 'recovery') {
    return <Redirect href="/reset-password" />;
  }

  return <Redirect href={target === 'app' ? '/dashboard' : '/sign-in'} />;
}
