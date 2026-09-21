import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Appbar,
  Chip,
  Divider,
  FAB,
  List,
  Searchbar,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../../src/shared/components/EmptyState';
import { FeedbackSnackbar } from '../../../src/shared/components/FeedbackSnackbar';
import { ListSkeleton } from '../../../src/shared/components/LoadingState';
import { ScreenContainer } from '../../../src/shared/components/ScreenContainer';
import { ThemeToggleAction } from '../../../src/shared/components/ThemeToggleAction';
import { useSession } from '../../../src/features/auth/useSession';
import { AppIcons } from '../../../src/shared/theme/icons';
import { toDocumentsErrorMessage } from '../../../src/features/documents/errors';
import {
  useDocuments,
  useSubjects,
} from '../../../src/features/documents/queries';
import { formatFileSize } from '../../../src/features/documents/storage';
import type { SubjectFilterValue } from '../../../src/features/documents/storage';
import { spacing } from '../../../src/shared/theme/spacing';
import type { AppTheme } from '../../../src/shared/theme/theme';
import type { DocumentWithSubject } from '../../../src/features/documents/api';

/** Debounce ô tìm kiếm 300ms để không bắn `ilike` mỗi phím bấm. */
function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function formatUploadedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('vi-VN');
}

function describeDocument(item: DocumentWithSubject): string {
  const subject = item.subjectName ?? 'Chưa phân loại';
  const base = `${subject} • ${formatFileSize(item.file_size)} • ${formatUploadedAt(item.created_at)}`;
  // DOCX: nhãn cho biết AI không đọc được (SPEC 2.7).
  return item.file_ext === 'docx' ? `${base} • AI không đọc DOCX` : base;
}

function filterLabel(
  filter: SubjectFilterValue,
  subjects: { id: string; name: string }[],
): string {
  if (filter === undefined) {
    return 'Tất cả';
  }
  if (filter === null) {
    return 'Chưa phân loại';
  }
  return subjects.find((s) => s.id === filter)?.name ?? 'Tất cả';
}

