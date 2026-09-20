import { z } from 'zod';

/**
 * Schema CN3 (FR-14/FR-17): bản tóm tắt lưu ở `document_summaries.summary_text`,
 * tối đa 20.000 ký tự (CHECK ở DB). Vượt thì báo lỗi rõ, không cắt im lặng.
 */
export const summaryTextSchema = z
  .string()
  .trim()
  .min(1, 'Bản tóm tắt rỗng. Hãy thử lại.')
  .max(
    20000,
    'Bản tóm tắt vượt 20.000 ký tự. Hãy thử lại với tài liệu ngắn hơn.',
  );

/** Nguồn gửi cho transport: PDF base64 inline, TXT text trực tiếp. */
export const summarySourceSchema = z.discriminatedUnion('kind', [
  z.object({
    base64Data: z.string().min(1, 'Nội dung PDF rỗng. Hãy thử tải lại tệp.'),
    kind: z.literal('pdf'),
  }),
  z.object({
    kind: z.literal('txt'),
    textContent: z.string().min(1, 'Nội dung TXT rỗng. Hãy thử tải lại tệp.'),
  }),
]);

export type SummarySourceInput = z.infer<typeof summarySourceSchema>;
