import { describe, expect, it } from '@jest/globals';

import {
  AVATAR_MAX_BYTES,
  buildAvatarPath,
  estimateBase64Bytes,
  isAllowedAvatarMime,
  validateAvatarFile,
} from '../avatar';

describe('buildAvatarPath', () => {
  it('tạo path timestamp đúng quy ước <uid>/avatar_<ms>.jpg', () => {
    expect(buildAvatarPath('user-123', 1726579200000)).toBe(
      'user-123/avatar_1726579200000.jpg',
    );
  });

  it('hai timestamp khác nhau cho path khác nhau', () => {
    expect(buildAvatarPath('u', 1)).not.toBe(buildAvatarPath('u', 2));
  });
});

describe('isAllowedAvatarMime', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp', 'IMAGE/JPEG'])(
    'nhận %s',
    (mime) => {
      expect(isAllowedAvatarMime(mime)).toBe(true);
    },
  );

  it.each(['image/gif', 'image/svg+xml', 'application/pdf', '', null, undefined])(
    'từ chối %s',
    (mime) => {
      expect(isAllowedAvatarMime(mime)).toBe(false);
    },
  );
});

describe('estimateBase64Bytes', () => {
  it('ước lượng đúng 3/4 độ dài chuỗi', () => {
    expect(estimateBase64Bytes(400)).toBe(300);
  });
});

describe('validateAvatarFile', () => {
  it('nhận file jpeg trong giới hạn 2MB', () => {
    expect(
      validateAvatarFile({ mime: 'image/jpeg', sizeBytes: 1024 }),
    ).toBeNull();
  });

  it('chặn MIME ngoài JPEG/PNG/WEBP', () => {
    expect(
      validateAvatarFile({ mime: 'image/gif', sizeBytes: 1024 }),
    ).toContain('JPEG');
  });

  it('chặn file quá 2MB sau nén', () => {
    expect(
      validateAvatarFile({
        mime: 'image/jpeg',
        sizeBytes: AVATAR_MAX_BYTES + 1,
      }),
    ).toContain('2 MB');
  });

  it('nhận file đúng bằng 2MB', () => {
    expect(
      validateAvatarFile({
        mime: 'image/png',
        sizeBytes: AVATAR_MAX_BYTES,
      }),
    ).toBeNull();
  });
});
