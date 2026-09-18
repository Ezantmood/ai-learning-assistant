import { z } from 'zod';

/**
 * Chính sách mật khẩu (SPEC quyết định 6): tối thiểu 8 ký tự,
 * có ít nhất một chữ cái và một chữ số.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')
  .regex(/[A-Za-z]/, 'Mật khẩu phải có ít nhất một chữ cái.')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất một chữ số.');

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email.')
  .email('Email chưa đúng định dạng.');

export const signUpSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu.'),
    email: emailSchema,
    fullName: z
      .string()
      .trim()
      .max(100, 'Họ tên tối đa 100 ký tự.'),
    password: passwordSchema,
    studentCode: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập mã sinh viên.')
      .max(30, 'Mã sinh viên tối đa 30 ký tự.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu nhập lại chưa khớp.',
    path: ['confirmPassword'],
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

/**
 * FR-03: mã OTP khôi phục mật khẩu — đúng 6 chữ số.
 * Template email Reset password trên Dashboard in {{ .Token }}.
 */
export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Mã OTP gồm đúng 6 chữ số.');

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * FR-03: mật khẩu mới sau verify OTP — dùng lại passwordSchema của G3.
 */
export const resetPasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới.'),
    newPassword: passwordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu nhập lại chưa khớp.',
    path: ['confirmPassword'],
  });

/**
 * Đổi mật khẩu khi đã đăng nhập: xác thực lại bằng mật khẩu hiện tại,
 * mật khẩu mới phải khác mật khẩu hiện tại.
 */
export const changePasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới.'),
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
    newPassword: passwordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu nhập lại chưa khớp.',
    path: ['confirmPassword'],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
    path: ['newPassword'],
  });

export type SignUpFormValues = z.input<typeof signUpSchema>;
export type SignInFormValues = z.input<typeof signInSchema>;
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.input<typeof changePasswordSchema>;

export type PasswordStrength = {
  label: 'Yếu' | 'Trung bình' | 'Mạnh';
  level: 0 | 1 | 2 | 3;
};

/**
 * Chỉ báo độ mạnh mật khẩu (hiển thị, không chặn thêm ngoài chính sách).
 */
export function getPasswordStrength(password: string): PasswordStrength {
  let level = 0;

  if (password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)) {
    level += 1;
  }
  if (password.length >= 12) {
    level += 1;
  }
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    level += 1;
  }
  if (/[^A-Za-z0-9]/.test(password)) {
    level += 1;
  }

  const capped = Math.min(level, 3) as 0 | 1 | 2 | 3;
  return {
    label: capped <= 1 ? 'Yếu' : capped === 2 ? 'Trung bình' : 'Mạnh',
    level: capped,
  };
}
