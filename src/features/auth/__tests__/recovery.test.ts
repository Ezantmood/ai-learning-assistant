import { describe, expect, it } from '@jest/globals';

import {
  getResendCooldownRemaining,
  RESEND_COOLDOWN_SECONDS,
} from '../recovery';

describe('getResendCooldownRemaining', () => {
  it('khóa đủ 60 giây ngay sau khi gửi', () => {
    expect(getResendCooldownRemaining(1_000, 1_000)).toBe(
      RESEND_COOLDOWN_SECONDS,
    );
  });

  it('đếm ngược chính xác theo thời gian đã trôi qua', () => {
    expect(getResendCooldownRemaining(0, 45_000)).toBe(15);
  });

  it('trả về 0 khi đã hết cooldown', () => {
    expect(getResendCooldownRemaining(0, 61_000)).toBe(0);
    expect(getResendCooldownRemaining(0, 3_600_000)).toBe(0);
  });

  it('trả về 0 khi chưa từng gửi mã', () => {
    expect(getResendCooldownRemaining(null, Date.now())).toBe(0);
    expect(getResendCooldownRemaining(undefined, Date.now())).toBe(0);
    expect(getResendCooldownRemaining(NaN, Date.now())).toBe(0);
  });

  it('đồng hồ lệch (sentAt trong tương lai) không trả số âm', () => {
    expect(getResendCooldownRemaining(10_000, 5_000)).toBe(
      RESEND_COOLDOWN_SECONDS + 5,
    );
  });
});
