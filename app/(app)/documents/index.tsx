import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import {
  Appbar,
  Divider,
  FAB,
  List,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../../src/shared/components/EmptyState';
import { FeedbackSnackbar } from '../../../src/shared/components/FeedbackSnackbar';
import { ListSkeleton } from '../../../src/shared/components/LoadingState';
import { ScreenContainer } from '../../../src/shared/components/ScreenContainer';
import { ThemeToggleAction } from '../../../src/shared/components/ThemeToggleAction';
import { useSession } from '../../../src/features/auth/useSession';
import { toDocumentsErrorMessage } from '../../../src/features/documents/errors';
import { useDocuments } from '../../../src/features/documents/queries';
import { formatFileSize } from '../../../src/features/documents/storage';
import { spacing } from '../../../src/shared/theme/spacing';
import type { AppTheme } from '../../../src/shared/theme/theme';
import type { DocumentWithSubject } from '../../../src/features/documents/api';

function formatUploadedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('vi-VN');
}

function describeDocument(item: DocumentWithSubject): string {
  const subject = item.subjectName ?? 'Chưa phân loại';
  return `${subject} • ${formatFileSize(item.file_size)} • ${formatUploadedAt(item.created_at)}`;
}

export default function DocumentsScreen() {
  const theme = useTheme<AppTheme>();
  const { user } = useSession();
  const params = useLocalSearchParams<{ uploaded?: string }>();
  const docsQuery = useDocuments(user?.id);
  const [showUploaded, setShowUploaded] = useState(params.uploaded === '1');

  const renderItem = ({ item }: { item: DocumentWithSubject }) => (
    <List.Item
      accessibilityLabel={`Tài liệu: ${item.display_name}`}
      description={describeDocument(item)}
      descriptionNumberOfLines={2}
      left={(props) => (
        <List.Icon
          {...props}
          color={theme.colors.primary}
          icon="file-document-outline"
        />
      )}
      title={item.display_name}
      titleNumberOfLines={2}
    />
  );

  const docs = docsQuery.data ?? [];

  return (
    <ScreenContainer contentStyle={styles.plain} scrollable={false}>
      <Appbar.Header>
        <Appbar.BackAction
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
        />
        <Appbar.Content title="Tài liệu học tập" />
        <ThemeToggleAction />
      </Appbar.Header>

      {docsQuery.isPending ? (
        <ListSkeleton rows={3} />
      ) : docsQuery.isError ? (
        <EmptyState
          actionLabel="Thử lại"
          actionTestID="documents-retry"
          description={toDocumentsErrorMessage(docsQuery.error)}
          icon="alert-circle"
          onAction={() => {
            void docsQuery.refetch();
          }}
          title="Không tải được tài liệu"
        />
      ) : docs.length === 0 ? (
        <EmptyState
          actionLabel="Tải tài liệu lên"
          actionTestID="documents-empty-upload"
          description="Tải lên tệp PDF, DOCX hoặc TXT (tối đa 10 MB) để bắt đầu."
          icon="file-document-outline"
          onAction={() => router.push('/documents/upload')}
          title="Chưa có tài liệu nào"
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
        icon="upload"
        onPress={() => router.push('/documents/upload')}
        style={styles.fab}
        testID="documents-fab"
      />

      <FeedbackSnackbar
        message="Đã tải tài liệu lên."
        onDismiss={() => setShowUploaded(false)}
        variant="success"
        visible={showUploaded}
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
