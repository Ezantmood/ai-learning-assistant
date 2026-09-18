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
    // Đặt trước rule mật khẩu yếu vì server báo "New password should be
    // different..." cũng khớp /password should be/.
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
    patterns: [/same.*password/i, /should be different/i],
  },
  {
    message:
      'Mật khẩu chưa đạt yêu cầu (tối thiểu 8 ký tự, có cả chữ và số).',
    patterns: [/password should be/i, /weak password/i, /password.*too short/i],
  },
  {
    // Supabase gộp mã sai/hết hạn/đã dùng thành một lỗi "Token has expired
    // or is invalid": rule hết hạn đặt trước rule mã sai để chuỗi đó đi
    // đúng nhánh "hết hạn + gửi lại mã".
    message: 'Mã này đã được sử dụng. Mỗi mã chỉ dùng một lần — nhấn Gửi lại mã để nhận mã mới.',
    patterns: [/already.*(used|consumed)/i, /consumed/i, /single.?use/i],
  },
  {
    message: 'Mã OTP đã hết hạn. Nhấn Gửi lại mã để nhận mã mới.',
    patterns: [/otp.*expir/i, /expir.*otp/i, /token.*expir/i, /expir.*token/i],
  },
  {
    message: 'Mã OTP chưa đúng. Kiểm tra lại mã trong email rồi thử lại.',
    patterns: [
      /invalid.*(otp|token|code)/i,
      /(otp|token|code).*invalid/i,
      /incorrect.*(otp|token|code)/i,
      /(otp|token|code).*incorrect/i,
      /bad otp/i,
    ],
  },
  {
    // Đặt trước rule rate limit chung để quota email có thông báo riêng.
    message:
      'Đã vượt giới hạn gửi email đặt lại mật khẩu (tối đa 100 email/giờ). Đợi một lát rồi nhấn Gửi lại mã.',
    patterns: [/over_email_send_rate_limit/i, /over_request_rate_limit/i],
  },
  {
    message: 'Bạn thao tác quá nhanh. Đợi một lát rồi thử lại.',
    patterns: [/rate limit/i, /for security purposes/i],
  },
  {
    message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    patterns: [/auth session missing/i, /session.*expired/i, /refresh token/i],
  },
];

type ErrorContext = {
  // Màn hình đổi mật khẩu (đã đăng nhập): lỗi sai mật khẩu phải nói rõ
  // là "mật khẩu hiện tại" thay vì câu chung của đăng nhập.
  flow?: 'change-password';
};

/**
 * Hàm duy nhất chuyển lỗi Supabase/auth sang tiếng Việt (G3, mở rộng G4).
 * Không bao giờ trả raw error ra UI: fallback là thông báo chung an toàn.
 */
export function toAuthErrorMessage(error: unknown, context?: ErrorContext): string {
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  const message = error instanceof Error ? error.message : '';

  if (
    context?.flow === 'change-password' &&
    /invalid login credentials|invalid email or password/i.test(message)
  ) {
    return 'Mật khẩu hiện tại chưa đúng. Vui lòng thử lại.';
  }

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(message))) {
      return rule.message;
    }
  }

  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}
