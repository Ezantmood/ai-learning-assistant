import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Banner, Button, ProgressBar, Text, TextInput } from 'react-native-paper';

import { AppScreen } from '../../src/components/AppScreen';
import { FormTextField } from '../../src/components/FormTextField';
import { signUp } from '../../src/features/auth/api';
import { toAuthErrorMessage } from '../../src/features/auth/errors';
import {
  getPasswordStrength,
  signUpSchema,
  type SignUpFormValues,
} from '../../src/features/auth/schemas';
import { env } from '../../src/lib/env';
import { spacing } from '../../src/lib/theme';

export default function SignUpScreen() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <AppScreen>
      <Text variant="headlineMedium">Tạo tài khoản</Text>
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
          <FormTextField
            autoCapitalize="words"
            fieldError={fieldState.error?.message}
            label="Họ tên"
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
          <FormTextField
            autoCapitalize="characters"
            fieldError={fieldState.error?.message}
            label="Mã sinh viên"
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
          <FormTextField
            autoCapitalize="none"
            fieldError={fieldState.error?.message}
            keyboardType="email-address"
            label="Email"
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
          <FormTextField
            autoCapitalize="none"
            fieldError={fieldState.error?.message}
            label="Mật khẩu"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            right={
              <PasswordVisibilityIcon
                hidden={!showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
              />
            }
            secureTextEntry={!showPassword}
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
          <FormTextField
            autoCapitalize="none"
            fieldError={fieldState.error?.message}
            label="Nhập lại mật khẩu"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry={!showPassword}
            value={field.value}
          />
        )}
      />

      <Button
        accessibilityLabel="Đăng ký tài khoản"
        accessibilityRole="button"
        disabled={mutation.isPending}
        loading={mutation.isPending}
        mode="contained"
        onPress={handleSubmit(onSubmit)}
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
    </AppScreen>
  );
}

function PasswordVisibilityIcon({
  hidden,
  onToggle,
}: {
  hidden: boolean;
  onToggle: () => void;
}) {
  return (
    <TextInput.Icon
      accessibilityLabel={hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
      icon={hidden ? 'eye' : 'eye-off'}
      onPress={onToggle}
    />
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
