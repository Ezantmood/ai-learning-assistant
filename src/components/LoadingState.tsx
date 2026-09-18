import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';

import { radius, spacing } from '../theme/spacing';

type LoadingStateProps = {
  message: string;
};

/**
 * Loading căn giữa G6 (spinner + chữ), thay FullScreenStatus cũ.
 */
export function LoadingState({ message }: LoadingStateProps) {
  return (
    <View style={styles.center}>
      <ActivityIndicator accessibilityLabel={message} size="large" />
      <Text variant="bodyMedium">{message}</Text>
    </View>
  );
}

type ListSkeletonProps = {
  rows?: number;
};

/**
 * Skeleton đơn giản cho danh sách: Surface nhấp nháy bằng Animated
 * của React Native, không thêm thư viện.
 */
export function ListSkeleton({ rows = 3 }: ListSkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 700,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 700,
          toValue: 0.4,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [opacity]);

  return (
    <View style={styles.list}>
      {Array.from({ length: rows }, (_, index) => (
        <Animated.View key={index} style={{ opacity }}>
          <Surface style={styles.row}>{null}</Surface>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  list: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  row: {
    borderRadius: radius.md,
    height: 72,
  },
});
