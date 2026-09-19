import { describe, expect, it, jest } from '@jest/globals';
import { supabase } from '../../../shared/lib/supabase';
import {
  deleteDocument,
  renameDocument,
} from '../api';
import {
  DocumentDeletePartialError,
  toSubjectsErrorMessage,
} from '../errors';
import { subjectNameSchema } from '../schemas';
import {
  buildDocumentSearchPattern,
  filterDocumentsLocal,
  getFileTypeLabel,
  matchesDocumentSearch,
  matchesSubjectFilter,
  normalizeSubjectName,
  validateSubjectCount,
} from '../storage';

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

function mockFrom(returnValue: unknown) {
  (supabase.from as unknown as jest.Mock).mockReturnValue(returnValue);
  return supabase.from as unknown as jest.Mock;
}

function mockStorageFrom(returnValue: unknown) {
  const storageFrom = (
    supabase.storage as unknown as { from: jest.Mock }
  ).from;
  (storageFrom as jest.Mock).mockReturnValue(returnValue);
  return storageFrom as jest.Mock;
}

describe('subjectNameSchema (FR-12: 1–60 sau chuẩn hóa)', () => {
  it('nhận tên hợp lệ', () => {
    expect(subjectNameSchema.parse('  Giải   tích  1 ')).toBe('Giải tích 1');
  });

  it('tên rỗng/toàn khoảng trắng bị từ chối', () => {
    expect(subjectNameSchema.safeParse('   ').success).toBe(false);
  });

  it('tên quá 60 ký tự bị từ chối', () => {
    expect(subjectNameSchema.safeParse('a'.repeat(61)).success).toBe(false);
    expect(subjectNameSchema.safeParse('a'.repeat(60)).success).toBe(true);
  });

  it('giữ hoa/thường khi chuẩn hóa (trùng tên phân biệt hoa/thường)', () => {
    expect(normalizeSubjectName('  TOÁN   cao cấp ')).toBe('TOÁN cao cấp');
  });
});

describe('validateSubjectCount (trần 30 môn)', () => {
  it('29 môn vẫn được tạo thêm', () => {
    expect(validateSubjectCount(29)).toBeNull();
  });

  it('30 môn thì chặn, không chèn im lặng', () => {
    expect(validateSubjectCount(30)).toContain('30');
  });

  it('vượt trần cũng chặn', () => {
    expect(validateSubjectCount(45)).toContain('30');
  });
});

describe('toSubjectsErrorMessage', () => {
  it('map 23505 sang câu trùng tên tiếng Việt', () => {
    expect(toSubjectsErrorMessage({ code: '23505' })).toContain('đã tồn tại');
  });

  it('lỗi mạng báo offline', () => {
    expect(toSubjectsErrorMessage(new Error('Network request failed'))).toContain(
      'mạng',
    );
  });
});

describe('buildDocumentSearchPattern (ilike theo display_name)', () => {
  it('bọc % hai đầu', () => {
    expect(buildDocumentSearchPattern('bài giảng')).toBe('%bài giảng%');
  });

  it('thoát ký tự đặc biệt LIKE %, _, \\', () => {
    expect(buildDocumentSearchPattern('100%_x\\y')).toBe(
      '%100\\%\\_x\\\\y%',
    );
  });

  it('query rỗng sau trim thì không lọc (null)', () => {
    expect(buildDocumentSearchPattern('')).toBeNull();
    expect(buildDocumentSearchPattern('   ')).toBeNull();
  });
});

describe('matchesDocumentSearch (PHÂN BIỆT DẤU — giới hạn đã chốt)', () => {
  it('không phân biệt hoa/thường', () => {
    expect(matchesDocumentSearch('Bài Giảng 1', 'bài giảng')).toBe(true);
  });

  it('gõ không dấu KHÔNG ra tên có dấu', () => {
    expect(matchesDocumentSearch('Bài giảng 1', 'bai giang')).toBe(false);
  });

  it('gõ có dấu khớp đúng dấu', () => {
    expect(matchesDocumentSearch('Bài giảng 1', 'Bài')).toBe(true);
  });

  it('query rỗng thì khớp mọi tài liệu', () => {
    expect(matchesDocumentSearch('Bất kỳ', '')).toBe(true);
  });
});

