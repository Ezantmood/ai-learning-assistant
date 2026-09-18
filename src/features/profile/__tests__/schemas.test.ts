import { describe, expect, it } from '@jest/globals';

import { profileSchema } from '../schemas';

describe('profileSchema', () => {
  it('nhận hồ sơ hợp lệ', () => {
    const parsed = profileSchema.safeParse({
      fullName: 'Nguyen Van A',
      studentCode: 'SV123456',
    });
    expect(parsed.success).toBe(true);
  });

  it('cho phép họ tên rỗng (giữ luật G3/DB: chỉ chặn quá 100 ký tự)', () => {
    const parsed = profileSchema.safeParse({
      fullName: '',
      studentCode: 'SV123456',
    });
    expect(parsed.success).toBe(true);
  });

  it('chặn họ tên quá 100 ký tự', () => {
    const parsed = profileSchema.safeParse({
      fullName: 'a'.repeat(101),
      studentCode: 'SV123456',
    });
    expect(parsed.success).toBe(false);
  });

  it('chặn mã sinh viên rỗng', () => {
    const parsed = profileSchema.safeParse({
      fullName: 'Nguyen Van A',
      studentCode: '   ',
    });
    expect(parsed.success).toBe(false);
  });

  it('chặn mã sinh viên quá 30 ký tự', () => {
    const parsed = profileSchema.safeParse({
      fullName: 'Nguyen Van A',
      studentCode: 'a'.repeat(31),
    });
    expect(parsed.success).toBe(false);
  });

  it('không siết regex: chấp nhận mã có ký tự đặc biệt trong giới hạn DB', () => {
    const parsed = profileSchema.safeParse({
      fullName: 'Nguyen Van A',
      studentCode: 'SV-01_2024',
    });
    expect(parsed.success).toBe(true);
  });
});
