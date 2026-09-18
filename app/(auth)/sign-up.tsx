import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Banner, Button, ProgressBar, Text } from 'react-native-paper';

import { FormTextInput } from '../../src/components/FormTextInput';
import { PasswordInput } from '../../src/components/PasswordInput';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { signUp } from '../../src/features/auth/api';
import { toAuthErrorMessage } from '../../src/features/auth/errors';
import {
  getPasswordStrength,
  signUpSchema,
  type SignUpFormValues,
} from '../../src/features/auth/schemas';
import { env } from '../../src/lib/env';
import { spacing } from '../../src/theme/spacing';

export default function SignUpScreen() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const { control, handleSubmit, setError, watch } =
    useForm<SignUpFormValues>({
      defaultValues: {
        confirmPassword: '',
        email: '',
        fullName: '',
        password: '',
        studentCode: '',
      },
    });

  const mutation = useMutation({
    mutationFn: signUp,
    onError: (error: unknown) => {
      setApiError(toAuthErrorMessage(error));
    },
    onMutate: () => {
      setApiError(null);
      setNeedsConfirm(false);
    },
    onSuccess: (result) => {
      if (result.needsEmailConfirmation) {
        setNeedsConfirm(true);
        return;
      }
      router.replace('/notes');
    },
  });

  const onSubmit = (values: SignUpFormValues) => {
    const parsed = signUpSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === 'confirmPassword' ||
          field === 'email' ||
          field === 'fullName' ||
          field === 'password' ||
          field === 'studentCode'
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

  const strength = getPasswordStrength(watch('password') ?? '');

  return (
    <ScreenContainer>
      <Text variant="headlineSmall">Tạo tài khoản</Text>
      <Text variant="bodyMedium">
        Email, mã sinh viên và mật khẩu từ 8 ký tự có cả chữ và số.
      </Text>

      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
        </Banner>
      ) : null}

      {needsConfirm ? (
        <Banner icon="email-check" visible>
          {env.requireEmailConfirmation
            ? 'Tài khoản đã được tạo. Kiểm tra hộp thư để xác nhận email rồi đăng nhập.'
            : 'Tài khoản đã được tạo. Hãy đăng nhập để tiếp tục.'}
        </Banner>
      ) : null}

      <Controller
        control={control}
        name="fullName"
        render={({ field, fieldState }) => (
          <FormTextInput
            autoCapitalize="words"
            fieldError={fieldState.error?.message}
            label="Họ tên"
            leftIcon="account"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="studentCode"
        render={({ field, fieldState }) => (
          <FormTextInput
            autoCapitalize="characters"
            fieldError={fieldState.error?.message}
            label="Mã sinh viên"
            leftIcon="badge-account-horizontal-outline"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />

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
            label="Nhập lại mật khẩu"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            toggleTestID="password-confirm-toggle"
            value={field.value}
          />
        )}
      />

      <Button
        accessibilityLabel="Đăng ký tài khoản"
        accessibilityRole="button"
        disabled={mutation.isPending}
        icon="account-plus"
        loading={mutation.isPending}
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        testID="register-submit"
      >
        Đăng ký
      </Button>

      <Link asChild href="/sign-in">
        <Button
          accessibilityLabel="Chuyển sang đăng nhập"
          accessibilityRole="button"
          mode="text"
        >
          Đã có tài khoản? Đăng nhập
        </Button>
      </Link>
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
