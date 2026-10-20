import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner, Button, Card, List, Text, useTheme } from 'react-native-paper';
import { SOLUTION_LABELS, type SolutionKind, type SolutionTurn } from '../../lib/ai/transport';
import type { DocumentWithSubject } from '../../shared/types/database';
import { AiResultText } from '../../shared/components/ai-result-text';
import { FormTextInput } from '../../shared/components/FormTextInput';
import { AppIcons } from '../../shared/theme/icons';
import { spacing } from '../../shared/theme/spacing';
import type { AppTheme } from '../../shared/theme/theme';
import { SolverTruncatedError, toSolverErrorMessage } from './errors';
import { useRequestSolution, useSolution } from './queries';
import { solutionKindSchema } from './schemas';

export function SolutionSection({ doc, userId, analysisRequest }: {
  doc: DocumentWithSubject; userId: string; analysisRequest?: string;
}) {
  const theme = useTheme<AppTheme>();
  const query = useSolution(userId, doc.id);
  const mutation = useRequestSolution(userId, doc.id);
  const [turns, setTurns] = useState<SolutionTurn[]>([]);
  const [step, setStep] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const requested = useRef<string | null>(null);
  const saved = query.data;
  const history = useMemo<SolutionTurn[]>(() => turns.length ? turns : saved ? [{
    kind: solutionKindSchema.safeParse(saved.response_type).data ?? 'hint', text: saved.solution_text,
  }] : [], [turns, saved]);
  const hintStep = step ?? saved?.hint_step ?? 0;
  const available = doc.file_ext !== 'docx' && doc.extraction_status !== 'unsupported' && Boolean(doc.extracted_text?.trim());

  const run = useCallback(async (kind: SolutionKind) => {
    if (!available || mutation.isPending || lock.current) return;
    lock.current = true;
    setError(null);
    const previous = kind === 'analysis' ? [] : history;
    const nextStep = kind === 'analysis' ? 0 : kind === 'hint' ? hintStep + 1 : hintStep;
    try {
      const result = await mutation.mutateAsync({ document: doc, kind, history: previous, hintStep: nextStep, question });
      setTurns([...previous, { kind, text: result.solution_text }]);
      setStep(result.hint_step ?? nextStep);
      if (kind === 'follow_up') setQuestion('');
    } catch (reason) {
      setError(toSolverErrorMessage(reason));
      if (reason instanceof SolverTruncatedError) {
        const fresh = await query.refetch();
        if (fresh.data) setTurns([...previous, { kind, text: fresh.data.solution_text }]);
      }
    } finally { lock.current = false; }
  }, [available, mutation, history, hintStep, doc, question, query]);

  // Intent chỉ xuất hiện sau khi người dùng bấm phân tích OCR; không tự chạy khi mở tài liệu thường.
  useEffect(() => {
    if (!analysisRequest || requested.current === analysisRequest || !available || query.isPending || query.isError) return;
    requested.current = analysisRequest;
    void run('analysis');
  }, [analysisRequest, available, query.isPending, query.isError, run]);

  return <Card mode="outlined">
    <Card.Title title="Hỗ trợ giải bài" subtitle="Học từng bước; lời giải đầy đủ chỉ khi bạn yêu cầu"
      left={(props) => <List.Icon {...props} icon={AppIcons.lightbulbOutline} />} />
    <Card.Content style={styles.content}>
      {!available ? <Banner visible>Hãy tóm tắt PDF/TXT hoặc quét ảnh để có nội dung đề bài. DOCX cần chuyển sang PDF.</Banner>
        : query.isPending ? <Text>Đang tải lần hỗ trợ gần nhất…</Text>
        : query.isError ? <Button onPress={() => { void query.refetch(); }}>Thử tải lại</Button>
        : <>
          <Text variant="bodySmall">Lần hỗ trợ gần nhất được tự động lưu. Phân tích đề bài bắt đầu lại các bước gợi ý.</Text>
          {history.map((turn, index) => <View key={index} style={styles.content}>
            <Text variant="titleSmall">{SOLUTION_LABELS[turn.kind]}</Text>
            <AiResultText text={turn.text} testID={`solution-text-${index}`} />
          </View>)}
          {mutation.isPending ? <Button disabled loading testID="solution-running">AI đang xử lý…</Button> : null}
          {error ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>{error}</Text> : null}
          <Button disabled={mutation.isPending} mode="outlined" testID="solution-analysis" onPress={() => void run('analysis')}>Phân tích đề bài</Button>
          <Button disabled={mutation.isPending} mode="contained" testID="solution-hint" onPress={() => void run('hint')}>
            {hintStep ? `Gợi ý tiếp theo (bước ${hintStep + 1})` : 'Gợi ý đầu tiên'}
          </Button>
          <Button disabled={mutation.isPending} testID="solution-explain" onPress={() => void run('explanation')}>Giải thích khái niệm</Button>
          <Button disabled={mutation.isPending} mode="outlined" testID="solution-full" onPress={() => void run('solution')}>Yêu cầu lời giải tham khảo</Button>
          <FormTextInput label="Hỏi tiếp về hướng giải (tối đa 500 ký tự)" value={question} onChangeText={setQuestion}
            multiline maxLength={500} disabled={mutation.isPending} testID="solution-question" />
          <Button disabled={mutation.isPending || !history.length} testID="solution-follow-up" onPress={() => void run('follow_up')}>Hỏi tiếp về lời giải</Button>
        </>}
    </Card.Content>
  </Card>;
}
const styles = StyleSheet.create({ content: { gap: spacing.sm } });
