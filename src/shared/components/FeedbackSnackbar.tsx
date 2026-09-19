import { StyleSheet, View } from 'react-native';
import { Icon, Snackbar, Text, useTheme } from 'react-native-paper';

import { spacing } from '../theme/spacing';
import type { AppTheme } from '../theme/theme';

export type FeedbackVariant = 'error' | 'info' | 'success';

type FeedbackSnackbarProps = {
  visible: boolean;
  message: string;
  variant?: FeedbackVariant;
  onDismiss: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

const LEADING_ICON: Record<FeedbackVariant, string> = {
  error: 'alert-circle',
  info: 'information',
  success: 'check-circle',
};

/**
 * Snackbar G6: Paper Snackbar không có leading icon sẵn nên tự layout
 * row (icon + text); nền theo theme từng variant; nút đóng `close`.
 */
export function FeedbackSnackbar({
  actionLabel,
  message,
  onAction,
  onDismiss,
  variant = 'info',
  visible,
}: FeedbackSnackbarProps) {
  const theme = useTheme<AppTheme>();

  const backgroundColor =
    variant === 'error'
      ? theme.colors.errorContainer
      : variant === 'success'
        ? theme.colors.successContainer
        : theme.colors.inverseSurface;

  const color =
    variant === 'error'
      ? theme.colors.onErrorContainer
      : variant === 'success'
        ? theme.colors.onSuccessContainer
        : theme.colors.inverseOnSurface;

  return (
    <Snackbar
      action={
        actionLabel && onAction
          ? { label: actionLabel, onPress: onAction }
          : undefined
      }
      icon="close"
      iconAccessibilityLabel="Đóng thông báo"
      onDismiss={onDismiss}
      onIconPress={onDismiss}
      style={{ backgroundColor }}
      visible={visible}
    >
      <View style={styles.row}>
        <Icon
          color={color}
          size={20}
          source={LEADING_ICON[variant]}
          testID={`feedback-icon-${variant}`}
        />
        <Text style={[styles.message, { color }]} variant="bodyMedium">
          {message}
        </Text>
      </View>
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  message: {
    flex: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
