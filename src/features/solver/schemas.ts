import { z } from 'zod';

export const solutionTextSchema = z.string().trim()
  .min(1, 'Gemini không trả về gợi ý lời giải. Hãy thử lại.')
  .max(20000, 'Gợi ý vượt 20.000 ký tự. Hãy dùng tài liệu ngắn hơn.');
