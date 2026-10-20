import { SUMMARY_MODEL } from '../../shared/ai/models';
import { answerWithGemini, type ConversationTurn } from '../../shared/ai/transport';
import { supabase } from '../../shared/lib/supabase';
import type {
  DocumentQuestionRow,
  DocumentRow,
} from '../../shared/types/database';
import { ChatGuardError } from './errors';
import { answerSchema, questionSchema } from './schemas';

export type ChatDocument = Pick<
  DocumentRow,
  'extracted_text' | 'extraction_status' | 'file_ext' | 'id' | 'user_id'
>;

export async function listQuestions(input: {
  documentId: string;
  userId: string;
}): Promise<DocumentQuestionRow[]> {
  const { data, error } = await supabase
    .from('document_questions')
    .select('*')
    .eq('document_id', input.documentId)
    .eq('user_id', input.userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** Tạo lượt trả lời trong bộ nhớ; saveConversation chỉ chạy khi chọn lưu. */
export async function askQuestion(input: {
  document: ChatDocument;
  question: string;
  userId: string;
  history?: ConversationTurn[];
}): Promise<{ question: string; answer: string; model: string }> {
  const { document, userId } = input;

  // 1. Quyền sở hữu: document của người khác → từ chối ngay, chưa chạm gì.
  if (document.user_id !== userId) {
    throw new ChatGuardError('Bạn không có quyền hỏi đáp trên tài liệu này.');
  }

  // 2. DOCX/unsupported: không bao giờ có extracted_text, chặn rõ ràng.
  if (
    document.file_ext === 'docx' ||
    document.extraction_status === 'unsupported'
  ) {
    throw new ChatGuardError(
      'Tệp DOCX không được hỗ trợ hỏi đáp. Hãy chuyển sang PDF.',
    );
  }

  // 3. Chưa có extracted_text → chặn, bảo user tóm tắt trước (lệnh session).
  const context = document.extracted_text?.trim() ?? '';
  if (!context) {
    throw new ChatGuardError(
      'Hãy bấm “Tóm tắt bằng AI” trước để có nội dung hỏi đáp.',
    );
  }

  // 4. Validate câu hỏi TRƯỚC khi gọi Gemini (sai thì chưa tốn request).
  const parsedQuestion = questionSchema.safeParse(input.question);
  if (!parsedQuestion.success) {
    throw new ChatGuardError(
      parsedQuestion.error.issues[0]?.message ?? 'Câu hỏi không hợp lệ.',
    );
  }

  const history = input.history ?? [];
  if (context.length + history.reduce((n, turn) => n + turn.question.length + turn.answer.length, 0) > 300000) {
    throw new ChatGuardError('Ngữ cảnh quá dài. Hãy lưu hội thoại rồi bắt đầu phiên mới hoặc dùng tài liệu ngắn hơn.');
  }
  for (const turn of history) {
    if (!questionSchema.safeParse(turn.question).success || !answerSchema.safeParse(turn.answer).success) {
      throw new ChatGuardError('Ngữ cảnh hội thoại không hợp lệ. Hãy bắt đầu phiên mới.');
    }
  }
  const answer = await answerWithGemini({
    ...(input.history ? { history } : {}),
    contextText: context,
    question: parsedQuestion.data,
  });
  const parsedAnswer = answerSchema.safeParse(answer);
  if (!parsedAnswer.success) {
    throw new ChatGuardError(
      parsedAnswer.error.issues[0]?.message ?? 'Câu trả lời không hợp lệ.',
    );
  }

  // FR-30: chưa lưu DB; chỉ khi người dùng bấm Lưu hội thoại.
  return { question: parsedQuestion.data, answer: parsedAnswer.data, model: SUMMARY_MODEL };
}

export async function saveConversation(input: {
  documentId: string; userId: string; conversationId: string; turns: DocumentQuestionRow[];
}): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(input.conversationId) || !input.turns.length) {
    throw new ChatGuardError('Hội thoại chưa có nội dung để lưu.');
  }
  const rows = input.turns.map((turn) => {
    if (turn.user_id !== input.userId || turn.document_id !== input.documentId) {
      throw new ChatGuardError('Bạn không có quyền lưu hội thoại này.');
    }
    const question = questionSchema.safeParse(turn.question);
    const answer = answerSchema.safeParse(turn.answer);
    if (!question.success || !answer.success) throw new ChatGuardError('Nội dung hội thoại không hợp lệ.');
    return { ...turn, question: question.data, answer: answer.data, conversation_id: input.conversationId };
  });
  const { error } = await supabase.from('document_questions').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export function groupConversations(rows: DocumentQuestionRow[]) {
  const groups = new Map<string, DocumentQuestionRow[]>();
  for (const row of rows) {
    const id = row.conversation_id ?? row.id;
    const turns = groups.get(id) ?? [];
    turns.push(row);
    groups.set(id, turns);
  }
  return [...groups].map(([id, turns]) => ({ id, turns: turns.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)) }));
}