describe('matchesSubjectFilter + filterDocumentsLocal', () => {
  const docs = [
    { display_name: 'Giải tích 1', subject_id: 's1' },
    { display_name: 'Giải tích 2', subject_id: 's1' },
    { display_name: 'Vật lý đại cương', subject_id: null },
  ];

  it('undefined = tất cả', () => {
    expect(filterDocumentsLocal(docs, { query: '', subjectFilter: undefined })).toHaveLength(3);
    expect(matchesSubjectFilter('s1', undefined)).toBe(true);
    expect(matchesSubjectFilter(null, undefined)).toBe(true);
  });

  it('null = chỉ “Chưa phân loại”', () => {
    const result = filterDocumentsLocal(docs, { query: '', subjectFilter: null });
    expect(result).toHaveLength(1);
    expect(result[0]?.display_name).toBe('Vật lý đại cương');
  });

  it('id cụ thể = chỉ môn đó', () => {
    const result = filterDocumentsLocal(docs, { query: '', subjectFilter: 's1' });
    expect(result).toHaveLength(2);
  });

  it('kết hợp tìm kiếm + lọc môn', () => {
    const result = filterDocumentsLocal(docs, { query: 'giải tích 2', subjectFilter: 's1' });
    expect(result).toHaveLength(1);
    const empty = filterDocumentsLocal(docs, { query: 'vật lý', subjectFilter: 's1' });
    expect(empty).toHaveLength(0);
  });
});

describe('getFileTypeLabel (FR-09)', () => {
  it('map ext sang nhãn', () => {
    expect(getFileTypeLabel('pdf')).toBe('PDF');
    expect(getFileTypeLabel('docx')).toBe('DOCX');
    expect(getFileTypeLabel('txt')).toBe('TXT');
  });
});

describe('renameDocument (FR-10: chỉ đổi display_name)', () => {
  it('payload update CHỈ chứa display_name, không đụng storage_path', async () => {
    const single = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      data: { display_name: 'Tên mới', storage_path: 'uid/uuid.pdf' },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    mockFrom({ update });

    await renameDocument({ documentId: 'd1', rawName: '  Tên   mới ' });

    expect(update).toHaveBeenCalledWith({ display_name: 'Tên mới' });
    expect(update).not.toHaveBeenCalledWith(
      expect.objectContaining({ storage_path: expect.anything() }),
    );
    expect(eq).toHaveBeenCalled();
    expect(select).toHaveBeenCalled();
    expect(single).toHaveBeenCalled();
  });

  it('tên rỗng/quá dài bị chặn, tên cũ giữ nguyên (không gọi update)', async () => {
    const update = jest.fn(() => ({}));
    mockFrom({ update });

    await expect(
      renameDocument({ documentId: 'd1', rawName: '   ' }),
    ).rejects.toThrow();
    await expect(
      renameDocument({ documentId: 'd1', rawName: 'a'.repeat(121) }),
    ).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });
});

describe('deleteDocument (FR-11: storage trước, DB sau)', () => {
  it('thứ tự storage → DB, cả hai đều bị xóa', async () => {
    const order: string[] = [];
    mockStorageFrom({
      remove: jest.fn<() => Promise<unknown>>().mockImplementation(async () => {
        order.push('storage');
        return { error: null };
      }),
    });
    const eq = jest.fn<() => Promise<unknown>>().mockImplementation(async () => {
      order.push('db');
      return { error: null };
    });
    mockFrom({ delete: jest.fn(() => ({ eq })) });

    await deleteDocument({ documentId: 'd1', storagePath: 'uid/uuid.pdf' });

    expect(order).toEqual(['storage', 'db']);
  });

  it('storage lỗi → dừng, GIỮ bản ghi (không gọi delete DB)', async () => {
    mockStorageFrom({
      remove: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        error: new Error('storage failed'),
      }),
    });
    const deleteFn = jest.fn(() => ({}));
    mockFrom({ delete: deleteFn });

    await expect(
      deleteDocument({ documentId: 'd1', storagePath: 'uid/uuid.pdf' }),
    ).rejects.toThrow('storage failed');
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('storage xong mà DB fail → DocumentDeletePartialError, CẤM nuốt im lặng', async () => {
    mockStorageFrom({
      remove: jest.fn<() => Promise<unknown>>().mockResolvedValue({ error: null }),
    });
    const eq = jest.fn<() => Promise<unknown>>().mockResolvedValue({
      error: new Error('db failed'),
    });
    mockFrom({ delete: jest.fn(() => ({ eq })) });

    const caught = await deleteDocument({
      documentId: 'd1',
      storagePath: 'uid/uuid.pdf',
    }).catch((error: unknown) => error);

    expect(caught).toBeInstanceOf(DocumentDeletePartialError);
    expect((caught as Error).message).toContain('thử lại');
  });
});
