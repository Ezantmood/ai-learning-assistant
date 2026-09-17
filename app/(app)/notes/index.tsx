import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  FAB,
  Text,
  useTheme,
} from 'react-native-paper';

import { useSession } from '../../../src/features/auth/useSession';
import { toNotesErrorMessage } from '../../../src/features/notes/errors';
import { useNotes } from '../../../src/features/notes/queries';
import { spacing } from '../../../src/lib/theme';
import type { StudyNoteRow } from '../../../src/types/database';

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('vi-VN');
}

export default function NotesScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const notesQuery = useNotes(user?.id);

  const renderItem = ({ item }: { item: StudyNoteRow }) => (
    <Card
      accessibilityLabel={`Ghi chú: ${item.title}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({ params: { id: item.id }, pathname: '/notes/[id]' })
      }
      style={styles.card}
    >
      <Card.Title
        subtitle={formatUpdatedAt(item.updated_at)}
        subtitleVariant="bodySmall"
        title={item.title}
        titleVariant="titleMedium"
      />
      {item.content ? (
        <Card.Content>
          <Text numberOfLines={2} variant="bodyMedium">
            {item.content}
          </Text>
        </Card.Content>
      ) : null}
    </Card>
  );

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Ghi chú học tập" />
        <Appbar.Action
          accessibilityLabel="Mở hồ sơ"
          icon="account-circle"
          onPress={() => router.push('/profile')}
        />
      </Appbar.Header>

      {notesQuery.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel="Đang tải ghi chú" />
          <Text>Đang tải ghi chú…</Text>
        </View>
      ) : notesQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>
            {toNotesErrorMessage(notesQuery.error)}
          </Text>
          <Button
            accessibilityLabel="Tải lại ghi chú"
            accessibilityRole="button"
            mode="contained"
            onPress={() => notesQuery.refetch()}
          >
            Thử lại
          </Button>
        </View>
      ) : (notesQuery.data ?? []).length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText} variant="titleMedium">
            Chưa có ghi chú nào
          </Text>
          <Text style={styles.centerText} variant="bodyMedium">
            Tạo ghi chú đầu tiên để kiểm tra dữ liệu riêng của tài khoản.
          </Text>
          <Button
            accessibilityLabel="Tạo ghi chú đầu tiên"
            accessibilityRole="button"
            mode="contained"
            onPress={() => router.push('/notes/new')}
          >
            Tạo ghi chú
          </Button>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={notesQuery.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}

      <FAB
        accessibilityLabel="Thêm ghi chú"
        icon="plus"
        onPress={() => router.push('/notes/new')}
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  centerText: {
    textAlign: 'center',
  },
  fab: {
    bottom: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  list: {
    padding: spacing.md,
  },
  root: {
    flex: 1,
  },
});
