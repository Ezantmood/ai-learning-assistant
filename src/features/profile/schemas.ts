import { z } from 'zod';

/**
 * FR-04: schema cập nhật hồ sơ.
 * Giữ đúng luật SPEC/DATA-MODEL và form đăng ký G3 (không siết thêm regex):
 * full_name tối đa 100 ký tự, student_code bắt buộc + duy nhất
 * (phân biệt hoa/thường, unique ở DB), tối đa 30 ký tự.
 */
export const profileSchema = z.object({
  fullName: z.string().trim().max(100, 'Họ tên tối đa 100 ký tự.'),
  studentCode: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã sinh viên.')
    .max(30, 'Mã sinh viên tối đa 30 ký tự.'),
});

export type ProfileFormValues = z.input<typeof profileSchema>;
