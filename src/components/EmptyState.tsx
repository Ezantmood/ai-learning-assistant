import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';

import { spacing } from '../theme/spacing';
import type { AppTheme } from '../theme/theme';

type EmptyStateProps = {
  /** Tên icon MaterialCommunityIcons hiển thị lớn. */
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTestID?: string;
};

/**
 * Trạng thái rỗng G6: icon lớn + tiêu đề + mô tả + nút hành động.
 * Dùng cho danh sách notes rỗng (kèm CTA tạo note).
 */
export function EmptyState({
  actionLabel,
  actionTestID,
  description,
  icon,
  onAction,
  title,
}: EmptyStateProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.root}>
      <Icon
        color={theme.colors.onSurfaceVariant}
        size={64}
        source={icon}
      />
      <Text style={styles.text} variant="titleMedium">
        {title}
      </Text>
      {description ? (
        <Text style={styles.text} variant="bodyMedium">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          mode="contained"
          onPress={onAction}
          testID={actionTestID}
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  text: {
    textAlign: 'center',
  },
});
