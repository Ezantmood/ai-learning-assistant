import { useMutation } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Banner, Button, Text } from 'react-native-paper';

import { FormTextInput } from '../../src/components/FormTextInput';
import { PasswordInput } from '../../src/components/PasswordInput';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { signIn } from '../../src/features/auth/api';
import { toAuthErrorMessage } from '../../src/features/auth/errors';
import {
  signInSchema,
  type SignInFormValues,
} from '../../src/features/auth/schemas';

export default function SignInScreen() {
  const params = useLocalSearchParams<{ passwordReset?: string }>();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, setError } = useForm<SignInFormValues>({
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: signIn,
    onError: (error: unknown) => {
      setApiError(toAuthErrorMessage(error));
    },
    onMutate: () => {
      setApiError(null);
    },
    onSuccess: () => {
      // replace để nút Back không quay về sign-in sau khi login.
      router.replace('/notes');
    },
  });

  const onSubmit = (values: SignInFormValues) => {
    const parsed = signInSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') {
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
      <Text variant="headlineSmall">Đăng nhập</Text>
      <Text variant="bodyMedium">
        Dùng email và mật khẩu đã đăng ký để vào ghi chú học tập.
      </Text>

      {params.passwordReset === 'done' ? (
        <Banner icon="check-circle" visible>
          Đặt lại mật khẩu thành công. Đăng nhập bằng mật khẩu mới.
        </Banner>
      ) : null}

      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
        </Banner>
      ) : null}

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

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordInput
            autoCapitalize="none"
            fieldError={fieldState.error?.message}
            label="Mật khẩu"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            toggleTestID="password-toggle"
            value={field.value}
          />
        )}
      />

      <Button
        accessibilityLabel="Đăng nhập"
        accessibilityRole="button"
        disabled={mutation.isPending}
        icon="login"
        loading={mutation.isPending}
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        testID="login-submit"
      >
        Đăng nhập
      </Button>

      <Link asChild href="/forgot-password">
        <Button
          accessibilityLabel="Quên mật khẩu"
          accessibilityRole="button"
          mode="text"
        >
          Quên mật khẩu?
        </Button>
      </Link>

      <Link asChild href="/sign-up">
        <Button
          accessibilityLabel="Chuyển sang đăng ký"
          accessibilityRole="button"
          mode="text"
        >
          Chưa có tài khoản? Đăng ký
        </Button>
      </Link>
    </ScreenContainer>
  );
}
