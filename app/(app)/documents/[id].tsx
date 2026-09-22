import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  Banner,
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Menu,
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
import { QaSection } from '../../../src/features/chat/QaSection';
import { SummarySection } from '../../../src/features/summary/SummarySection';
import { SolutionSection } from '../../../src/features/solver/SolutionSection';
import { ScreenContainer } from '../../../src/shared/components/ScreenContainer';
import { ScreenHeader } from '../../../src/shared/components/ScreenHeader';
import { goBackToDocuments } from '../../../src/shared/lib/navigation';
import { AppIcons } from '../../../src/shared/theme/icons';
import { useSession } from '../../../src/features/auth/useSession';
import {
  toDocumentsErrorMessage,
  toOpenDocumentErrorMessage,
} from '../../../src/features/documents/errors';
import {
  useAssignDocumentSubject,
  useDeleteDocument,
  useDocument,
  useDocumentUrl,
  useRenameDocument,
  useSubjects,
  documentKey,
} from '../../../src/features/documents/queries';
import {
  DOCX_AI_NOTICE,
  formatFileSize,
  getExtractionStatusLabel,
  getFileTypeLabel,
} from '../../../src/features/documents/storage';
import { spacing } from '../../../src/shared/theme/spacing';
import type { AppTheme } from '../../../src/shared/theme/theme';

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Không rõ';
  }
  return date.toLocaleString('vi-VN');
}

type Notice = {
  message: string;
  variant: FeedbackVariant;
  actionLabel?: string;
};

/**
 * FR-09/FR-10/FR-11/FR-12 (gán môn): chi tiết một tài liệu.
 * KHÔNG render nội dung trong app, không WebView — nút “Mở tài liệu”
 * tạo signed URL TTL 3600s rồi `Linking.openURL` ra app ngoài.
 */
