import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Banner, Button, Text } from 'react-native-paper';

import { FormTextInput } from '../../src/shared/components/FormTextInput';
import { ScreenContainer } from '../../src/shared/components/ScreenContainer';
import { ScreenHeader } from '../../src/shared/components/ScreenHeader';
import { goBackOrReplace } from '../../src/shared/lib/navigation';
import { requestPasswordReset } from '../../src/features/auth/api';
import { toAuthErrorMessage } from '../../src/features/auth/errors';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../../src/features/auth/schemas';
import {
  getPendingRecoveryEmail,
  savePendingRecovery,
} from '../../src/features/auth/recoveryStorage';

/**
 * FR-03 bước 1: nhập email → resetPasswordForEmail gửi mã OTP 6 số.
 * Luôn hiện thông báo trung tính khi gửi xong, không tiết lộ email
 * có tồn tại hay không (Supabase cũng không trả thông tin này).
 */
const NEUTRAL_MESSAGE =
  'Nếu email này đã đăng ký, mã OTP 6 số đã được gửi. Kiểm tra hộp thư (kể cả mục Spam) rồi nhập mã để tiếp tục.';

export default function ForgotPasswordScreen() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const { control, handleSubmit, setError, setValue } =
    useForm<ForgotPasswordFormValues>({
      defaultValues: { email: '' },
    });

  // Thoát app giữa luồng rồi quay lại: điền sẵn email lần trước.
  useEffect(() => {
    void getPendingRecoveryEmail().then((email) => {
      if (email) {
        setValue('email', email);
      }
    });
  }, [setValue]);

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      requestPasswordReset(values.email),
    onError: (error: unknown) => {
      setApiError(toAuthErrorMessage(error));
      setSentEmail(null);
    },
    onMutate: () => {
      setApiError(null);
    },
    onSuccess: (_data, values) => {
      const email = values.email.trim();
      void savePendingRecovery(email, Date.now());
      setSentEmail(email);
    },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    const parsed = forgotPasswordSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'email') {
          setError('email', { message: issue.message });
        }
      }
      return;
    }

    if (!mutation.isPending) {
      mutation.mutate(parsed.data);
    }
  };

  return (
    <ScreenContainer
      header={
        <ScreenHeader
          onBack={() => goBackOrReplace(router, '/sign-in')}
          showBack
          title="Quên mật khẩu"
        />
      }
    >
      <Text variant="headlineSmall">Quên mật khẩu</Text>
      <Text variant="bodyMedium">
        Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP 6 số để đặt lại mật khẩu.
      </Text>

      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
        </Banner>
      ) : null}

      {sentEmail ? (
        <>
          <Banner icon="email-check" visible>
            {NEUTRAL_MESSAGE}
          </Banner>
          <Button
            accessibilityLabel="Nhập mã OTP"
            accessibilityRole="button"
            icon="numeric"
            mode="contained"
            onPress={() =>
              // push để Back quay lại sửa email được.
              router.push({
                params: { email: sentEmail },
                pathname: '/verify-reset-otp',
              })
            }
          >
            Nhập mã OTP
          </Button>
          <Button
            accessibilityLabel="Dùng email khác"
            accessibilityRole="button"
            mode="text"
            onPress={() => setSentEmail(null)}
          >
            Dùng email khác
          </Button>
        </>
      ) : (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FormTextInput
                autoCapitalize="none"
                fieldError={fieldState.error?.message}
                keyboardType="email-address"
                label="Email"
                leftIcon="email-outline"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />

          <Button
            accessibilityLabel="Gửi mã OTP"
            accessibilityRole="button"
            disabled={mutation.isPending}
            icon="send"
            loading={mutation.isPending}
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            testID="forgot-submit"
          >
            Gửi mã OTP
          </Button>

          <Link asChild href="/sign-in">
            <Button
              accessibilityLabel="Quay lại đăng nhập"
              accessibilityRole="button"
              mode="text"
            >
              Quay lại đăng nhập
            </Button>
          </Link>
        </>
      )}
    </ScreenContainer>
  );
}