export default function DocumentsScreen() {
  const theme = useTheme<AppTheme>();
  const { user } = useSession();
  const params = useLocalSearchParams<{ deleted?: string; uploaded?: string }>();
  const [showUploaded, setShowUploaded] = useState(params.uploaded === '1');
  // Snackbar xóa: derive trong render (không effect + setState, theo luật
  // lint `set-state-in-effect` của G2). Mỗi lần xóa mang stamp duy nhất nên
  // xóa liên tiếp vẫn hiện lại — phủ cả 3 nhánh: xóa từ chi tiết, xóa từ
  // danh sách, deep link mở chi tiết rồi xóa (stack rỗng).
  const [dismissedDeleted, setDismissedDeleted] = useState<string | null>(null);
  const deletedStamp = params.deleted;
  const showDeleted =
    deletedStamp !== undefined &&
    deletedStamp !== '0' &&
    deletedStamp !== dismissedDeleted;
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] =
    useState<SubjectFilterValue>(undefined);
  const debouncedSearch = useDebouncedValue(search, 300);
  const subjectsQuery = useSubjects(user?.id);
  const subjects = subjectsQuery.data ?? [];

  // Lọc đang chọn trỏ vào môn vừa bị xóa → rớt về “Tất cả”.
  // Derive trong render (không dùng effect + setState).
  const effectiveFilter: SubjectFilterValue =
    typeof subjectFilter === 'string' &&
    subjectsQuery.data &&
    !subjectsQuery.data.some((s) => s.id === subjectFilter)
      ? undefined
      : subjectFilter;

  const docsQuery = useDocuments(user?.id, {
    search: debouncedSearch,
    subjectFilter: effectiveFilter,
  });

  const renderItem = ({ item }: { item: DocumentWithSubject }) => (
    <List.Item
      accessibilityLabel={`Tài liệu: ${item.display_name}`}
      description={describeDocument(item)}
      descriptionNumberOfLines={3}
      left={(props) => (
        <List.Icon
          {...props}
          color={theme.colors.primary}
          icon={AppIcons.fileDocumentOutline}
        />
      )}
      onPress={() => router.push(`/documents/${item.id}`)}
      title={item.display_name}
      titleNumberOfLines={2}
    />
  );

  const docs = docsQuery.data ?? [];
  const isSearching = debouncedSearch.trim() !== '';
  const emptyTitle = isSearching
    ? 'Không tìm thấy tài liệu'
    : effectiveFilter !== undefined
      ? `Không có tài liệu ${filterLabel(effectiveFilter, subjects).toLowerCase()}`
      : 'Chưa có tài liệu nào';

  return (
    <ScreenContainer contentStyle={styles.plain} scrollable={false}>
      <Appbar.Header>
        <Appbar.Content title="Tài liệu học tập" />
        <Appbar.Action
          accessibilityLabel="Quản lý môn học"
          icon={AppIcons.folderOutline}
          onPress={() => router.push('/subjects')}
        />
        <ThemeToggleAction />
      </Appbar.Header>

      <View style={styles.tools}>
        <Searchbar
          accessibilityLabel="Tìm tài liệu theo tên"
          onChangeText={setSearch}
          placeholder="Tìm theo tên tài liệu…"
          testID="documents-search"
          value={search}
        />
        <ScrollView
          accessibilityLabel="Lọc theo môn học"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.chips}>
            <Chip
              accessibilityLabel="Lọc: tất cả môn"
              onPress={() => setSubjectFilter(undefined)}
              selected={effectiveFilter === undefined}
              showSelectedCheck={false}
            >
              Tất cả
            </Chip>
            {subjects.map((subject) => (
              <Chip
                accessibilityLabel={`Lọc môn: ${subject.name}`}
                key={subject.id}
                onPress={() => setSubjectFilter(subject.id)}
                selected={effectiveFilter === subject.id}
                showSelectedCheck={false}
              >
                {subject.name}
              </Chip>
            ))}
            <Chip
              accessibilityLabel="Lọc: chưa phân loại"
              onPress={() => setSubjectFilter(null)}
              selected={effectiveFilter === null}
              showSelectedCheck={false}
            >
              Chưa phân loại
            </Chip>
          </View>
        </ScrollView>
      </View>

      {docsQuery.isPending ? (
        <ListSkeleton rows={3} />
      ) : docsQuery.isError ? (
        <EmptyState
          actionLabel="Thử lại"
          actionTestID="documents-retry"
          description={toDocumentsErrorMessage(docsQuery.error)}
          icon={AppIcons.alertCircle}
          onAction={() => {
            void docsQuery.refetch();
          }}
          title="Không tải được tài liệu"
        />
      ) : docs.length === 0 ? (
        <EmptyState
          actionLabel="Tải tài liệu lên"
          actionTestID="documents-empty-upload"
          description={
            isSearching || effectiveFilter !== undefined
              ? 'Thử từ khóa khác hoặc chọn bộ lọc khác.'
              : 'Tải lên tệp PDF, DOCX hoặc TXT (tối đa 10 MB) để bắt đầu.'
          }
          icon={AppIcons.fileDocumentOutline}
          onAction={() => router.push('/documents/upload')}
          title={emptyTitle}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={docs}
          ItemSeparatorComponent={Divider}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              accessibilityLabel="Kéo để tải lại tài liệu"
              onRefresh={() => {
                void docsQuery.refetch();
              }}
              refreshing={docsQuery.isFetching}
            />
          }
          renderItem={renderItem}
        />
      )}

      <FAB
        accessibilityLabel="Tải tài liệu lên"
        icon={AppIcons.upload}
        onPress={() => router.push('/documents/upload')}
        style={styles.fab}
        testID="documents-fab"
      />

      <FeedbackSnackbar
        message="Đã xóa tài liệu."
        onDismiss={() => {
          setDismissedDeleted(deletedStamp ?? null);
          router.setParams({ deleted: '0' });
        }}
        variant="success"
        visible={showDeleted}
      />

      <FeedbackSnackbar
        message="Đã tải tài liệu lên."
        onDismiss={() => {
          setShowUploaded(false);
          router.setParams({ uploaded: '0' });
        }}
        variant="success"
        visible={showUploaded && !showDeleted}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
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
  tools: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
});
