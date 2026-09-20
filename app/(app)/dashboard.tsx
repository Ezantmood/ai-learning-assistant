import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Card, Chip, Text, useTheme } from 'react-native-paper';

import { FeedbackSnackbar } from '../../src/shared/components/FeedbackSnackbar';

import { ScreenContainer } from '../../src/shared/components/ScreenContainer';
import { ThemeToggleAction } from '../../src/shared/components/ThemeToggleAction';
import { useSession } from '../../src/features/auth/useSession';
import { spacing } from '../../src/shared/theme/spacing';
import type { AppTheme } from '../../src/shared/theme/theme';

type FeatureCard = {
  description: string;
  frRange: string;
  icon: string;
  id: string;
  route?: '/notes' | '/documents';
  status: 'done' | 'partial' | 'soon';
  title: string;
};

const FEATURES: FeatureCard[] = [
  {
    description: 'Đăng ký, đăng nhập, OTP email, hồ sơ và ghi chú học tập.',
    frRange: 'FR-01 → FR-05',
    icon: 'account-circle',
    id: '1',
    route: '/notes',
    status: 'done',
    title: 'Quản lý tài khoản người dùng',
  },
  {
    description: 'Tải lên, lưu trữ và quản lý tài liệu học tập.',
    frRange: 'FR-06 → FR-13',
    icon: 'file-document-outline',
    id: '2',
    route: '/documents',
    status: 'partial',
    title: 'Quản lý tài liệu học tập',
  },
  {
    description: 'AI tóm tắt nội dung tài liệu PDF.',
    frRange: 'FR-14 → FR-22',
    icon: 'text-box-outline',
    id: '3',
    status: 'soon',
    title: 'AI tóm tắt tài liệu PDF',
  },
  {
    description: 'AI hỏi đáp dựa trên nội dung tài liệu.',
    frRange: 'FR-23 → FR-30',
    icon: 'message-text-outline',
    id: '4',
    status: 'soon',
    title: 'AI hỏi đáp dựa trên tài liệu',
  },
  {
    description: 'Quét hình ảnh đề bài bằng AI.',
    frRange: 'FR-31 → FR-37',
    icon: 'camera',
    id: '5',
    status: 'soon',
    title: 'Quét hình ảnh đề bài bằng AI',
  },
  {
    description: 'AI gợi ý lời giải cho bài tập.',
    frRange: 'FR-38 → FR-45',
    icon: 'lightbulb-outline',
    id: '6',
    status: 'soon',
    title: 'AI gợi ý lời giải',
  },
];

/**
 * Tab Trang chủ: lưới 6 thẻ CN1→CN6, chỗ cắm các CN sau.
 * CN3→CN6 chưa khả dụng: bấm báo "đang phát triển", không điều hướng.
 */
export default function DashboardScreen() {
  const theme = useTheme<AppTheme>();
  const { user } = useSession();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <ScreenContainer
      header={
        <Appbar.Header>
          <Appbar.Content title="AI Learning Assistant" />
          <ThemeToggleAction />
          <Appbar.Action
            accessibilityLabel="Mở hồ sơ"
            icon="account-circle"
            onPress={() => router.push('/profile')}
          />
        </Appbar.Header>
      }
    >
      <Text variant="bodyMedium">
        Xin chào{user?.email ? `, ${user.email}` : ''}! Chọn một chức năng để
        tiếp tục.
      </Text>
      {FEATURES.map((feature) => {
        const enabled = feature.status !== 'soon';
        const target = enabled ? feature.route : undefined;
        const chipIcon =
          feature.status === 'done'
            ? 'check'
            : feature.status === 'partial'
              ? 'progress-clock'
              : 'clock-outline';
        const chipLabel =
          feature.status === 'done'
            ? 'Hoàn thành'
            : feature.status === 'partial'
              ? 'Đang làm'
              : 'Sắp có';
        return (
          <Card
            accessibilityLabel={`Chức năng ${feature.id}: ${feature.title}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !enabled }}
            key={feature.id}
            mode="outlined"
            onPress={() => {
              if (target) {
                router.push(target);
              } else {
                setNotice('Tính năng đang phát triển.');
              }
            }}
            style={
              enabled
                ? undefined
                : { backgroundColor: theme.colors.surfaceVariant }
            }
            testID={`dashboard-card-${feature.id}`}
          >
            <Card.Title
              left={() => (
                <Avatar.Icon
                  color={
                    enabled
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                  icon={feature.icon}
                  size={40}
                  style={
                    enabled
                      ? undefined
                      : { backgroundColor: theme.colors.surfaceVariant }
                  }
                />
              )}
              right={() => (
                <View style={styles.chipWrap}>
                  <Chip
                    icon={chipIcon}
                    testID={
                      feature.status === 'soon'
                        ? `dashboard-coming-soon-${feature.id}`
                        : `dashboard-done-${feature.id}`
                    }
                  >
                    {chipLabel}
                  </Chip>
                </View>
              )}
              subtitle={feature.frRange}
              subtitleStyle={
                enabled ? undefined : { color: theme.colors.onSurfaceVariant }
              }
              title={feature.title}
              titleStyle={
                enabled ? undefined : { color: theme.colors.onSurfaceVariant }
              }
            />
            <Card.Content>
              <Text
                style={
                  enabled ? undefined : { color: theme.colors.onSurfaceVariant }
                }
                variant="bodyMedium"
              >
                {feature.description}
              </Text>
            </Card.Content>
          </Card>
        );
      })}
      <FeedbackSnackbar
        message={notice ?? ''}
        onDismiss={() => setNotice(null)}
        variant="info"
        visible={notice !== null}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    marginRight: spacing.md,
  },
});
