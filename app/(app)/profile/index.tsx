import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Banner, Button, Card, Text } from 'react-native-paper';

import { signOut } from '../../../src/features/auth/api';
import { toAuthErrorMessage } from '../../../src/features/auth/errors';
import { useSession } from '../../../src/features/auth/useSession';
import { spacing } from '../../../src/lib/theme';

/**
 * Hồ sơ tối thiểu G3 (FR-02): xem email + đăng xuất.
 * Form cập nhật profile/avatar đầy đủ thuộc G5 (FR-04).
 */
export default function ProfileScreen() {
  const { user } = useSession();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: signOut,
    onError: (error: unknown) => {
      setApiError(toAuthErrorMessage(error));
    },
    onMutate: () => {
      setApiError(null);
    },
    onSuccess: () => {
      router.replace('/sign-in');
    },
  });

  const email = user?.email ?? '—';
  const initial = email.charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.container}>
      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
        </Banner>
      ) : null}

      <Card>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text label={initial} size={64} />
          <Text variant="titleMedium">{email}</Text>
          <Text variant="bodySmall">
            Cập nhật họ tên, mã sinh viên và avatar sẽ làm ở G5.
          </Text>
        </Card.Content>
      </Card>

      <Link asChild href="/profile/change-password">
        <Button
          accessibilityLabel="Đổi mật khẩu"
          accessibilityRole="button"
          mode="outlined"
        >
          Đổi mật khẩu
        </Button>
      </Link>

      <Button
        accessibilityLabel="Đăng xuất"
        accessibilityRole="button"
        disabled={mutation.isPending}
        loading={mutation.isPending}
        mode="outlined"
        onPress={() => {
          if (!mutation.isPending) {
            mutation.mutate();
          }
        }}
      >
        Đăng xuất
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  container: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
});
