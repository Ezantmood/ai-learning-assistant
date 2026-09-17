import { z } from 'zod';

/**
 * Validate ghi chú (DATA-MODEL): title trim khác rỗng tối đa 120 ký tự,
 * content tối đa 5000 ký tự, cho phép rỗng.
 */
export const noteSchema = z.object({
  content: z.string().max(5000, 'Nội dung tối đa 5000 ký tự.'),
  title: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tiêu đề.')
    .max(120, 'Tiêu đề tối đa 120 ký tự.'),
});

export type NoteFormValues = z.input<typeof noteSchema>;
