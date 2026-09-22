import { StyleSheet, View } from 'react-native';
import { Banner, Button, Card, List, Text, useTheme } from 'react-native-paper';
import type { DocumentWithSubject } from '../../../src/features/documents/api';
import { isSolverQuotaError, toSolverErrorMessage } from '../../../src/features/solver/errors';
import { useRequestSolution, useSolution } from '../../../src/features/solver/queries';
import { EmptyState } from '../../../src/shared/components/EmptyState';
import { ListSkeleton } from '../../../src/shared/components/LoadingState';
import { AppIcons } from '../../../src/shared/theme/icons';
import { spacing } from '../../../src/shared/theme/spacing';
import type { AppTheme } from '../../../src/shared/theme/theme';

/** Cùng một vùng cho PDF/TXT đã tóm tắt và ảnh CN5 đã quét. */
export function SolutionSection({ doc, userId }: {
  doc: DocumentWithSubject; userId: string;
}) {
  const theme = useTheme<AppTheme>();
  const solutionQuery = useSolution(userId, doc.id);
  const mutation = useRequestSolution(userId, doc.id);
  const unsupported = doc.file_ext === 'docx' || doc.extraction_status === 'unsupported';
  const hasText = Boolean(doc.extracted_text?.trim());
  const available = !unsupported && hasText;
  const quota = mutation.error != null && isSolverQuotaError(mutation.error);
  const run = () => {
    if (!available || mutation.isPending) return;
    mutation.mutate({
      extracted_text: doc.extracted_text,
      extraction_status: doc.extraction_status,
      file_ext: doc.file_ext,
      id: doc.id,
      user_id: doc.user_id,
    });
  };

  return (
    <Card mode="outlined">
      <Card.Title
        left={(props) => <List.Icon {...props} icon={AppIcons.lightbulbOutline} />}
        subtitle="Hướng giải từng bước dựa trên đề bài"
        title="Gợi ý lời giải"
      />
      <Card.Content style={styles.content}>
        {!available ? (
          <Banner icon={AppIcons.information} visible>
            {unsupported
              ? 'DOCX chưa được hỗ trợ. Hãy chuyển đề bài sang PDF hoặc ảnh, rồi tóm tắt hoặc quét trước.'
              : 'Chưa có nội dung đề bài. Hãy bấm “Tóm tắt bằng AI” ở trên, hoặc quét ảnh đề bài trước.'}
          </Banner>
        ) : solutionQuery.isPending ? (
          <ListSkeleton rows={2} />
        ) : solutionQuery.isError ? (
          <EmptyState
            actionLabel="Thử lại"
            actionTestID="solution-fetch-retry"
            description={toSolverErrorMessage(solutionQuery.error)}
            icon={AppIcons.alertCircle}
            onAction={() => { void solutionQuery.refetch(); }}
            title="Không tải được gợi ý lời giải"
          />
        ) : (
          <View style={styles.content}>
            {mutation.isPending ? (
              <Button disabled loading mode="contained" testID="solution-running">
                Đang gợi ý…
              </Button>
            ) : mutation.error ? (
              quota ? (
                <Banner icon={AppIcons.alertCircle} visible>
                  <Text style={{ color: theme.colors.error }}>
                    {toSolverErrorMessage(mutation.error)}
                  </Text>
                </Banner>
              ) : (
                <View style={styles.content}>
                  <Text style={{ color: theme.colors.error }} variant="bodyMedium">
                    {toSolverErrorMessage(mutation.error)}
                  </Text>
                  <Button icon={AppIcons.refresh} mode="outlined" onPress={run} testID="solution-retry">
                    Thử lại
                  </Button>
                </View>
              )
            ) : null}

            {solutionQuery.data ? (
              <Text testID="solution-text" variant="bodyMedium">
                {solutionQuery.data.solution_text}
              </Text>
            ) : !mutation.isPending && !mutation.error ? (
              <Text variant="bodyMedium">Chưa có gợi ý — bấm nút để tạo.</Text>
            ) : null}

            {!mutation.error && !mutation.isPending ? (
              <Button
                accessibilityLabel={solutionQuery.data ? 'Gợi ý lại lời giải' : 'Gợi ý lời giải'}
                disabled={mutation.isPending}
                icon={solutionQuery.data ? AppIcons.refresh : AppIcons.lightbulbOutline}
                loading={mutation.isPending}
                mode={solutionQuery.data ? 'outlined' : 'contained'}
                onPress={run}
                testID={solutionQuery.data ? 'solution-rerun' : 'solution-run'}
              >
                {solutionQuery.data ? 'Gợi ý lại' : 'Gợi ý lời giải'}
              </Button>
            ) : null}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.sm } });