export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const theme = useTheme<AppTheme>();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const docQuery = useDocument(userId, id);
  const subjectsQuery = useSubjects(userId);
  const doc = docQuery.data;
  const subjects = subjectsQuery.data ?? [];
  const docUrlQuery = useDocumentUrl(doc?.storage_path);

  const [subjectMenuVisible, setSubjectMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const assignMutation = useAssignDocumentSubject(userId ?? '', id ?? '');
  const deleteMutation = useDeleteDocument(userId ?? '');

  const showNotice = (message: string, variant: FeedbackVariant) => {
    setNotice({ message, variant });
  };

  const handleOpen = () => {
    if (!doc || opening) {
      return;
    }
    setOpening(true);
    const openWith = async (url: string) => {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error('cannot open url');
      }
      await Linking.openURL(url);
    };
    const cached = docUrlQuery.data;
    const run = async () => {
      if (cached) {
        await openWith(cached);
        return;
      }
      const fresh = await docUrlQuery.refetch();
      if (fresh.data) {
        await openWith(fresh.data);
        return;
      }
      throw fresh.error ?? new Error('no signed url');
    };
    run()
      .then(() => undefined)
      .catch((error: unknown) => {
        showNotice(toOpenDocumentErrorMessage(error), 'error');
      })
      .finally(() => {
        setOpening(false);
      });
  };

  const handleAssign = (subjectId: string | null) => {
    setSubjectMenuVisible(false);
    if (!doc || assignMutation.isPending) {
      return;
    }
    if (subjectId === doc.subject_id) {
      return;
    }
    assignMutation.mutate(subjectId, {
      onError: (error: unknown) => {
        showNotice(toDocumentsErrorMessage(error), 'error');
      },
      onSuccess: () => {
        showNotice(
          subjectId === null
            ? 'Đã chuyển về “Chưa phân loại”.'
            : 'Đã đổi môn học.',
          'success',
        );
      },
    });
  };

  const handleDelete = () => {
    if (!doc || deleteMutation.isPending) {
      return;
    }
    deleteMutation.mutate(
      { documentId: doc.id, storagePath: doc.storage_path },
      {
        onError: (error: unknown) => {
          // DB fail sau khi storage đã xóa: báo rõ + cho thử lại ngay.
          setDeleteDialogVisible(false);
          setNotice({
            actionLabel: 'Thử lại',
            message: toDocumentsErrorMessage(error),
            variant: 'error',
          });
        },
        onSuccess: () => {
          const deletedId = doc.id;
          setDeleteDialogVisible(false);
          // Xóa xong: replace luôn về /documents (không back) để (1) deep
          // link mở chi tiết trực tiếp không vỡ GO_BACK, (2) mang stamp xóa
          // sang danh sách hiện Snackbar, (3) nút back không quay lại được
          // màn chi tiết đã xóa. Điều hướng TRƯỚC, dọn cache chi tiết SAU
          // để màn hình không render lại với record null gây unmount sớm —
          // cache danh sách do useDeleteDocument invalidate.
          router.replace({
            params: { deleted: String(Date.now()) },
            pathname: '/documents',
          });
          queryClient.removeQueries({ queryKey: documentKey(deletedId) });
        },
      },
    );
  };

  const retryDelete = () => {
    setNotice(null);
    handleDelete();
  };

  if (docQuery.isPending) {
    return (
      <ScreenContainer
        header={
          <ScreenHeader
            onBack={() => goBackToDocuments(router)}
            showBack
            title="Chi tiết tài liệu"
          />
        }
      >
        <ListSkeleton rows={5} />
      </ScreenContainer>
    );
  }

  if (docQuery.isError || !doc) {
    return (
      <ScreenContainer
        header={
          <ScreenHeader
            onBack={() => goBackToDocuments(router)}
            showBack
            title="Chi tiết tài liệu"
          />
        }
      >
        <EmptyState
          actionLabel="Thử lại"
          actionTestID="document-retry"
          description={toDocumentsErrorMessage(docQuery.error)}
          icon={AppIcons.alertCircle}
          onAction={() => {
            void docQuery.refetch();
          }}
          title="Không tải được tài liệu"
        />
      </ScreenContainer>
    );
  }

  const currentSubjectName = doc.subjectName ?? 'Chưa phân loại';
  const busy = assignMutation.isPending;

  return (
    <ScreenContainer
      header={
        <ScreenHeader
          onBack={() => goBackToDocuments(router)}
          showBack
          title="Chi tiết tài liệu"
        />
      }
    >
      {doc.file_ext === 'docx' ? (
        <Banner icon={AppIcons.information} visible>
          {DOCX_AI_NOTICE}
        </Banner>
      ) : null}

      <Card mode="outlined">
        <Card.Title
          left={(props) => (
            <List.Icon {...props} icon={AppIcons.fileDocumentOutline} />
          )}
          subtitle={`${getFileTypeLabel(doc.file_ext)} • ${formatFileSize(doc.file_size)}`}
          title={doc.display_name}
          titleNumberOfLines={3}
        />
        <Divider />
        <Card.Content style={styles.rows}>
          <InfoRow label="Môn học" value={currentSubjectName} />
          <InfoRow label="Ngày tải lên" value={formatDateTime(doc.created_at)} />
          <InfoRow
            label="Trạng thái trích xuất"
            value={getExtractionStatusLabel(doc.extraction_status)}
          />
        </Card.Content>
      </Card>

      <Button
        accessibilityLabel="Mở tài liệu bằng ứng dụng ngoài"
        disabled={opening}
        icon={AppIcons.openInNew}
        loading={opening}
        mode="contained"
        onPress={handleOpen}
        testID="document-open"
      >
        Mở tài liệu
      </Button>

      <SummarySection doc={doc} userId={userId ?? ''} />

      <QaSection doc={doc} userId={userId ?? ''} />

      <SolutionSection doc={doc} key={`solution-${doc.id}`} userId={userId ?? ''} />

      <RenameDocumentForm
        documentId={doc.id}
        initialName={doc.display_name}
        key={doc.id}
        onNotice={showNotice}
        userId={userId ?? ''}
      />

      <View>
        <Text variant="titleSmall">Môn học</Text>
        <Menu
          anchor={
            <Button
              accessibilityLabel={`Môn hiện tại: ${currentSubjectName}. Chạm để đổi.`}
              disabled={busy}
              icon={AppIcons.tagOutline}
              mode="outlined"
              onPress={() => setSubjectMenuVisible(true)}
              testID="document-subject-button"
            >
              {currentSubjectName}
            </Button>
          }
          onDismiss={() => setSubjectMenuVisible(false)}
          visible={subjectMenuVisible}
        >
          <Menu.Item
            onPress={() => handleAssign(null)}
            testID="document-subject-none"
            title="Chưa phân loại"
          />
          <Divider />
          {subjects.map((subject) => (
            <Menu.Item
              key={subject.id}
              onPress={() => handleAssign(subject.id)}
              testID={`document-subject-${subject.id}`}
              title={subject.name}
            />
          ))}
        </Menu>
      </View>

      <Button
        accessibilityLabel="Xóa tài liệu này"
        disabled={deleteMutation.isPending}
        icon={AppIcons.trashCanOutline}
        mode="outlined"
        onPress={() => setDeleteDialogVisible(true)}
        testID="document-delete"
        textColor={theme.colors.error}
      >
        Xóa tài liệu
      </Button>

      <Portal>
        <Dialog
          onDismiss={() => setDeleteDialogVisible(false)}
          visible={deleteDialogVisible}
        >
          <Dialog.Title>Xóa tài liệu?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Tài liệu “{doc.display_name}” sẽ bị xóa vĩnh viễn khỏi kho lưu
              trữ và danh sách. Không có thùng rác để khôi phục.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Hủy</Button>
            <Button
              loading={deleteMutation.isPending}
              onPress={handleDelete}
              testID="document-delete-confirm"
            >
              Xóa
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FeedbackSnackbar
        actionLabel={notice?.actionLabel}
        message={notice?.message ?? ''}
        onAction={notice?.actionLabel ? retryDelete : undefined}
        onDismiss={() => setNotice(null)}
        variant={notice?.variant ?? 'info'}
        visible={notice !== null}
      />
    </ScreenContainer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="bodySmall">{label}</Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

/**
 * Form đổi tên FR-10. `key={doc.id}` ở nơi dùng nên `useState(initialName)`
 * luôn khởi tạo đúng tên hiện tại mà không cần effect đồng bộ.
 */
function RenameDocumentForm({
  documentId,
  initialName,
  onNotice,
  userId,
}: {
  documentId: string;
  initialName: string;
  onNotice: (message: string, variant: FeedbackVariant) => void;
  userId: string;
}) {
  const [value, setValue] = useState(initialName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const renameMutation = useRenameDocument(userId, documentId);

  const handleSave = () => {
    if (renameMutation.isPending) {
      return;
    }
    setFieldError(null);
    renameMutation.mutate(value, {
      onError: (error: unknown) => {
        const message = toDocumentsErrorMessage(error);
        // Lỗi validate tên thì nằm dưới ô nhập, giữ tên cũ.
        if (
          message.includes('Tên tài liệu') ||
          message.includes('trống') ||
          message.includes('120')
        ) {
          setFieldError(message);
        } else {
          onNotice(message, 'error');
        }
      },
      onSuccess: () => {
        onNotice('Đã đổi tên tài liệu.', 'success');
      },
    });
  };

  return (
    <View>
      <Text variant="titleSmall">Đổi tên</Text>
      <FormTextInput
        accessibilityLabel="Tên tài liệu mới"
        fieldError={fieldError ?? undefined}
        label="Tên hiển thị (1–120 ký tự)"
        leftIcon={AppIcons.pencil}
        onChangeText={(text) => {
          setValue(text);
          setFieldError(null);
        }}
        testID="document-rename-input"
        value={value}
      />
      <Button
        accessibilityLabel="Lưu tên tài liệu mới"
        disabled={renameMutation.isPending}
        icon={AppIcons.contentSave}
        loading={renameMutation.isPending}
        mode="outlined"
        onPress={handleSave}
        testID="document-rename-save"
      >
        Lưu tên
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 2,
  },
  rows: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
