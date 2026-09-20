import { useMutation } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { Banner, Button, Text } from 'react-native-paper';

import { FormTextInput } from '../../src/shared/components/FormTextInput';
import { LoadingState } from '../../src/shared/components/LoadingState';
import { ScreenContainer } from '../../src/shared/components/ScreenContainer';
import { ScreenHeader } from '../../src/shared/components/ScreenHeader';
import { goBackOrReplace } from '../../src/shared/lib/navigation';
import {
  requestPasswordReset,
  verifyRecoveryOtp,
} from '../../src/features/auth/api';
import { toAuthErrorMessage } from '../../src/features/auth/errors';
import {
  getResendCooldownRemaining,
  RESEND_COOLDOWN_SECONDS,
} from '../../src/features/auth/recovery';
import {
  getPendingRecoveryEmail,
  getRecoverySentAt,
  savePendingRecovery,
} from '../../src/features/auth/recoveryStorage';
import { otpSchema } from '../../src/features/auth/schemas';

type VerifyFormValues = {
  code: string;
};

/**
 * FR-03 bước 2: nhập mã OTP 6 số → verifyOtp type recovery.
 * Một ô numeric tự focus, hỗ trợ paste; nút gửi lại khóa 60 giây.
 */
export default function VerifyResetOtpScreen() {
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState<string | null>(params.email ?? null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [wasRestored, setWasRestored] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const { control, handleSubmit, setError } = useForm<VerifyFormValues>({
    defaultValues: { code: '' },
  });

  // Email ưu tiên từ forgot-password; nếu thoát app giữa luồng thì
  // đọc email + thời điểm gửi mã đã lưu để tiếp tục và giữ cooldown.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [storedEmail, sentAt] = await Promise.all([
        getPendingRecoveryEmail(),
        getRecoverySentAt(),
      ]);

      if (cancelled) {
        return;
      }

      const target = params.email ?? storedEmail;

      if (target) {
        setEmail(target);

        if (!params.email && storedEmail) {
          setWasRestored(true);
        }

        if (sentAt !== null) {
          setCooldown(getResendCooldownRemaining(sentAt, Date.now()));
        }
      }

      setIsLoaded(true);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.email]);

  const isCoolingDown = cooldown > 0;

  useEffect(() => {
    if (!isCoolingDown) {
      return;
    }

    const id = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [isCoolingDown]);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => verifyRecoveryOtp(email ?? '', code),
    onError: (error: unknown) => {
      setApiError(toAuthErrorMessage(error));
      setInfo(null);
    },
    onMutate: () => {
      setApiError(null);
      setInfo(null);
    },
    onSuccess: () => {
      router.push('/reset-password');
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => requestPasswordReset(email ?? ''),
    onError: (error: unknown) => {
      setApiError(toAuthErrorMessage(error));
      setInfo(null);
    },
    onMutate: () => {
      setApiError(null);
      setInfo(null);
    },
    onSuccess: () => {
      void savePendingRecovery(email ?? '', Date.now());
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setInfo('Đã gửi lại mã OTP 6 số. Kiểm tra hộp thư (kể cả mục Spam).');
    },
  });

  const isBusy = verifyMutation.isPending || resendMutation.isPending;

  const onSubmit = (values: VerifyFormValues) => {
    const parsed = otpSchema.safeParse(values.code);

    if (!parsed.success) {
      setError('code', { message: parsed.error.issues[0]?.message });
      return;
    }

    if (!email || verifyMutation.isPending) {
      return;
    }

    verifyMutation.mutate(parsed.data);
  };

  if (!isLoaded) {
    return <LoadingState message="Đang tải thông tin xác minh…" />;
  }

  if (!email) {
    return (
      <ScreenContainer
        header={
          <ScreenHeader
            onBack={() => goBackOrReplace(router, '/sign-in')}
            showBack
            title="Xác minh OTP"
          />
        }
      >
        <Text variant="headlineSmall">Xác minh mã OTP</Text>
        <Banner icon="alert-circle" visible>
          Không tìm thấy email cần xác minh. Có thể bạn đã thoát app trước khi
          nhận mã — nhập lại email để nhận mã mới.
        </Banner>
        <Link asChild href="/forgot-password">
          <Button
            accessibilityLabel="Quay lại nhập email"
            accessibilityRole="button"
            mode="contained"
          >
            Nhập lại email
          </Button>
        </Link>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text variant="headlineSmall">Xác minh mã OTP</Text>
      <Text variant="bodyMedium">
        Nhập mã 6 số đã gửi tới {email}. Mỗi mã chỉ dùng một lần.
      </Text>

      {wasRestored ? (
        <Banner icon="history" visible>
          Đã khôi phục email từ lần trước. Nhập mã đã nhận hoặc nhấn Gửi lại mã.
        </Banner>
      ) : null}

      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
        </Banner>
      ) : null}

      {info ? (
        <Banner icon="email-check" visible>
          {info}
        </Banner>
      ) : null}

      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <FormTextInput
            autoCapitalize="none"
            autoComplete="sms-otp"
            autoFocus
            contentStyle={styles.otpInput}
            fieldError={fieldState.error?.message}
            keyboardType="number-pad"
            label="Mã OTP 6 số"
            leftIcon="numeric"
            maxLength={6}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            testID="otp-input"
            textContentType="oneTimeCode"
            value={field.value}
          />
        )}
      />

      <Button
        accessibilityLabel="Xác minh mã OTP"
        accessibilityRole="button"
        disabled={isBusy}
        icon="check"
        loading={verifyMutation.isPending}
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        testID="otp-submit"
      >
        Xác minh
      </Button>

      <Button
        accessibilityLabel={
          isCoolingDown
            ? `Gửi lại mã sau ${cooldown} giây`
            : 'Gửi lại mã OTP'
        }
        accessibilityRole="button"
        disabled={isBusy || isCoolingDown}
        icon="refresh"
        loading={resendMutation.isPending}
        mode="outlined"
        onPress={() => {
          if (!resendMutation.isPending && !isCoolingDown) {
            resendMutation.mutate();
          }
        }}
        testID="otp-resend"
      >
        {isCoolingDown ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
      </Button>

      <Link asChild href="/forgot-password">
        <Button
          accessibilityLabel="Đổi email khác"
          accessibilityRole="button"
          mode="text"
        >
          Dùng email khác
        </Button>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  otpInput: {
    letterSpacing: 8,
    textAlign: 'center',
  },
});
