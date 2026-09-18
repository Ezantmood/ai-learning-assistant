/**
 * FR-03: hằng số + logic thuần của luồng quên mật khẩu (không import
 * AsyncStorage để unit test chạy được trong Jest; persistence nằm ở
 * recoveryStorage.ts). Email + thời điểm gửi mã được lưu local để thoát
 * app giữa chừng rồi quay lại vẫn tiếp tục được.
 */
export const PENDING_RECOVERY_EMAIL_KEY = 'pendingRecoveryEmail';
export const RECOVERY_SENT_AT_KEY = 'recoverySentAtMs';

/** Nút gửi lại mã bị khóa 60 giây sau mỗi lần gửi (chống spam). */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Số giây còn lại phải chờ trước khi được gửi lại mã. Trả về 0 khi
 * được phép gửi ngay (chưa từng gửi, đã hết cooldown hoặc dữ liệu lạ).
 */
export function getResendCooldownRemaining(
  sentAtMs: number | null | undefined,
  nowMs: number,
  cooldownSeconds: number = RESEND_COOLDOWN_SECONDS,
): number {
  if (typeof sentAtMs !== 'number' || !Number.isFinite(sentAtMs)) {
    return 0;
  }

  const elapsedSeconds = Math.floor((nowMs - sentAtMs) / 1000);
  return Math.max(0, cooldownSeconds - elapsedSeconds);
}


