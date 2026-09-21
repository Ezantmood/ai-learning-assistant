import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import {
  Appbar,
  Divider,
  FAB,
  List,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../../src/shared/components/EmptyState';
import { ListSkeleton } from '../../../src/shared/components/LoadingState';
import { ScreenContainer } from '../../../src/shared/components/ScreenContainer';
import { ThemeToggleAction } from '../../../src/shared/components/ThemeToggleAction';
import { goBackOrReplace } from '../../../src/shared/lib/navigation';
import { useSession } from '../../../src/features/auth/useSession';
import { AppIcons } from '../../../src/shared/theme/icons';
import { toNotesErrorMessage } from '../../../src/features/notes/errors';
import { useNotes } from '../../../src/features/notes/queries';
import { spacing } from '../../../src/shared/theme/spacing';
import type { AppTheme } from '../../../src/shared/theme/theme';
import type { StudyNoteRow } from '../../../src/shared/types/database';

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('vi-VN');
}

export default function NotesScreen() {
  const theme = useTheme<AppTheme>();
  const { user } = useSession();
  const notesQuery = useNotes(user?.id);

  const renderItem = ({ item }: { item: StudyNoteRow }) => (
    <List.Item
      accessibilityLabel={`Ghi chú: ${item.title}`}
      accessibilityRole="button"
      description={item.content || formatUpdatedAt(item.updated_at)}
      descriptionNumberOfLines={2}
      left={(props) => (
        <List.Icon {...props} color={theme.colors.primary} icon={AppIcons.noteTextOutline} />
      )}
      onPress={() =>
        router.push({ params: { id: item.id }, pathname: '/notes/[id]' })
      }
      title={item.title}
    />
  );

  const notes = notesQuery.data ?? [];

  return (
    <ScreenContainer contentStyle={styles.plain} scrollable={false}>
      <Appbar.Header>
        <Appbar.BackAction
          accessibilityLabel="Quay lại"
          onPress={() => goBackOrReplace(router, '/profile')}
        />
        <Appbar.Content title="Ghi chú học tập" />
        <ThemeToggleAction />
        <Appbar.Action
          accessibilityLabel="Mở hồ sơ"
          icon={AppIcons.accountCircle}
          onPress={() => router.push('/profile')}
        />
      </Appbar.Header>

      {notesQuery.isPending ? (
        <ListSkeleton rows={3} />
      ) : notesQuery.isError ? (
        <EmptyState
          actionLabel="Thử lại"
          actionTestID="notes-retry"
          description={toNotesErrorMessage(notesQuery.error)}
          icon={AppIcons.alertCircle}
          onAction={() => {
            void notesQuery.refetch();
          }}
          title="Không tải được ghi chú"
        />
      ) : notes.length === 0 ? (
        <EmptyState
          actionLabel="Tạo ghi chú"
          actionTestID="notes-empty-create"
          description="Tạo ghi chú đầu tiên để kiểm tra dữ liệu riêng của tài khoản."
          icon={AppIcons.notebookOutline}
          onAction={() => router.push('/notes/new')}
          title="Chưa có ghi chú nào"
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={notes}
          ItemSeparatorComponent={Divider}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              accessibilityLabel="Kéo để tải lại ghi chú"
              onRefresh={() => {
                void notesQuery.refetch();
              }}
              refreshing={notesQuery.isFetching}
            />
          }
          renderItem={renderItem}
        />
      )}

      <FAB
        accessibilityLabel="Thêm ghi chú"
        icon={AppIcons.plus}
        onPress={() => router.push('/notes/new')}
        style={styles.fab}
        testID="notes-fab"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fab: {
    bottom: spacing.xl,
    position: 'absolute',
    right: spacing.lg,
  },
  list: {
    padding: spacing.sm,
  },
  plain: {
    padding: 0,
  },
});
