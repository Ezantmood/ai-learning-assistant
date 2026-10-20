import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner, Button, Card, List, Text, useTheme } from 'react-native-paper';
import { SOLUTION_LABELS, type SolutionKind, type SolutionTurn } from '../../shared/ai/transport';
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
  const [moreVisible, setMoreVisible] = useState(false);
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
    <Card.Title title="Hỗ trợ giải bài" subtitle="Bắt đầu bằng gợi ý, tự tìm ra lời giải" subtitleNumberOfLines={2}
      left={(props) => <List.Icon {...props} icon={AppIcons.lightbulbOutline} />} />
    <Card.Content style={styles.content}>
      {!available ? <Banner visible>Hãy tóm tắt PDF/TXT hoặc quét ảnh để có nội dung đề bài. DOCX cần chuyển sang PDF.</Banner>
        : query.isPending ? <Text>Đang tải lần hỗ trợ gần nhất…</Text>
        : query.isError ? <Button onPress={() => { void query.refetch(); }}>Thử tải lại</Button>
        : <>
          {history.length > 1 ? <List.Accordion title={`Các bước trước (${history.length - 1})`}>
            {history.slice(0, -1).map((turn, index) => <View key={index} style={styles.content}>
              <Text variant="titleSmall">{SOLUTION_LABELS[turn.kind]}</Text>
              <AiResultText text={turn.text} testID={`solution-text-${index}`} />
            </View>)}
          </List.Accordion> : null}
          {history.length ? <View style={styles.content}>
            <Text variant="titleSmall">{SOLUTION_LABELS[history[history.length - 1].kind]}</Text>
            <AiResultText text={history[history.length - 1].text} testID={`solution-text-${history.length - 1}`} />
            <Text variant="bodySmall">Đã tự động lưu lần hỗ trợ gần nhất.</Text>
          </View> : <Text>Nhận một gợi ý nhỏ để bắt đầu. Bạn có thể yêu cầu thêm từng bước.</Text>}
          {mutation.isPending ? <Button disabled loading testID="solution-running">AI đang xử lý…</Button> : null}
          {error ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>{error}</Text> : null}
          <Button disabled={mutation.isPending} mode="contained" testID="solution-hint" onPress={() => void run('hint')}>
            {hintStep ? `Gợi ý tiếp theo (bước ${hintStep + 1})` : 'Gợi ý đầu tiên'}
          </Button>
          {history.length ? <>
            <FormTextInput label="Hỏi thêm về bước này" value={question} onChangeText={setQuestion}
              multiline maxLength={500} disabled={mutation.isPending} testID="solution-question" />
            <Button disabled={mutation.isPending || !question.trim()} icon={AppIcons.send}
              testID="solution-follow-up" onPress={() => void run('follow_up')}>Gửi câu hỏi</Button>
          </> : null}
          <List.Accordion title="Cách hỗ trợ khác" testID="solution-more"
            expanded={moreVisible} onPress={() => setMoreVisible(!moreVisible)}>
            <Button disabled={mutation.isPending} testID="solution-analysis" onPress={() => void run('analysis')}>Phân tích đề bài</Button>
            <Button disabled={mutation.isPending} testID="solution-explain" onPress={() => void run('explanation')}>Giải thích khái niệm</Button>
            <Button disabled={mutation.isPending} mode="outlined" testID="solution-full" onPress={() => void run('solution')}>Yêu cầu lời giải tham khảo</Button>
            <Text variant="bodySmall">Phân tích đề sẽ bắt đầu lại các bước. Lời giải đầy đủ chỉ hiện khi bạn yêu cầu.</Text>
          </List.Accordion>
        </>}
    </Card.Content>
  </Card>;
}
const styles = StyleSheet.create({ content: { gap: spacing.sm } });
