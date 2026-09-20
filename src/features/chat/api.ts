import { SUMMARY_MODEL } from '../../lib/ai/models';
import { answerWithGemini } from '../../lib/ai/transport';
import { supabase } from '../../shared/lib/supabase';
import type {
  DocumentQuestionRow,
  DocumentRow,
} from '../../shared/types/database';
import { ChatGuardError } from './errors';
import { answerSchema, questionSchema } from './schemas';

/**
 * Tầng dữ liệu CN4 (hỏi đáp trên `extracted_text`, FR-23 → FR-30).
 * CẤM vector DB/RAG/chunking: toàn văn `extracted_text` nhồi thẳng vào
 * prompt trong MỘT request Gemini duy nhất. Lịch sử là append-only theo
 * từng tài liệu (lượt hỏi lỗi không tạo row nửa vời).
 */

/** Trường tối thiểu của tài liệu mà askQuestion cần (đọc qua tham số, không import feature documents). */
export type ChatDocument = Pick<
  DocumentRow,
  'extracted_text' | 'extraction_status' | 'file_ext' | 'id' | 'user_id'
>;

/** Lịch sử hỏi đáp của mình trên một tài liệu, mới nhất trước. */
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

/**
 * Hỏi một câu trên tài liệu: guard → gọi Gemini đúng một lần → validate
 * câu trả lời → insert lịch sử. Không retry tự động; lỗi Gemini/mạng ném
 * lên để UI báo và cho hỏi lại tay (không tạo row khi lỗi).
 */
export async function askQuestion(input: {
  document: ChatDocument;
  question: string;
  userId: string;
}): Promise<DocumentQuestionRow> {
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

  const answer = await answerWithGemini({
    contextText: context,
    question: parsedQuestion.data,
  });
  const parsedAnswer = answerSchema.safeParse(answer);
  if (!parsedAnswer.success) {
    throw new ChatGuardError(
      parsedAnswer.error.issues[0]?.message ?? 'Câu trả lời không hợp lệ.',
    );
  }

  const { data, error } = await supabase
    .from('document_questions')
    .insert({
      answer: parsedAnswer.data,
      document_id: document.id,
      model: SUMMARY_MODEL,
      question: parsedQuestion.data,
      user_id: userId,
    })
    .select()
    .single();

  if (error || !data) {
    throw error ?? new ChatGuardError('Không lưu được câu trả lời.');
  }

  return data;
}
