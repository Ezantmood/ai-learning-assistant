import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../../src/shared/components/EmptyState';
import {
  FeedbackSnackbar,
  type FeedbackVariant,
} from '../../../src/shared/components/FeedbackSnackbar';
import { FormTextInput } from '../../../src/shared/components/FormTextInput';
import { ListSkeleton } from '../../../src/shared/components/LoadingState';
import { ScreenContainer } from '../../../src/shared/components/ScreenContainer';
import { ScreenHeader } from '../../../src/shared/components/ScreenHeader';
import { goBackOrReplace } from '../../../src/shared/lib/navigation';
import { useSession } from '../../../src/features/auth/useSession';
import { toSubjectsErrorMessage } from '../../../src/features/documents/errors';
import {
  useCreateSubject,
  useDeleteSubject,
  useDocuments,
  useRenameSubject,
  useSubjects,
} from '../../../src/features/documents/queries';
import { spacing } from '../../../src/shared/theme/spacing';
import type { AppTheme } from '../../../src/shared/theme/theme';
import type { SubjectRow } from '../../../src/shared/types/database';

type Notice = {
  message: string;
  variant: FeedbackVariant;
};

type EditingTarget = { id: string; name: string } | null;
type DeletingTarget = { id: string; name: string; docCount: number } | null;

/**
 * FR-12: CRUD môn học. Xóa môn đang có tài liệu phải cảnh báo trước
 * (“N tài liệu sẽ chuyển thành Chưa phân loại”) — tài liệu rơi về null
 * nhờ `ON DELETE SET NULL`, không bị xóa theo.
 */
