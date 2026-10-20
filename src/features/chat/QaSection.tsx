import * as Crypto from 'expo-crypto';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, List, Text, useTheme } from 'react-native-paper';
import type { DocumentQuestionRow, DocumentWithSubject } from '../../shared/types/database';
import { AiResultText } from '../../shared/components/ai-result-text';
import { FormTextInput } from '../../shared/components/FormTextInput';
import { AppIcons } from '../../shared/theme/icons';
import { spacing } from '../../shared/theme/spacing';
import type { AppTheme } from '../../shared/theme/theme';
import { groupConversations } from './api';
import { toChatErrorMessage } from './errors';
import { useAskQuestion, useQuestions, useSaveConversation } from './queries';

export function QaSection({ doc, userId }: { doc: DocumentWithSubject; userId: string }) {
  const theme = useTheme<AppTheme>();
  const [conversationId, setConversationId] = useState(() => Crypto.randomUUID());
  const [turns, setTurns] = useState<DocumentQuestionRow[]>([]);
  const [question, setQuestion] = useState('');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const ask = useAskQuestion(userId);
  const save = useSaveConversation(userId, doc.id);
  const hasContext = doc.file_ext !== 'docx' && Boolean(doc.extracted_text?.trim());
  const saved = useQuestions(userId, doc.id, hasContext);
  const busy = ask.isPending || save.isPending;

  const send = async () => {
    if (busy || lock.current) return;
    lock.current = true;
    setError(null);
    try {
      const result = await ask.mutateAsync({ document: doc, question, history: turns });
      const now = new Date().toISOString();
      setTurns([...turns, { ...result, id: Crypto.randomUUID(), document_id: doc.id,
        user_id: userId, conversation_id: conversationId, created_at: now, updated_at: now }]);
      setQuestion('');
      setDirty(true);
    } catch (reason) { setError(toChatErrorMessage(reason)); }
    finally { lock.current = false; }
  };

  const saveCurrent = async () => {
    if (busy || lock.current || !turns.length) return;
    lock.current = true;
    setError(null);
    try { await save.mutateAsync({ conversationId, turns }); setDirty(false); }
    catch (reason) { setError(toChatErrorMessage(reason)); }
    finally { lock.current = false; }
  };

  return <Card mode="outlined">
    <Card.Title title="Hỏi đáp với AI" subtitle="Trả lời theo tài liệu và ngữ cảnh phiên hiện tại"
      left={(props) => <List.Icon {...props} icon={AppIcons.messageTextOutline} />} />
    <Card.Content style={styles.content}>
      {!hasContext ? <Text>Hãy tóm tắt tài liệu hoặc quét ảnh trước để có nội dung hỏi đáp.</Text> : <>
        <Text variant="bodySmall">{dirty ? 'Có nội dung chưa lưu. Bấm Lưu hội thoại trước khi rời màn hoặc bắt đầu phiên mới.' : turns.length ? 'Hội thoại đã lưu.' : 'Phiên mới chỉ lưu khi bạn lựa chọn.'}</Text>
        <View style={styles.actions}>
          <Button disabled={busy} testID="qa-new" onPress={() => {
            setConversationId(Crypto.randomUUID()); setTurns([]); setQuestion(''); setDirty(false); setError(null);
          }}>Hội thoại mới</Button>
          <Button disabled={busy || !turns.length || !dirty} loading={save.isPending} testID="qa-save" onPress={() => void saveCurrent()}>Lưu hội thoại</Button>
        </View>
        {turns.map((turn) => <View key={turn.id} style={styles.content}>
          <Card mode="contained" style={{ alignSelf: 'flex-end', maxWidth: '95%' }}><Card.Content><Text selectable>Bạn: {turn.question}</Text></Card.Content></Card>
          <Card mode="outlined"><Card.Content><Text variant="labelMedium">Trợ lý</Text><AiResultText text={turn.answer} /></Card.Content></Card>
        </View>)}
        <FormTextInput label="Câu hỏi về tài liệu (tối đa 500 ký tự)" value={question} onChangeText={setQuestion}
          multiline numberOfLines={3} disabled={busy} maxLength={500} testID="qa-input" />
        <Button disabled={busy} loading={ask.isPending} mode="contained" onPress={() => void send()} testID="qa-submit">Hỏi</Button>
        {error ? <Text style={{ color: theme.colors.error }} accessibilityLiveRegion="polite">{error}</Text> : null}
        <List.Accordion title="Hội thoại đã lưu">
          {saved.isPending ? <Text>Đang tải lịch sử…</Text> : saved.isError
            ? <Button onPress={() => { void saved.refetch(); }}>Thử tải lại lịch sử</Button>
            : groupConversations(saved.data ?? []).map((session) => <List.Item key={session.id}
              title={session.turns[0]?.question ?? 'Hội thoại'} description={`${session.turns.length} lượt · ${new Date(session.turns[0]?.created_at ?? '').toLocaleString('vi-VN')}`}
              disabled={busy} onPress={() => { setConversationId(session.id); setTurns(session.turns); setDirty(false); setQuestion(''); setError(null); }} />)}
        </List.Accordion>
      </>}
    </Card.Content>
  </Card>;
}
const styles = StyleSheet.create({ content: { gap: spacing.sm }, actions: { flexDirection: 'row', flexWrap: 'wrap' } });
