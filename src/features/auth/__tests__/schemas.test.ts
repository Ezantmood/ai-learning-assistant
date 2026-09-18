import { describe, expect, it } from '@jest/globals';

import {
  changePasswordSchema,
  forgotPasswordSchema,
  getPasswordStrength,
  otpSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '../schemas';

const validSignUp = {
  confirmPassword: 'Abc12345',
  email: 'sv@example.com',
  fullName: 'Nguyen Van A',
  password: 'Abc12345',
  studentCode: 'SV001',
};

describe('signUpSchema', () => {
  it('chấp nhận dữ liệu hợp lệ', () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
  });

  it('từ chối email sai định dạng', () => {
    const result = signUpSchema.safeParse({ ...validSignUp, email: 'khong-phai-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'email')).toBe(true);
    }
  });

  it('từ chối mật khẩu ngắn hơn 8 ký tự', () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      confirmPassword: 'Ab1',
      password: 'Ab1',
    });
    expect(result.success).toBe(false);
  });

  it('từ chối mật khẩu thiếu chữ số', () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      confirmPassword: 'PasswordOnly',
      password: 'PasswordOnly',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'password')).toBe(true);
    }
  });

  it('từ chối mật khẩu thiếu chữ cái', () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      confirmPassword: '12345678',
      password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('báo lỗi đúng ô confirm khi nhập lại chưa khớp', () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      confirmPassword: 'Xyz98765',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === 'confirmPassword'),
      ).toBe(true);
    }
  });

  it('từ chối mã sinh viên rỗng hoặc quá 30 ký tự', () => {
    expect(
      signUpSchema.safeParse({ ...validSignUp, studentCode: '   ' }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({ ...validSignUp, studentCode: 'S'.repeat(31) })
        .success,
    ).toBe(false);
  });
});

describe('signInSchema', () => {
  it('chấp nhận email + mật khẩu hợp lệ', () => {
    expect(
      signInSchema.safeParse({ email: 'sv@example.com', password: 'Abc12345' })
        .success,
    ).toBe(true);
  });

  it('từ chối mật khẩu rỗng', () => {
    expect(
      signInSchema.safeParse({ email: 'sv@example.com', password: '' })
        .success,
    ).toBe(false);
  });
});

describe('otpSchema (FR-03)', () => {
  it('chấp nhận đúng 6 chữ số', () => {
    expect(otpSchema.safeParse('123456').success).toBe(true);
  });

  it('từ chối mã có chữ cái', () => {
    expect(otpSchema.safeParse('12a456').success).toBe(false);
  });

  it('từ chối mã thiếu hoặc thừa số', () => {
    expect(otpSchema.safeParse('12345').success).toBe(false);
    expect(otpSchema.safeParse('1234567').success).toBe(false);
    expect(otpSchema.safeParse('').success).toBe(false);
  });

  it('trim khoảng trắng quanh mã (hỗ trợ paste từ email)', () => {
    expect(otpSchema.safeParse('  123456\n').success).toBe(true);
  });
});

describe('forgotPasswordSchema (FR-03)', () => {
  it('chấp nhận email hợp lệ', () => {
    expect(
      forgotPasswordSchema.safeParse({ email: 'sv@example.com' }).success,
    ).toBe(true);
  });

  it('từ chối email sai định dạng', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'khong-phai-email' }).success).toBe(
      false,
    );
  });
});

describe('resetPasswordSchema (FR-03, dùng lại chính sách G3)', () => {
  const valid = { confirmPassword: 'Abc12345', newPassword: 'Abc12345' };

  it('chấp nhận mật khẩu mới hợp lệ + confirm khớp', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('từ chối mật khẩu mới vi phạm chính sách G3 (ngắn/thiếu số)', () => {
    expect(
      resetPasswordSchema.safeParse({ confirmPassword: 'Ab1', newPassword: 'Ab1' })
        .success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        confirmPassword: 'PasswordOnly',
        newPassword: 'PasswordOnly',
      }).success,
    ).toBe(false);
  });

  it('báo lỗi đúng ô confirm khi nhập lại chưa khớp', () => {
    const result = resetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'Xyz98765',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === 'confirmPassword'),
      ).toBe(true);
    }
  });
});

describe('changePasswordSchema', () => {
  const valid = {
    confirmPassword: 'Xyz98765',
    currentPassword: 'Abc12345',
    newPassword: 'Xyz98765',
  };

  it('chấp nhận đổi sang mật khẩu mới hợp lệ', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('từ chối mật khẩu hiện tại rỗng', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, currentPassword: '' }).success,
    ).toBe(false);
  });

  it('từ chối mật khẩu mới trùng mật khẩu hiện tại', () => {
    const result = changePasswordSchema.safeParse({
      confirmPassword: 'Abc12345',
      currentPassword: 'Abc12345',
      newPassword: 'Abc12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === 'newPassword'),
      ).toBe(true);
    }
  });
});

describe('getPasswordStrength', () => {
  it('mật khẩu ngắn là Yếu', () => {
    expect(getPasswordStrength('abc').label).toBe('Yếu');
  });

  it('mật khẩu đạt chính sách có chữ hoa/thường là Trung bình', () => {
    expect(getPasswordStrength('Abc12345').label).toBe('Trung bình');
  });

  it('mật khẩu dài có ký tự đặc biệt là Mạnh', () => {
    expect(getPasswordStrength('Abc12345!xyz').label).toBe('Mạnh');
  });
});
