import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Banner,
  Button,
  Card,
  List,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';

import { EmptyState } from '../../shared/components/EmptyState';
import { ListSkeleton } from '../../shared/components/LoadingState';
import type { DocumentWithSubject } from '../../shared/types/database';
import { AiResultText } from '../../shared/components/ai-result-text';
import { FormTextInput } from '../../shared/components/FormTextInput';
import { DEFAULT_SUMMARY_OPTIONS, type SummaryOptions } from '../../shared/ai/transport';

import {
  isStaleProcessing,
  reclaimStaleProcessing,
  type SummaryDocument,
} from './api';
import {
  isSummaryQuotaError,
  isSummaryTruncatedError,
  toSummaryErrorMessage,
} from './errors';
import {
  documentDetailKey,
  useRequestSummary,
  useSummary,
  useSummaryHistory,
} from './queries';
import { loadSummarySource } from './source';
import { AppIcons } from '../../shared/theme/icons';
import { spacing } from '../../shared/theme/spacing';
import type { AppTheme } from '../../shared/theme/theme';

const summaryLevelLabels: Record<string, string> = { short: 'Ngắn', medium: 'Vừa', detailed: 'Chi tiết' };

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
  const history = useSummaryHistory(userId, doc.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [options, setOptions] = useState<SummaryOptions>(DEFAULT_SUMMARY_OPTIONS);
  const requestMutation = useRequestSummary(userId);

  const runLock = useRef(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Chặn thu hồi lặp cho cùng một bản ghi (không dùng state để khỏi
  // setState đồng bộ trong effect).
  const reclaimedRef = useRef<string | null>(null);

  // Thu hồi `processing` treo (> 15 phút, app từng bị kill giữa chừng)
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
  const summary = history.data?.find((row) => row.id === selectedId) ?? summaryQuery.data ?? null;
  const isQuotaError =
    requestMutation.error != null &&
    isSummaryQuotaError(requestMutation.error);
  const isTruncated =
    requestMutation.error != null &&
    isSummaryTruncatedError(requestMutation.error);
  const running = busy || doc.extraction_status === 'processing';
  const stepLabel = loadingFile ? 'Đang tải tệp…' : 'Đang tóm tắt…';

  const handleRun = () => {
    if (running || runLock.current) {
      return;
    }
    runLock.current = true;
    setLoadError(null);
    setLoadingFile(true);
    (doc.extracted_text?.trim() && doc.extraction_status === 'done'
      ? Promise.resolve({ kind: 'txt' as const, textContent: doc.extracted_text })
      : loadSummarySource({ file_ext: doc.file_ext, id: doc.id, storage_path: doc.storage_path }))
      .then((source) => {
        setLoadingFile(false);
        requestMutation.mutate({
          document: toSummaryDocument(doc),
          source,
          options,
        }, { onSuccess: (row) => setSelectedId(row.id), onSettled: () => { runLock.current = false; } });
      })
      .catch((error: unknown) => {
        setLoadingFile(false);
        runLock.current = false;
        setLoadError(toSummaryErrorMessage(error));
      });
  };

  return (
    <Card mode="outlined">
      <Card.Title
        subtitleNumberOfLines={2}
        left={(props) => (
          <List.Icon {...props} icon={AppIcons.textBoxOutline} />
        )}
        subtitle="Nắm ý chính, tự động lưu để xem lại"
        title="Hiểu nhanh tài liệu"
      />
      <Card.Content style={styles.content}>
        <Text variant="titleSmall">{summary ? 'Mức độ cho bản mới' : 'Mức độ tóm tắt'}</Text>
        <SegmentedButtons value={options.level} onValueChange={(level) => setOptions({ ...options, level: level as SummaryOptions['level'] })}
          buttons={[{ value: 'short', label: 'Ngắn', disabled: running, labelStyle: styles.tabLabel }, { value: 'medium', label: 'Vừa', accessibilityLabel: 'Mức độ trung bình', disabled: running, labelStyle: styles.tabLabel }, { value: 'detailed', label: 'Chi tiết', disabled: running, labelStyle: styles.tabLabel }]} />
        <List.Accordion title={options.scope === 'whole' ? 'Phạm vi: toàn tài liệu' : 'Phạm vi: chương / phần'}>
        <SegmentedButtons value={options.scope} onValueChange={(scope) => setOptions({ ...options, scope: scope as SummaryOptions['scope'] })}
          buttons={[{ value: 'whole', label: 'Toàn bộ', disabled: running, labelStyle: styles.tabLabel }, { value: 'sections', label: 'Chương/phần', disabled: running, labelStyle: styles.tabLabel }]} />
        {options.scope === 'sections' ? <FormTextInput label="Tên chương/phần (để trống: tất cả)" value={options.sectionTitle}
          maxLength={200} disabled={running} onChangeText={(sectionTitle) => setOptions({ ...options, sectionTitle })} testID="summary-section-title" /> : null}
        </List.Accordion>
        {loadError || (requestMutation.error && !isTruncated) ? <Text style={{ color: theme.colors.error }}>
          {loadError ?? toSummaryErrorMessage(requestMutation.error)}
        </Text> : null}
        {running ? <Text accessibilityLiveRegion="polite">{stepLabel}</Text> : null}
        {summaryQuery.isPending ? (
          <ListSkeleton rows={2} />
        ) : summary ? (
          <View style={styles.content}>
            {isTruncated ? (
              <Banner icon={AppIcons.alertCircle} visible>
                <Text style={{ color: theme.colors.error }}>
                  {toSummaryErrorMessage(requestMutation.error)}
                </Text>
              </Banner>
            ) : null}
            <Text variant="labelMedium">Đã lưu · {summaryLevelLabels[summary.summary_level] ?? 'Vừa'} · {new Date(summary.created_at).toLocaleString('vi-VN')}</Text>
            <AiResultText text={summary.summary_text} testID="summary-text" />
            <Button contentStyle={styles.touchTarget}
              accessibilityLabel="Tóm tắt lại tài liệu này"
              disabled={running}
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
          <Button contentStyle={styles.touchTarget}
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
            <Button contentStyle={styles.touchTarget}
              accessibilityLabel="Thử tóm tắt lại"
              disabled={running}
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
              Chọn mức độ rồi tạo bản tóm tắt đầu tiên.
            </Text>
            <Button contentStyle={styles.touchTarget}
              accessibilityLabel="Tóm tắt tài liệu bằng AI"
              disabled={running}
              icon={AppIcons.textBoxOutline}
              mode="contained"
              onPress={handleRun}
              testID="summary-run"
            >
              Tóm tắt bằng AI
            </Button>
          </View>
        )}
        <List.Accordion title={`Bản tóm tắt đã lưu (${history.data?.length ?? 0})`}>
          {history.isError ? <Button contentStyle={styles.touchTarget} onPress={() => { void history.refetch(); }}>Thử tải lại lịch sử</Button> : null}
          {(history.data ?? []).map((row) => <List.Item key={row.id} title={new Date(row.created_at).toLocaleString('vi-VN')}
            description={`${summaryLevelLabels[row.summary_level] ?? 'Vừa'} · ${row.section_title || (row.summary_scope === 'sections' ? 'Theo chương/phần' : 'Toàn tài liệu')}`}
            onPress={() => setSelectedId(row.id)} />)}
        </List.Accordion>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  tabLabel: { paddingVertical: spacing.xs },
  touchTarget: { minHeight: spacing.xl * 2 },
  content: {
    gap: spacing.sm,
  },
});
