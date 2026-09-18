import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../theme/spacing';
import type { AppTheme } from '../theme/theme';

type ScreenContainerProps = PropsWithChildren & {
  contentStyle?: StyleProp<ViewStyle>;
  /** false cho màn hình tự quản scroll (VD danh sách FlatList). */
  scrollable?: boolean;
};

/**
 * Khung màn hình chung G6: SafeArea + tránh bàn phím che input +
 * nền theo theme. Mọi màn hình đều dùng component này.
 */
export function ScreenContainer({
  children,
  contentStyle,
  scrollable = true,
}: ScreenContainerProps) {
  const theme = useTheme<AppTheme>();

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right', 'top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.plain, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  plain: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
});
