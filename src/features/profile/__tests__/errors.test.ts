import { describe, expect, it } from '@jest/globals';

import { toAvatarErrorMessage, toProfileErrorMessage } from '../errors';

describe('toProfileErrorMessage', () => {
  it('map unique violation code 23505 sang tiếng Việt', () => {
    const error = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      { code: '23505' },
    );
    expect(toProfileErrorMessage(error)).toContain(
      'Mã sinh viên này đã được sử dụng',
    );
  });

  it('map message trùng student_code khi không có code', () => {
    expect(
      toProfileErrorMessage(
        new Error('duplicate key value violates unique constraint "profiles_student_code_key"'),
      ),
    ).toContain('Mã sinh viên này đã được sử dụng');
  });

  it('báo offline khi lỗi mạng', () => {
    expect(toProfileErrorMessage(new Error('Network request failed'))).toContain(
      'kết nối mạng',
    );
  });

  it('fallback chung không lộ raw error', () => {
    const raw = 'something-raw-internal-xyz-789';
    const message = toProfileErrorMessage(new Error(raw));
    expect(message).not.toContain(raw);
    expect(message).toBe('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
  });
});

describe('toAvatarErrorMessage', () => {
  it('báo offline khi lỗi mạng', () => {
    expect(toAvatarErrorMessage(new Error('fetch failed'))).toContain(
      'kết nối mạng',
    );
  });

  it('fallback chung không lộ raw error', () => {
    const raw = 'storage-raw-internal-xyz-456';
    const message = toAvatarErrorMessage(new Error(raw));
    expect(message).not.toContain(raw);
    expect(message).toBe('Không thể tải ảnh lên. Vui lòng thử lại.');
  });
});
