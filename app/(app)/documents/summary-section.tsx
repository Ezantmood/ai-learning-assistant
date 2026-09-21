import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Banner,
  Button,
  Card,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';

import { EmptyState } from '../../../src/shared/components/EmptyState';
import { ListSkeleton } from '../../../src/shared/components/LoadingState';
import type { DocumentWithSubject } from '../../../src/features/documents/api';
import { getExtractionStatusLabel } from '../../../src/features/documents/storage';
import {
  isStaleProcessing,
  reclaimStaleProcessing,
  type SummaryDocument,
} from '../../../src/features/summary/api';
import {
  isSummaryQuotaError,
  toSummaryErrorMessage,
} from '../../../src/features/summary/errors';
import {
  documentDetailKey,
  useRequestSummary,
  useSummary,
} from '../../../src/features/summary/queries';
import { loadSummarySource } from '../../../src/features/summary/source';
import { AppIcons } from '../../../src/shared/theme/icons';
import { spacing } from '../../../src/shared/theme/spacing';
import type { AppTheme } from '../../../src/shared/theme/theme';

function toSummaryDocument(doc: DocumentWithSubject): SummaryDocument {
  return {
    extraction_status: doc.extraction_status,
    file_ext: doc.file_ext,
    file_size: doc.file_size,
    id: doc.id,
    updated_at: doc.updated_at,
    user_id: doc.user_id,
  };
}

/**
 * Vùng tóm tắt CN3-G2 trong màn chi tiết (FR-14 → FR-20, không route mới).
 * DOCX: trả null (Banner gợi ý PDF đã render ở màn hình), KHÔNG gọi Gemini.
 * Bốn trạng thái: đang chạy (spinner + nút disabled) / bản mới nhất /
 * empty dẫn bấm nút / lỗi kèm “Thử lại” (429/quota → banner hạn mức,
 * CẤM retry).
 */
export function SummarySection({
  doc,
  userId,
}: {
  doc: DocumentWithSubject;
  userId: string;
}) {
  const theme = useTheme<AppTheme>();
  const queryClient = useQueryClient();
  const summaryQuery = useSummary(userId, doc.id);
  const requestMutation = useRequestSummary(userId);

  const [loadingFile, setLoadingFile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Chặn thu hồi lặp cho cùng một bản ghi (không dùng state để khỏi
  // setState đồng bộ trong effect).
  const reclaimedRef = useRef<string | null>(null);

  // FR-20: `processing` treo (> 15 phút, app từng bị kill giữa chừng)
  // tự thu hồi về `failed` khi mở màn, không kẹt vĩnh viễn.
  useEffect(() => {
    const candidate = toSummaryDocument(doc);
    const key = `${doc.id}:${doc.updated_at}`;
    if (
      doc.extraction_status === 'processing' &&
      isStaleProcessing(candidate) &&
      reclaimedRef.current !== key
    ) {
      reclaimedRef.current = key;
      reclaimStaleProcessing(candidate)
        .then((reclaimed) => {
          if (reclaimed) {
            void queryClient.invalidateQueries({
              queryKey: documentDetailKey(doc.id),
            });
          }
        })
        .catch(() => undefined);
    }
  }, [doc, queryClient]);

  if (doc.file_ext === 'docx') {
    return null;
  }

  const busy = loadingFile || requestMutation.isPending;
  const summary = summaryQuery.data ?? null;
  const isQuotaError =
    requestMutation.error != null &&
    isSummaryQuotaError(requestMutation.error);
  const running = busy || doc.extraction_status === 'processing';
  const stepLabel = loadingFile ? 'Đang tải tệp…' : 'Đang tóm tắt…';

  const handleRun = () => {
    if (busy) {
      return;
    }
    setLoadError(null);
    setLoadingFile(true);
    loadSummarySource({
      file_ext: doc.file_ext,
      id: doc.id,
      storage_path: doc.storage_path,
    })
      .then((source) => {
        setLoadingFile(false);
        requestMutation.mutate({
          document: toSummaryDocument(doc),
          source,
        });
      })
      .catch((error: unknown) => {
        setLoadingFile(false);
        setLoadError(toSummaryErrorMessage(error));
      });
  };

  return (
    <Card mode="outlined">
      <Card.Title
        left={(props) => (
          <List.Icon {...props} icon={AppIcons.textBoxOutline} />
        )}
        subtitle={`Trạng thái: ${getExtractionStatusLabel(doc.extraction_status)}`}
        title="Tóm tắt bằng AI"
      />
      <Card.Content style={styles.content}>
        {summaryQuery.isPending ? (
          <ListSkeleton rows={2} />
        ) : summary ? (
          <View style={styles.content}>
            <Text variant="bodyMedium">{summary.summary_text}</Text>
            <Button
              accessibilityLabel="Tóm tắt lại tài liệu này"
              disabled={busy}
              icon={AppIcons.refresh}
              mode="outlined"
              onPress={handleRun}
              testID="summary-rerun"
            >
              Tóm tắt lại
            </Button>
          </View>
        ) : isQuotaError ? (
          <Banner icon={AppIcons.alertCircle} visible>
            <Text style={{ color: theme.colors.error }}>
              {toSummaryErrorMessage(requestMutation.error)}
            </Text>
          </Banner>
        ) : running ? (
          <Button
            accessibilityLabel={stepLabel}
            disabled
            icon={AppIcons.textBoxOutline}
            loading
            mode="contained"
            testID="summary-running"
          >
            {stepLabel}
          </Button>
        ) : doc.extraction_status === 'failed' ||
          requestMutation.isError ||
          loadError !== null ? (
          <View style={styles.content}>
            <Text style={{ color: theme.colors.error }} variant="bodyMedium">
              {loadError ??
                (requestMutation.error
                  ? toSummaryErrorMessage(requestMutation.error)
                  : 'Lần tóm tắt trước thất bại. Hãy thử lại.')}
            </Text>
            <Button
              accessibilityLabel="Thử tóm tắt lại"
              disabled={busy}
              icon={AppIcons.refresh}
              mode="outlined"
              onPress={handleRun}
              testID="summary-retry"
            >
              Thử lại
            </Button>
          </View>
        ) : summaryQuery.isError ? (
          <EmptyState
            actionLabel="Thử lại"
            actionTestID="summary-fetch-retry"
            description={toSummaryErrorMessage(summaryQuery.error)}
            icon={AppIcons.alertCircle}
            onAction={() => {
              void summaryQuery.refetch();
            }}
            title="Không tải được bản tóm tắt"
          />
        ) : (
          <View style={styles.content}>
            <Text variant="bodyMedium">
              Chưa có bản tóm tắt — bấm nút để tạo.
            </Text>
            <Button
              accessibilityLabel="Tóm tắt tài liệu bằng AI"
              disabled={busy}
              icon={AppIcons.textBoxOutline}
              mode="contained"
              onPress={handleRun}
              testID="summary-run"
            >
              Tóm tắt bằng AI
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});
