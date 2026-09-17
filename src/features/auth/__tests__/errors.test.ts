import { describe, expect, it } from '@jest/globals';

import { toAuthErrorMessage } from '../errors';

describe('toAuthErrorMessage', () => {
  it('map sai mật khẩu sang tiếng Việt', () => {
    expect(toAuthErrorMessage(new Error('Invalid login credentials'))).toBe(
      'Email hoặc mật khẩu chưa đúng. Vui lòng thử lại.',
    );
  });

  it('map email chưa xác thực sang tiếng Việt', () => {
    expect(toAuthErrorMessage(new Error('Email not confirmed'))).toContain(
      'chưa được xác thực',
    );
  });

  it('map email trùng sang tiếng Việt', () => {
    expect(toAuthErrorMessage(new Error('User already registered'))).toContain(
      'đã được đăng ký',
    );
  });

  it('map mã sinh viên trùng sang tiếng Việt', () => {
    expect(
      toAuthErrorMessage(
        new Error('duplicate key value violates unique constraint "profiles_student_code_key"'),
      ),
    ).toContain('Mã sinh viên đã được sử dụng');
  });

  it('báo offline khi lỗi mạng', () => {
    expect(toAuthErrorMessage(new Error('Network request failed'))).toContain(
      'kết nối mạng',
    );
  });

  it('không bao giờ in raw error ra UI', () => {
    const raw = 'something-raw-internal-xyz-123';
    const message = toAuthErrorMessage(new Error(raw));
    expect(message).not.toContain(raw);
    expect(message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại.');
  });

  it('xử lý input không phải Error an toàn', () => {
    expect(toAuthErrorMessage('chuỗi lạ')).toBe(
      'Đã có lỗi xảy ra. Vui lòng thử lại.',
    );
    expect(toAuthErrorMessage(null)).toBe('Đã có lỗi xảy ra. Vui lòng thử lại.');
    expect(toAuthErrorMessage(undefined)).toBe(
      'Đã có lỗi xảy ra. Vui lòng thử lại.',
    );
  });
});