export default function SubjectsScreen() {
  const { user } = useSession();
  const theme = useTheme<AppTheme>();
  const userId = user?.id ?? '';

  const subjectsQuery = useSubjects(user?.id);
  const docsQuery = useDocuments(user?.id);
  const subjects = subjectsQuery.data ?? [];

  const createMutation = useCreateSubject(userId);
  const renameMutation = useRenameSubject(userId);
  const deleteMutation = useDeleteSubject(userId);

  const [newName, setNewName] = useState('');
  const [newNameError, setNewNameError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [editName, setEditName] = useState('');
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DeletingTarget>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const docCountBySubject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of docsQuery.data ?? []) {
      if (doc.subject_id) {
        counts.set(doc.subject_id, (counts.get(doc.subject_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [docsQuery.data]);

  const showNotice = (message: string, variant: FeedbackVariant) => {
    setNotice({ message, variant });
  };

  const handleCreate = () => {
    if (createMutation.isPending) {
      return;
    }
    setNewNameError(null);
    createMutation.mutate(newName, {
      onError: (error: unknown) => {
        setNewNameError(toSubjectsErrorMessage(error));
      },
      onSuccess: () => {
        setNewName('');
        showNotice('Đã tạo môn học.', 'success');
      },
    });
  };

  const openEdit = (subject: SubjectRow) => {
    setEditing({ id: subject.id, name: subject.name });
    setEditName(subject.name);
    setEditNameError(null);
  };

  const handleRename = () => {
    if (!editing || renameMutation.isPending) {
      return;
    }
    setEditNameError(null);
    renameMutation.mutate(
      { rawName: editName, subjectId: editing.id },
      {
        onError: (error: unknown) => {
          setEditNameError(toSubjectsErrorMessage(error));
        },
        onSuccess: () => {
          setEditing(null);
          showNotice('Đã đổi tên môn học.', 'success');
        },
      },
    );
  };

  const openDelete = (subject: SubjectRow) => {
    setDeleting({
      docCount: docCountBySubject.get(subject.id) ?? 0,
      id: subject.id,
      name: subject.name,
    });
  };

  const handleDelete = () => {
    if (!deleting || deleteMutation.isPending) {
      return;
    }
    deleteMutation.mutate(deleting.id, {
      onError: (error: unknown) => {
        setDeleting(null);
        showNotice(toSubjectsErrorMessage(error), 'error');
      },
      onSuccess: () => {
        setDeleting(null);
        showNotice('Đã xóa môn học.', 'success');
      },
    });
  };

  const renderItem = ({ item }: { item: SubjectRow }) => {
    const count = docCountBySubject.get(item.id) ?? 0;
    return (
      <List.Item
        accessibilityLabel={`Môn học: ${item.name}, ${count} tài liệu`}
        description={`${count} tài liệu`}
        left={(props) => (
          <List.Icon {...props} icon="folder-outline" />
        )}
        right={() => (
          <View style={styles.rowActions}>
            <IconButton
              accessibilityLabel={`Đổi tên môn ${item.name}`}
              icon="pencil"
              onPress={() => openEdit(item)}
              testID={`subject-edit-${item.id}`}
            />
            <IconButton
              accessibilityLabel={`Xóa môn ${item.name}`}
              icon="trash-can-outline"
              iconColor={theme.colors.error}
              onPress={() => openDelete(item)}
              testID={`subject-delete-${item.id}`}
            />
          </View>
        )}
        title={item.name}
        titleNumberOfLines={2}
      />
    );
  };

  return (
    <ScreenContainer
      header={
        <ScreenHeader
          onBack={() => goBackOrReplace(router, '/documents')}
          showBack
          title="Môn học"
        />
      }
      scrollable={false}
    >
      <View style={styles.create}>
        <View style={styles.createInput}>
          <FormTextInput
            accessibilityLabel="Tên môn học mới"
            fieldError={newNameError ?? undefined}
            label="Tên môn mới (1–60 ký tự)"
            leftIcon="folder-outline"
            onChangeText={(value) => {
              setNewName(value);
              setNewNameError(null);
            }}
            testID="subject-name-input"
            value={newName}
          />
        </View>
        <Button
          accessibilityLabel="Tạo môn học mới"
          disabled={createMutation.isPending}
          icon="plus"
          loading={createMutation.isPending}
          mode="contained"
          onPress={handleCreate}
          testID="subject-create"
        >
          Thêm
        </Button>
      </View>

      {subjectsQuery.isPending ? (
        <ListSkeleton rows={3} />
      ) : subjectsQuery.isError ? (
        <EmptyState
          actionLabel="Thử lại"
          actionTestID="subjects-retry"
          description={toSubjectsErrorMessage(subjectsQuery.error)}
          icon="alert-circle"
          onAction={() => {
            void subjectsQuery.refetch();
          }}
          title="Không tải được môn học"
        />
      ) : subjects.length === 0 ? (
        <EmptyState
          description="Tạo môn học đầu tiên để gom tài liệu theo chủ đề (tối đa 30 môn)."
          icon="folder-outline"
          title="Chưa có môn học nào"
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={subjects}
          ItemSeparatorComponent={Divider}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              accessibilityLabel="Kéo để tải lại môn học"
              onRefresh={() => {
                void subjectsQuery.refetch();
                void docsQuery.refetch();
              }}
              refreshing={subjectsQuery.isFetching}
            />
          }
          renderItem={renderItem}
        />
      )}

      <Portal>
        <Dialog onDismiss={() => setEditing(null)} visible={editing !== null}>
          <Dialog.Title>Đổi tên môn học</Dialog.Title>
          <Dialog.Content>
            <FormTextInput
              accessibilityLabel="Tên môn học mới"
              fieldError={editNameError ?? undefined}
              label="Tên môn (1–60 ký tự)"
              leftIcon="pencil"
              onChangeText={(value) => {
                setEditName(value);
                setEditNameError(null);
              }}
              testID="subject-rename-input"
              value={editName}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditing(null)}>Hủy</Button>
            <Button
              loading={renameMutation.isPending}
              onPress={handleRename}
              testID="subject-rename-save"
            >
              Lưu
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          onDismiss={() => setDeleting(null)}
          visible={deleting !== null}
        >
          <Dialog.Title>Xóa môn học?</Dialog.Title>
          <Dialog.Content>
            {deleting ? (
              deleting.docCount > 0 ? (
                <Text variant="bodyMedium">
                  Môn “{deleting.name}” đang có {deleting.docCount} tài liệu.
                  Sau khi xóa, {deleting.docCount} tài liệu này sẽ chuyển
                  thành “Chưa phân loại” — tài liệu không bị xóa.
                </Text>
              ) : (
                <Text variant="bodyMedium">
                  Môn “{deleting.name}” chưa có tài liệu nào. Xóa môn này?
                </Text>
              )
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleting(null)}>Hủy</Button>
            <Button
              loading={deleteMutation.isPending}
              onPress={handleDelete}
              testID="subject-delete-confirm"
              textColor={theme.colors.error}
            >
              Xóa
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FeedbackSnackbar
        message={notice?.message ?? ''}
        onDismiss={() => setNotice(null)}
        variant={notice?.variant ?? 'info'}
        visible={notice !== null}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  create: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  createInput: {
    flex: 1,
  },
  list: {
    padding: spacing.sm,
  },
  rowActions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
