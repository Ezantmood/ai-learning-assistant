import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { ThemeSettingsCard } from '../../../src/components/ThemeSettingsCard';
import { ThemeToggleAction } from '../../../src/components/ThemeToggleAction';
import { signOut } from '../../../src/features/auth/api';
import { toAuthErrorMessage } from '../../../src/features/auth/errors';
import { useSession } from '../../../src/features/auth/useSession';
import {
  toAvatarErrorMessage,
  toProfileErrorMessage,
} from '../../../src/features/profile/errors';
import { pickAndPrepareAvatar } from '../../../src/features/profile/pickAvatar';
import {
  ProfileView,
  type ProfileNotice,
  type ProfileViewStatus,
} from '../../../src/features/profile/ProfileView';
import {
  useAvatarUrl,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '../../../src/features/profile/queries';
import type { ProfileFormValues } from '../../../src/features/profile/schemas';
import { spacing } from '../../../src/theme/spacing';
import type { AppTheme } from '../../../src/theme/theme';

/**
 * FR-04: xem/sửa hồ sơ + avatar, đăng xuất.
 * Screen chỉ điều phối query/mutation; khung hiển thị nằm ở ProfileView.
 */
export default function ProfileScreen() {
  const theme = useTheme<AppTheme>();
  const { user } = useSession();
  const userId = user?.id;
  const [notice, setNotice] = useState<ProfileNotice | null>(null);

  const profileQuery = useProfile(userId);
  const avatarQuery = useAvatarUrl(
    userId,
    profileQuery.data?.avatar_path ?? null,
  );
  const updateMutation = useUpdateProfile(userId ?? '');
  const uploadMutation = useUploadAvatar(userId ?? '');

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onError: (error: unknown) => {
      setNotice({ message: toAuthErrorMessage(error), variant: 'error' });
    },
    onSuccess: () => {
      router.replace('/sign-in');
    },
  });

  const status: ProfileViewStatus = profileQuery.isPending
    ? 'loading'
    : profileQuery.isError
      ? 'error'
      : 'ready';

  const handleSave = (values: ProfileFormValues) => {
    if (!userId || updateMutation.isPending) {
      return;
    }
    updateMutation.mutate(values, {
      onError: (error: unknown) => {
        setNotice({ message: toProfileErrorMessage(error), variant: 'error' });
      },
      onSuccess: () => {
        setNotice({ message: 'Đã cập nhật hồ sơ.', variant: 'success' });
      },
    });
  };

  const handlePickAvatar = () => {
    if (!userId || uploadMutation.isPending) {
      return;
    }

    void (async () => {
      const outcome = await pickAndPrepareAvatar();

      if (outcome.status === 'cancelled') {
        return;
      }

      if (outcome.status === 'denied') {
        setNotice({
          actionLabel: 'Mở Cài đặt',
          message:
            'App cần quyền xem ảnh để đổi avatar. Hãy mở Cài đặt và cấp quyền.',
          onAction: () => {
            void Linking.openSettings();
          },
          variant: 'info',
        });
        return;
      }

      if (outcome.status === 'rejected') {
        setNotice({ message: outcome.message, variant: 'error' });
        return;
      }

      uploadMutation.mutate(
        {
          base64: outcome.base64,
          previousPath: profileQuery.data?.avatar_path ?? null,
        },
        {
          onError: (error: unknown) => {
            setNotice({ message: toAvatarErrorMessage(error), variant: 'error' });
          },
          onSuccess: () => {
            setNotice({ message: 'Đã đổi avatar.', variant: 'success' });
          },
        },
      );
    })();
  };

  return (
    <ScreenContainer
      header={
        <ScreenHeader
          actions={<ThemeToggleAction />}
          onBack={() => router.back()}
          showBack={router.canGoBack()}
          title="Thông tin cá nhân"
        />
      }
    >
      <ProfileView
        avatarUrl={avatarQuery.data ?? null}
        email={user?.email ?? '—'}
        fullName={profileQuery.data?.full_name ?? ''}
        notice={notice}
        onDismissNotice={() => {
          setNotice(null);
        }}
        onPickAvatar={handlePickAvatar}
        onRetry={() => {
          void profileQuery.refetch();
        }}
        onSave={handleSave}
        saving={updateMutation.isPending}
        status={status}
        studentCode={profileQuery.data?.student_code ?? ''}
        uploading={uploadMutation.isPending}
      />

      <ThemeSettingsCard />

      <View style={styles.actions}>
        <Link asChild href="/profile/change-password">
          <Button
            accessibilityLabel="Đổi mật khẩu"
            accessibilityRole="button"
            icon="lock-reset"
            mode="outlined"
          >
            Đổi mật khẩu
          </Button>
        </Link>

        <Button
          accessibilityLabel="Đăng xuất"
          accessibilityRole="button"
          disabled={signOutMutation.isPending}
          icon="logout"
          loading={signOutMutation.isPending}
          mode="outlined"
          onPress={() => {
            if (!signOutMutation.isPending) {
              signOutMutation.mutate();
            }
          }}
          textColor={theme.colors.error}
        >
          Đăng xuất
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 0,
  },
});
