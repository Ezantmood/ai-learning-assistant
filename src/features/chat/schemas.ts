import { z } from 'zod';

/**
 * Schema CN4 (hỏi đáp trên `extracted_text`).
 * Câu hỏi tối đa 500 ký tự (giữ prompt gọn, đỡ đốt quota); câu trả lời
 * tối đa 20.000 ký tự (CHECK ở DB, cùng ngưỡng bản tóm tắt CN3).
 * Vượt thì báo lỗi rõ, không cắt im lặng.
 */
export const MAX_QUESTION_CHARS = 500;
export const MAX_ANSWER_CHARS = 20000;

export const questionSchema = z
  .string()
  .trim()
  .min(1, 'Hãy nhập câu hỏi trước khi gửi.')
  .max(
    MAX_QUESTION_CHARS,
    'Câu hỏi tối đa 500 ký tự. Hãy hỏi ngắn gọn hơn.',
  );

export const answerSchema = z
  .string()
  .trim()
  .min(1, 'Gemini không trả về câu trả lời. Hãy thử lại.')
  .max(
    MAX_ANSWER_CHARS,
    'Câu trả lời vượt 20.000 ký tự. Hãy hỏi câu hẹp hơn.',
  );
