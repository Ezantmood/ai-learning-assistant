import { describe, expect, it } from '@jest/globals';

import { toNotesErrorMessage } from '../errors';
import { noteSchema } from '../schemas';

describe('noteSchema', () => {
  it('chấp nhận title/content hợp lệ', () => {
    expect(
      noteSchema.safeParse({ content: 'Nội dung', title: 'Tiêu đề' }).success,
    ).toBe(true);
  });

  it('từ chối tiêu đề rỗng', () => {
    expect(noteSchema.safeParse({ content: '', title: '   ' }).success).toBe(
      false,
    );
  });

  it('từ chối tiêu đề quá 120 ký tự', () => {
    expect(
      noteSchema.safeParse({ content: '', title: 'T'.repeat(121) }).success,
    ).toBe(false);
  });

  it('từ chối nội dung quá 5000 ký tự', () => {
    expect(
      noteSchema.safeParse({ content: 'C'.repeat(5001), title: 'Ok' }).success,
    ).toBe(false);
  });
});

describe('toNotesErrorMessage', () => {
  it('báo offline khi lỗi mạng', () => {
    expect(toNotesErrorMessage(new Error('Network request failed'))).toContain(
      'kết nối mạng',
    );
  });

  it('dùng một thông báo cho cả không tìm thấy và không có quyền', () => {
    expect(toNotesErrorMessage(new Error('Note not found'))).toContain(
      'Không tìm thấy ghi chú',
    );
  });

  it('không lộ raw error', () => {
    const raw = 'raw-postgrest-detail-xyz';
    const message = toNotesErrorMessage(new Error(raw));
    expect(message).not.toContain(raw);
  });
});
