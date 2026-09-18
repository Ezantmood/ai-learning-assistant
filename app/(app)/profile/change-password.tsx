import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Banner, Button, Text } from 'react-native-paper';

import { PasswordInput } from '../../../src/components/PasswordInput';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { changePassword } from '../../../src/features/auth/api';
import { toAuthErrorMessage } from '../../../src/features/auth/errors';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '../../../src/features/auth/schemas';

/**
 * FR-03 bổ sung: user đã đăng nhập đổi mật khẩu. Bắt buộc nhập mật khẩu
 * hiện tại để xác thực lại (signInWithPassword) rồi mới updateUser.
 */
export default function ChangePasswordScreen() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const { control, handleSubmit, setError } =
    useForm<ChangePasswordFormValues>({
      defaultValues: { confirmPassword: '', currentPassword: '', newPassword: '' },
    });

  const mutation = useMutation({
    mutationFn: changePassword,
    onError: (error: unknown) => {
      setApiError(toAuthErrorMessage(error, { flow: 'change-password' }));
      setIsDone(false);
    },
    onMutate: () => {
      setApiError(null);
      setIsDone(false);
    },
    onSuccess: () => {
      setIsDone(true);
    },
  });

  const onSubmit = (values: ChangePasswordFormValues) => {
    const parsed = changePasswordSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === 'currentPassword' ||
          field === 'newPassword' ||
          field === 'confirmPassword'
        ) {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    if (!mutation.isPending) {
      mutation.mutate(parsed.data);
    }
  };

  return (
    <ScreenContainer>
      <Text variant="headlineSmall">Đổi mật khẩu</Text>
      <Text variant="bodyMedium">
        Nhập mật khẩu hiện tại để xác nhận, rồi đặt mật khẩu mới.
      </Text>

      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
        </Banner>
      ) : null}

      {isDone ? (
        <>
          <Banner icon="check-circle" visible>
            Đổi mật khẩu thành công. Lần đăng nhập sau dùng mật khẩu mới.
          </Banner>
          <Button
            accessibilityLabel="Về hồ sơ"
            accessibilityRole="button"
            icon="account"
            mode="contained"
            onPress={() => router.replace('/profile')}
          >
            Về hồ sơ
          </Button>
        </>
      ) : (
        <>
          <Controller
            control={control}
            name="currentPassword"
            render={({ field, fieldState }) => (
              <PasswordInput
                autoCapitalize="none"
                fieldError={fieldState.error?.message}
                label="Mật khẩu hiện tại"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                toggleTestID="password-current-toggle"
                value={field.value}
              />
            )}
          />

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
            accessibilityLabel="Xác nhận đổi mật khẩu"
            accessibilityRole="button"
            disabled={mutation.isPending}
            icon="lock-reset"
            loading={mutation.isPending}
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            testID="change-password-submit"
          >
            Đổi mật khẩu
          </Button>
        </>
      )}
    </ScreenContainer>
  );
}
