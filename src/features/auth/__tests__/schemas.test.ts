import { describe, expect, it } from '@jest/globals';

import {
  getPasswordStrength,
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
