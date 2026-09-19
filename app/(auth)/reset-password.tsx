import { useMutation } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Banner, Button, ProgressBar, Text } from 'react-native-paper';

import { LoadingState } from '../../src/shared/components/LoadingState';
import { PasswordInput } from '../../src/shared/components/PasswordInput';
import { ScreenContainer } from '../../src/shared/components/ScreenContainer';
import { signOut, updatePassword } from '../../src/features/auth/api';
import { toAuthErrorMessage } from '../../src/features/auth/errors';
import {
  clearPendingRecovery,
  getPendingRecoveryEmail,
} from '../../src/features/auth/recoveryStorage';
import {
  getPasswordStrength,
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '../../src/features/auth/schemas';
import { useSession } from '../../src/features/auth/useSession';
import { spacing } from '../../src/shared/theme/spacing';

/**
 * FR-03 bước 3: đã có recovery session từ verifyOtp thì updateUser
 * mật khẩu mới (dùng lại schema G3 + ô confirm). Xong thì đăng xuất
 * recovery session và về /sign-in theo SPEC, kèm banner thành công.
 * Yêu cầu cả cờ pending (chống user đã login thường mở màn hình này
 * để đổi pass mà không cần mật khẩu hiện tại).
 */
export default function ResetPasswordScreen() {
  const { isLoading, session } = useSession();
  const [pendingEmail, setPendingEmail] = useState<string | null | undefined>(
    undefined,
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, setError, watch } =
    useForm<ResetPasswordFormValues>({
      defaultValues: { confirmPassword: '', newPassword: '' },
    });

  useEffect(() => {
    void getPendingRecoveryEmail().then(setPendingEmail);
  }, []);

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      updatePassword(values.newPassword),
    onError: (error: unknown) => {
      setApiError(toAuthErrorMessage(error));
    },
    onMutate: () => {
      setApiError(null);
    },
    onSuccess: () => {
      // Đăng xuất recovery session rồi về sign-in; banner thành công
      // hiện trên sign-in qua param. Không treo loading: mutation đã
      // settled trước khi đổi route.
      void clearPendingRecovery().finally(() => {
        void signOut().finally(() => {
          router.replace({
            params: { passwordReset: 'done' },
            pathname: '/sign-in',
          });
        });
      });
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    const parsed = resetPasswordSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'newPassword' || field === 'confirmPassword') {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    if (!mutation.isPending) {
      mutation.mutate(parsed.data);
    }
  };

  const strength = getPasswordStrength(watch('newPassword') ?? '');

  if (isLoading || pendingEmail === undefined) {
    return <LoadingState message="Đang kiểm tra phiên đặt lại mật khẩu…" />;
  }

  // Mất session (OTP hết hạn/kill app trước verify): quay lại nhập mã.
  if (!session) {
    return <Redirect href="/verify-reset-otp" />;
  }

  // Đã login thường nhưng không đi từ luồng quên mật khẩu: về ghi chú.
  if (!pendingEmail) {
    return <Redirect href="/notes" />;
  }

  return (
    <ScreenContainer>
      <Text variant="headlineSmall">Đặt mật khẩu mới</Text>
      <Text variant="bodyMedium">
        Email {pendingEmail} đã xác minh. Nhập mật khẩu mới từ 8 ký tự, có cả
        chữ và số.
      </Text>

      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
        </Banner>
      ) : null}

      <Controller
        control={control}
        name="newPassword"
        render={({ field, fieldState }) => (
          <PasswordInput
            autoCapitalize="none"
            fieldError={fieldState.error?.message}
            label="Mật khẩu mới"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            toggleTestID="password-toggle"
            value={field.value}
          />
        )}
      />

      <View style={styles.strengthRow}>
        <ProgressBar
          accessibilityLabel={`Độ mạnh mật khẩu: ${strength.label}`}
          progress={strength.level / 3}
          style={styles.strengthBar}
        />
        <Text variant="bodySmall">Độ mạnh: {strength.label}</Text>
      </View>

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <PasswordInput
            autoCapitalize="none"
            fieldError={fieldState.error?.message}
            label="Nhập lại mật khẩu mới"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            toggleTestID="password-confirm-toggle"
            value={field.value}
          />
        )}
      />

      <Button
        accessibilityLabel="Đặt lại mật khẩu"
        accessibilityRole="button"
        disabled={mutation.isPending}
        icon="check"
        loading={mutation.isPending}
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        testID="reset-submit"
      >
        Đặt lại mật khẩu
      </Button>

      <Button
        accessibilityLabel="Để sau, về ghi chú"
        accessibilityRole="button"
        disabled={mutation.isPending}
        mode="text"
        onPress={() => {
          void clearPendingRecovery().finally(() => {
            router.replace('/notes');
          });
        }}
      >
        Để sau, về ghi chú
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  strengthBar: {
    flex: 1,
  },
  strengthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
