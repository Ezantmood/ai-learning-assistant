import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Snackbar,
  Text,
} from 'react-native-paper';

import { FormTextField } from '../../components/FormTextField';
import { profileSchema, type ProfileFormValues } from './schemas';

export type ProfileViewStatus = 'error' | 'loading' | 'ready';

export type ProfileNotice = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
};

type ProfileViewProps = {
  avatarUrl: string | null;
  email: string;
  fullName: string;
  notice: ProfileNotice | null;
  onDismissNotice: () => void;
  onPickAvatar: () => void;
  onRetry: () => void;
  onSave: (values: ProfileFormValues) => void;
  saving: boolean;
  status: ProfileViewStatus;
  studentCode: string;
  uploading: boolean;
};

function initialOf(fullName: string, email: string): string {
  const fromName = fullName.trim().charAt(0);
  if (fromName) {
    return fromName.toUpperCase();
  }
  return email.charAt(0).toUpperCase() || '?';
}

/**
 * FR-04: khung hiển thị thuần (không gọi query/mutation trực tiếp) để
 * test render được 3 trạng thái loading / error / ready mà không cần mạng.
 */
export function ProfileView({
  avatarUrl,
  email,
  fullName,
  notice,
  onDismissNotice,
  onPickAvatar,
  onRetry,
  onSave,
  saving,
  status,
  studentCode,
  uploading,
}: ProfileViewProps) {
  const { control, handleSubmit, reset, setError } =
    useForm<ProfileFormValues>({
      defaultValues: { fullName, studentCode },
    });

  useEffect(() => {
    reset({ fullName, studentCode });
  }, [fullName, reset, studentCode]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Đang tải hồ sơ" size="large" />
        <Text variant="bodyMedium">Đang tải hồ sơ…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text variant="bodyMedium">Không tải được hồ sơ.</Text>
        <Button
          accessibilityLabel="Tải lại hồ sơ"
          accessibilityRole="button"
          mode="contained"
          onPress={onRetry}
        >
          Thử lại
        </Button>
      </View>
    );
  }

  const submit = (values: ProfileFormValues) => {
    const parsed = profileSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'fullName' || field === 'studentCode') {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    if (!saving) {
      onSave(parsed.data);
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <Card.Content style={styles.cardContent}>
          {avatarUrl ? (
            <Avatar.Image
              accessibilityLabel="Ảnh đại diện"
              size={80}
              source={{ uri: avatarUrl }}
            />
          ) : (
            <Avatar.Text
              accessibilityLabel="Ảnh đại diện mặc định"
              label={initialOf(fullName, email)}
              size={80}
            />
          )}
          <Text variant="titleMedium">{email}</Text>
          <Button
            accessibilityLabel="Đổi avatar"
            accessibilityRole="button"
            disabled={uploading}
            loading={uploading}
            mode="outlined"
            onPress={onPickAvatar}
          >
            Đổi avatar
          </Button>
        </Card.Content>
      </Card>

      <Controller
        control={control}
        name="fullName"
        render={({ field, fieldState }) => (
          <FormTextField
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
            autoCapitalize="none"
            fieldError={fieldState.error?.message}
            label="Mã sinh viên"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />

      <Button
        accessibilityLabel="Lưu hồ sơ"
        accessibilityRole="button"
        disabled={saving}
        loading={saving}
        mode="contained"
        onPress={handleSubmit(submit)}
      >
        Lưu
      </Button>

      <Snackbar
        action={
          notice?.actionLabel && notice.onAction
            ? { label: notice.actionLabel, onPress: notice.onAction }
            : undefined
        }
        onDismiss={onDismissNotice}
        visible={Boolean(notice)}
      >
        {notice?.message ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    alignItems: 'center',
    gap: 8,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
});
