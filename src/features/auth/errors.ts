import { isNetworkError } from '../../lib/network';

type MatchRule = {
  message: string;
  patterns: RegExp[];
};

const RULES: MatchRule[] = [
  {
    message: 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.',
    patterns: [/user already registered/i, /already been registered/i],
  },
  {
    message: 'Mã sinh viên đã được sử dụng. Vui lòng kiểm tra lại.',
    patterns: [/student_code/i, /duplicate key value/i],
  },
  {
    message: 'Email hoặc mật khẩu chưa đúng. Vui lòng thử lại.',
    patterns: [/invalid login credentials/i, /invalid email or password/i],
  },
  {
    message:
      'Email chưa được xác thực. Mở hộp thư và bấm liên kết xác nhận trước khi đăng nhập.',
    patterns: [/email not confirmed/i, /email confirmation/i],
  },
  {
    message:
      'Mật khẩu chưa đạt yêu cầu (tối thiểu 8 ký tự, có cả chữ và số).',
    patterns: [/password should be/i, /weak password/i, /password.*too short/i],
  },
  {
    message: 'Bạn thao tác quá nhanh. Đợi một lát rồi thử lại.',
    patterns: [/rate limit/i, /over_email_send_rate_limit/i, /for security purposes/i],
  },
  {
    message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    patterns: [/auth session missing/i, /session.*expired/i, /refresh token/i],
  },
];

/**
 * Hàm duy nhất chuyển lỗi Supabase/auth sang tiếng Việt (G3).
 * Không bao giờ trả raw error ra UI: fallback là thông báo chung an toàn.
 */
export function toAuthErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  const message = error instanceof Error ? error.message : '';

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(message))) {
      return rule.message;
    }
  }

  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}
