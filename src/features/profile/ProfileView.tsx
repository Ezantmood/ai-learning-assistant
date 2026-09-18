import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Icon,
  Text,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../components/EmptyState';
import { FeedbackSnackbar } from '../../components/FeedbackSnackbar';
import { FormTextInput } from '../../components/FormTextInput';
import type { AppTheme } from '../../theme/theme';
import { radius, spacing } from '../../theme/spacing';
import { profileSchema, type ProfileFormValues } from './schemas';

export type ProfileViewStatus = 'error' | 'loading' | 'ready';

export type ProfileNotice = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  variant?: 'error' | 'info' | 'success';
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
  const theme = useTheme<AppTheme>();
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
        <EmptyState
          actionLabel="Thử lại"
          actionTestID="profile-retry"
          description="Kiểm tra mạng rồi thử lại."
          icon="alert-circle"
          onAction={onRetry}
          title="Không tải được hồ sơ."
        />
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
          <Pressable
            accessibilityHint="Mở thư viện ảnh để chọn ảnh mới"
            accessibilityLabel="Đổi ảnh đại diện"
            accessibilityRole="button"
            disabled={uploading}
            hitSlop={8}
            onPress={onPickAvatar}
            style={styles.avatarWrap}
            testID="avatar-picker"
          >
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
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              {uploading ? (
                <ActivityIndicator
                  accessibilityLabel="Đang tải ảnh lên"
                  color={theme.colors.onPrimary}
                  size={16}
                />
              ) : (
                <Icon
                  color={theme.colors.onPrimary}
                  size={16}
                  source="camera"
                />
              )}
            </View>
          </Pressable>
          <Text variant="titleMedium">{email}</Text>
          <Text variant="bodySmall">Chạm vào ảnh để đổi avatar</Text>
        </Card.Content>
      </Card>

      <Controller
        control={control}
        name="fullName"
        render={({ field, fieldState }) => (
          <FormTextInput
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
            autoCapitalize="none"
            fieldError={fieldState.error?.message}
            label="Mã sinh viên"
            leftIcon="badge-account-horizontal-outline"
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
        icon="content-save"
        loading={saving}
        mode="contained"
        onPress={handleSubmit(submit)}
        testID="profile-save"
      >
        Lưu
      </Button>

      <FeedbackSnackbar
        actionLabel={notice?.actionLabel}
        message={notice?.message ?? ''}
        onAction={notice?.onAction}
        onDismiss={onDismissNotice}
        variant={notice?.variant ?? 'info'}
        visible={Boolean(notice)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    minHeight: 44,
    minWidth: 44,
  },
  cameraBadge: {
    alignItems: 'center',
    borderRadius: radius.full,
    bottom: 0,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 28,
  },
  cardContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  container: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
});
