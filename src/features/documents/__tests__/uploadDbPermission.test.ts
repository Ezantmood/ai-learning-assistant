import { describe, expect, it, jest } from '@jest/globals';

import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import { supabase } from '../../../shared/lib/supabase';
import { uploadDocument } from '../api';
import {
  getDocumentsErrorCode,
  toDocumentsErrorMessage,
} from '../errors';

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid',
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
}));

jest.mock('base64-arraybuffer', () => ({
  decode: jest.fn(),
}));

jest.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

const TXT_ASSET = {
  mimeType: 'text/plain',
  name: 'ghi-chu.txt',
  size: 225,
  uri: 'file:///cache/ghi-chu.txt',
};

/** Lỗi Postgrest: từ chối phân quyền chuẩn (RLS WITH CHECK trượt). */
function permissionDenied() {
  return {
    code: '42501',
    details: null,
    hint: null,
    message: 'permission denied for table documents',
  };
}

/** Lỗi FK: subject_id trỏ môn không tồn tại (không phải lỗi quyền). */
function foreignKeyViolation() {
  return {
    code: '23503',
    details: 'Key (subject_id)=(...) is not present in table "subjects".',
    hint: null,
    message: 'insert or update on table "documents" violates foreign key',
  };
}

/** Mã server không chuẩn từng thấy trên máy thật (sai chính tả). */
function upstreamMisspelled() {
  return {
    code: 'ERR_INVALID_PERMISION',
    message: 'permission denied',
  };
}

describe('toDocumentsErrorMessage — họ phân quyền DB', () => {
  it('42501 báo câu quyền riêng, không rơi vào banner chung', () => {
    const message = toDocumentsErrorMessage(permissionDenied());
    expect(message).toContain('quyền');
    expect(message).not.toBe(
      'Đã có lỗi xảy ra với tài liệu. Vui lòng thử lại.',
    );
  });

  it('mã server chứa permis (mọi biến thể chính tả) báo câu quyền', () => {
    expect(toDocumentsErrorMessage(upstreamMisspelled())).toContain('quyền');
  });

  it('23503 FK không phải lỗi quyền: giữ banner chung', () => {
    expect(toDocumentsErrorMessage(foreignKeyViolation())).toBe(
      'Đã có lỗi xảy ra với tài liệu. Vui lòng thử lại.',
    );
  });
});

describe('getDocumentsErrorCode — chính tả đúng', () => {
  it('họ phân quyền hiển thị PERMISSION_DENIED đúng chính tả', () => {
    expect(getDocumentsErrorCode(permissionDenied())).toBe(
      'E_DB_PERMISSION_DENIED',
    );
    expect(getDocumentsErrorCode(upstreamMisspelled())).toBe(
      'E_DB_PERMISSION_DENIED',
    );
  });

  it('mã DB khác giữ nguyên chuỗi server', () => {
    expect(getDocumentsErrorCode(foreignKeyViolation())).toBe('E_DB_23503');
  });
});

describe('uploadDocument — insert trượt thì dọn file vừa lên', () => {
  it('gọi storage.remove đúng path rồi ném lỗi insert gốc', async () => {
    (File as unknown as jest.Mock).mockImplementation(() => ({
      base64: () => Promise.resolve('aGVsbG8='),
    }));
    (decode as unknown as jest.Mock).mockReturnValue(new ArrayBuffer(8));

    (supabase.from as unknown as jest.Mock).mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () => ({ data: null, error: permissionDenied() }),
        }),
      }),
      select: () => ({ eq: () => ({ count: 0, error: null }) }),
    });

    const removeMock = jest.fn(() =>
      Promise.resolve({ data: [], error: null }),
    );
    const uploadMock = jest.fn(() =>
      Promise.resolve({ data: { path: 'user-1/mock-uuid.txt' }, error: null }),
    );
    (
      supabase.storage as unknown as { from: jest.Mock }
    ).from.mockReturnValue({
      remove: removeMock,
      upload: uploadMock,
    });

    await expect(
      uploadDocument({ asset: TXT_ASSET, userId: 'user-1' }),
    ).rejects.toMatchObject({ code: '42501' });
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledWith(['user-1/mock-uuid.txt']);
  });
});
