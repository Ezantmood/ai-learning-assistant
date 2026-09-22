import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { GeminiEmptyError, ocrWithGemini } from '../../../lib/ai/transport';
import { supabase } from '../../../shared/lib/supabase';
import { runScan } from '../api';
import { ScanTruncatedError } from '../errors';
import type { ScanImage } from '../schemas';

jest.mock('../../../shared/lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn(), storage: { from: jest.fn() } },
}));
jest.mock('../../../lib/ai/transport', () => {
  const actual = jest.requireActual('../../../lib/ai/transport') as Record<string, unknown>;
  return { ...actual, ocrWithGemini: jest.fn() };
});
jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid-1' }));

const image: ScanImage = {
  base64: '/9j/AA==', fileExt: 'jpg', mimeType: 'image/jpeg',
  sizeBytes: 4, uri: 'file:///de-bai.jpg',
};
const document = {
  id: 'doc-1', user_id: 'user-1', extracted_text: null,
  extraction_status: 'pending',
};
const ocrMock = jest.mocked(ocrWithGemini);

function setupDb() {
  const updates: Record<string, unknown>[] = [];
  const upload = jest.fn(async () => ({ error: null }));
  const remove = jest.fn(async () => ({ error: null }));
  (supabase.storage.from as jest.Mock).mockReturnValue({ upload, remove });
  (supabase.auth.getUser as jest.Mock).mockReturnValue(Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }));
  (supabase.from as jest.Mock).mockReturnValue({
    insert: jest.fn(() => ({ select: () => ({ single: async () => ({ data: document, error: null }) }) })),
    update: jest.fn((payload: Record<string, unknown>) => {
      updates.push(payload);
      const chain = {
        eq: () => chain,
        select: () => ({ single: async () => ({ data: { ...document, ...payload }, error: null }) }),
        then: (resolve: (value: unknown) => void) => resolve({ error: null }),
      };
      return chain;
    }),
  });
  return { updates, upload, remove };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('runScan', () => {
  it('upload JPEG → row mới → processing → OCR → done gộp text', async () => {
    const { updates, upload } = setupDb();
    ocrMock.mockResolvedValue({ extractedText: 'Câu 1', truncated: false });
    const result = await runScan({ image, userId: 'user-1' });
    expect(result.extractedText).toBe('Câu 1');
    expect(upload).toHaveBeenCalledWith('user-1/uuid-1.jpg', expect.any(ArrayBuffer), {
      contentType: 'image/jpeg', upsert: false,
    });
    expect(ocrMock).toHaveBeenCalledTimes(1);
    expect(updates).toEqual([
      { extraction_status: 'processing' },
      { extracted_text: 'Câu 1', extraction_status: 'done' },
    ]);
  });

  it('OCR rỗng → failed, không ghi đè extracted_text bằng rỗng', async () => {
    const { updates } = setupDb();
    ocrMock.mockRejectedValue(new GeminiEmptyError());
    await expect(runScan({ image, userId: 'user-1' })).rejects.toThrow(GeminiEmptyError);
    expect(updates).toEqual([
      { extraction_status: 'processing' },
      { extraction_status: 'failed' },
    ]);
  });

  it('OCR cắt cụt → cứu text, lưu done và báo lỗi cắt', async () => {
    const { updates } = setupDb();
    ocrMock.mockResolvedValue({ extractedText: 'Câu 1 dở', truncated: true });
    await expect(runScan({ image, userId: 'user-1' })).rejects.toThrow(ScanTruncatedError);
    expect(updates).toEqual([
      { extraction_status: 'processing' },
      { extracted_text: 'Câu 1 dở', extraction_status: 'done' },
    ]);
  });

  it('ảnh không hợp lệ bị chặn trước Storage và Gemini', async () => {
    setupDb();
    await expect(runScan({ image: { ...image, sizeBytes: 0 }, userId: 'user-1' })).rejects.toThrow('Ảnh quét không hợp lệ');
    expect(supabase.storage.from).not.toHaveBeenCalled();
    expect(ocrMock).not.toHaveBeenCalled();
  });

  it('chặn user khác trước Storage, DB và Gemini', async () => {
    setupDb();
    await expect(runScan({ image, userId: 'user-2' })).rejects.toThrow('không có quyền');
    expect(supabase.storage.from).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
    expect(ocrMock).not.toHaveBeenCalled();
  });
});
