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

  it('map OTP hết hạn sang tiếng Việt + gợi gửi lại mã', () => {
    expect(
      toAuthErrorMessage(new Error('Token has expired or is invalid')),
    ).toBe('Mã OTP đã hết hạn. Nhấn Gửi lại mã để nhận mã mới.');
  });

  it('map OTP sai sang tiếng Việt', () => {
    expect(toAuthErrorMessage(new Error('Invalid OTP code'))).toBe(
      'Mã OTP chưa đúng. Kiểm tra lại mã trong email rồi thử lại.',
    );
  });

  it('map mã đã dùng sang tiếng Việt', () => {
    expect(
      toAuthErrorMessage(new Error('This token has already been used')),
    ).toContain('đã được sử dụng');
  });

  it('map vượt quota gửi email sang thông báo rõ ràng', () => {
    expect(
      toAuthErrorMessage(new Error('You have exceeded the limit for sending emails: over_email_send_rate_limit')),
    ).toContain('100 email/giờ');
  });

  it('giữ thông báo rate limit chung cho lỗi không phải email', () => {
    expect(toAuthErrorMessage(new Error('Rate limit exceeded'))).toContain(
      'thao tác quá nhanh',
    );
  });

  it('map mật khẩu mới trùng mật khẩu cũ sang tiếng Việt', () => {
    expect(
      toAuthErrorMessage(
        new Error('New password should be different from the old password.'),
      ),
    ).toContain('phải khác mật khẩu hiện tại');
  });

  it('map sai mật khẩu hiện tại riêng cho luồng đổi mật khẩu', () => {
    expect(
      toAuthErrorMessage(new Error('Invalid login credentials'), {
        flow: 'change-password',
      }),
    ).toContain('Mật khẩu hiện tại chưa đúng');
  });

  it('không nhầm session hết hạn thành OTP hết hạn', () => {
    expect(toAuthErrorMessage(new Error('Auth session missing'))).toContain(
      'hết hạn',
    );
    expect(toAuthErrorMessage(new Error('Auth session missing'))).not.toContain(
      'OTP',
    );
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
