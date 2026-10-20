import { z } from 'zod';

export const solutionTextSchema = z.string().trim()
  .min(1, 'Gemini không trả về gợi ý lời giải. Hãy thử lại.')
  .max(20000, 'Gợi ý vượt 20.000 ký tự. Hãy dùng tài liệu ngắn hơn.');

export const solutionKindSchema = z.enum(['analysis', 'hint', 'explanation', 'solution', 'follow_up']);
export const solverOptionsSchema = z.object({
  kind: solutionKindSchema.default('hint'),
  history: z.array(z.object({ kind: solutionKindSchema, text: solutionTextSchema })).default([]),
  hintStep: z.number().int().nonnegative().default(0),
  question: z.string().trim().max(500, 'Câu hỏi tối đa 500 ký tự.').default(''),
}).superRefine((value, context) => {
  if (value.kind === 'follow_up' && (!value.question || !value.history.length)) {
    context.addIssue({ code: 'custom', message: 'Hãy nhập câu hỏi và tạo ít nhất một phản hồi trước khi hỏi tiếp.' });
  }
});
