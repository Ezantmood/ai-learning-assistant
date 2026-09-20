import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SUMMARY_MODEL } from '../../../lib/ai/models';
import {
  GeminiQuotaError,
  summarizeWithGemini,
} from '../../../lib/ai/transport';
import { supabase } from '../../../shared/lib/supabase';
import {
  getSummary,
  isStaleProcessing,
  reclaimStaleProcessing,
  requestSummary,
  retrySummary,
  type SummaryDocument,
} from '../api';
import { SummaryGuardError, toSummaryErrorMessage } from '../errors';
import { documentDetailKey, summaryKey } from '../queries';
import { summarySourceSchema, summaryTextSchema } from '../schemas';

jest.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../../lib/ai/transport', () => {
  const actual = jest.requireActual('../../../lib/ai/transport') as Record<
    string,
    unknown
  >;
  return { ...actual, summarizeWithGemini: jest.fn() };
});

const transportMock = jest.mocked(summarizeWithGemini);

function mockFrom(impl: (table: string) => unknown) {
  const fromMock = supabase.from as unknown as jest.Mock;
  (
    fromMock as unknown as {
      mockImplementation: (fn: (table: string) => unknown) => unknown;
    }
  ).mockImplementation(impl);
  return fromMock;
}

function makeDoc(overrides?: Partial<SummaryDocument>): SummaryDocument {
  return {
    extraction_status: 'pending',
    file_ext: 'pdf',
    file_size: 1024,
    id: 'doc-1',
    updated_at: new Date().toISOString(),
    user_id: 'user-1',
    ...overrides,
  };
}

const SUMMARY_ROW = {
  created_at: new Date().toISOString(),
  document_id: 'doc-1',
  id: 'sum-1',
  model: SUMMARY_MODEL,
  summary_text: 'Bản tóm tắt tiếng Việt.',
  updated_at: new Date().toISOString(),
  user_id: 'user-1',
};

function updateOk(calls: Record<string, unknown>[]) {
  return {
    update: jest.fn((payload: Record<string, unknown>) => {
      calls.push(payload);
      return { eq: jest.fn(async () => ({ data: null, error: null })) };
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requestSummary — PDF thành công', () => {
  it("processing → upsert (model gemini-3.5-flash) → done, đúng một request Gemini", async () => {
    const updates: Record<string, unknown>[] = [];
    let upsertPayload: Record<string, unknown> = {};
    mockFrom((table) => {
      if (table === 'document_summaries') {
        return {
          upsert: jest.fn((payload: Record<string, unknown>) => {
            upsertPayload = payload;
            return {
              select: () => ({
                single: async () => ({ data: SUMMARY_ROW, error: null }),
              }),
            };
          }),
        };
      }
      return updateOk(updates);
    });
    transportMock.mockResolvedValue('Bản tóm tắt tiếng Việt.');

    const result = await requestSummary({
      document: makeDoc(),
      source: { base64Data: 'AAAABBBB', kind: 'pdf' },
      userId: 'user-1',
    });

    expect(result).toEqual(SUMMARY_ROW);
    expect(transportMock).toHaveBeenCalledTimes(1);
    expect(transportMock).toHaveBeenCalledWith({
      base64Data: 'AAAABBBB',
      kind: 'pdf',
    });
    expect(updates).toEqual([
      { extraction_status: 'processing' },
      { extraction_status: 'done' },
    ]);
    expect(upsertPayload).toMatchObject({
      document_id: 'doc-1',
      model: 'gemini-3.5-flash',
      summary_text: 'Bản tóm tắt tiếng Việt.',
      user_id: 'user-1',
    });
  });
});

describe('requestSummary — DOCX không gọi AI', () => {
  it("gắn 'unsupported' và ném guard, fetch Gemini không chạy", async () => {
    const updates: Record<string, unknown>[] = [];
    mockFrom(() => updateOk(updates));

    await expect(
      requestSummary({
        document: makeDoc({ extraction_status: 'pending', file_ext: 'docx' }),
        source: { base64Data: 'AAA', kind: 'pdf' },
        userId: 'user-1',
      }),
    ).rejects.toThrow('DOCX');
    expect(transportMock).not.toHaveBeenCalled();
    expect(updates).toEqual([{ extraction_status: 'unsupported' }]);
  });
});

describe('requestSummary — document của người khác thì từ chối', () => {
  it('không chạm DB, không gọi Gemini', async () => {
    const fromMock = mockFrom(() => {
      throw new Error('không được gọi supabase');
    });

    await expect(
      requestSummary({
        document: makeDoc(),
        source: { base64Data: 'AAA', kind: 'pdf' },
        userId: 'user-2',
      }),
    ).rejects.toThrow('không có quyền');
    expect(fromMock).not.toHaveBeenCalled();
    expect(transportMock).not.toHaveBeenCalled();
  });
});

describe('requestSummary — Gemini lỗi thì status về failed', () => {
  it('429 → failed + lỗi quota tiếng Việt, không nuốt lỗi', async () => {
    const updates: Record<string, unknown>[] = [];
    mockFrom(() => updateOk(updates));
    transportMock.mockRejectedValue(new GeminiQuotaError());

    const error = await requestSummary({
      document: makeDoc(),
      source: { base64Data: 'AAA', kind: 'pdf' },
      userId: 'user-1',
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GeminiQuotaError);
    expect(updates).toEqual([
      { extraction_status: 'processing' },
      { extraction_status: 'failed' },
    ]);
    expect(toSummaryErrorMessage(error)).toContain('1.500');
  });
});

describe('requestSummary — chặn gọi lặp và thu hồi treo', () => {
  it("đang 'processing' còn hạn → chặn, không gọi Gemini", async () => {
    const fromMock = mockFrom(() => {
      throw new Error('không được gọi supabase');
    });

    await expect(
      requestSummary({
        document: makeDoc({ extraction_status: 'processing' }),
        source: { base64Data: 'AAA', kind: 'pdf' },
        userId: 'user-1',
      }),
    ).rejects.toThrow('đang được tóm tắt');
    expect(fromMock).not.toHaveBeenCalled();
    expect(transportMock).not.toHaveBeenCalled();
  });

  it("'processing' treo quá 15 phút → thu hồi rồi chạy tiếp", async () => {
    const updates: Record<string, unknown>[] = [];
    mockFrom((table) => {
      if (table === 'document_summaries') {
        return {
          upsert: jest.fn(() => ({
            select: () => ({
              single: async () => ({ data: SUMMARY_ROW, error: null }),
            }),
          })),
        };
      }
      return updateOk(updates);
    });
    transportMock.mockResolvedValue('Bản tóm tắt tiếng Việt.');
    const stale = new Date(Date.now() - 16 * 60 * 1000).toISOString();

    await requestSummary({
      document: makeDoc({ extraction_status: 'processing', updated_at: stale }),
      source: { base64Data: 'AAA', kind: 'pdf' },
      userId: 'user-1',
    });

    expect(updates[0]).toEqual({ extraction_status: 'failed' });
    expect(updates).toContainEqual({ extraction_status: 'processing' });
    expect(updates[updates.length - 1]).toEqual({ extraction_status: 'done' });
  });
});

describe('requestSummary — TXT lưu extracted_text cho CN4', () => {
  it("update cuối kèm extracted_text + 'done'", async () => {
    const updates: Record<string, unknown>[] = [];
    mockFrom((table) => {
      if (table === 'document_summaries') {
        return {
          upsert: jest.fn(() => ({
            select: () => ({
              single: async () => ({ data: SUMMARY_ROW, error: null }),
            }),
          })),
        };
      }
      return updateOk(updates);
    });
    transportMock.mockResolvedValue('Tóm tắt TXT.');

    await requestSummary({
      document: makeDoc({ file_ext: 'txt' }),
      source: { kind: 'txt', textContent: 'Nội dung gốc.' },
      userId: 'user-1',
    });

    expect(updates[updates.length - 1]).toEqual({
      extracted_text: 'Nội dung gốc.',
      extraction_status: 'done',
    });
  });
});

describe('requestSummary — bản quá 20.000 ký tự', () => {
  it('báo rõ, về failed, không cắt im lặng', async () => {
    const updates: Record<string, unknown>[] = [];
    mockFrom(() => updateOk(updates));
    transportMock.mockResolvedValue('x'.repeat(20001));

    await expect(
      requestSummary({
        document: makeDoc(),
        source: { base64Data: 'AAA', kind: 'pdf' },
        userId: 'user-1',
      }),
    ).rejects.toThrow('20.000');
    expect(updates).toContainEqual({ extraction_status: 'failed' });
  });
});

describe('retrySummary', () => {
  it("chỉ chạy khi 'failed'", async () => {
    await expect(
      retrySummary({
        document: makeDoc({ extraction_status: 'done' }),
        source: { base64Data: 'AAA', kind: 'pdf' },
        userId: 'user-1',
      }),
    ).rejects.toThrow('Chỉ thử lại');
    expect(transportMock).not.toHaveBeenCalled();
  });
});

describe('getSummary', () => {
  it('trả row khi có, null khi chưa tóm tắt', async () => {
    mockFrom(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: SUMMARY_ROW, error: null }),
          }),
        }),
      }),
    }));

    await expect(
      getSummary({ documentId: 'doc-1', userId: 'user-1' }),
    ).resolves.toEqual(SUMMARY_ROW);
  });
});

describe('isStaleProcessing / reclaimStaleProcessing', () => {
  it('chỉ true khi processing và updated_at quá 15 phút', () => {
    expect(isStaleProcessing(makeDoc())).toBe(false);
    expect(
      isStaleProcessing(makeDoc({ extraction_status: 'processing' })),
    ).toBe(false);
    expect(
      isStaleProcessing(
        makeDoc({
          extraction_status: 'processing',
          updated_at: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
        }),
      ),
    ).toBe(true);
  });

  it('không treo → không update, trả false', async () => {
    const fromMock = mockFrom(() => {
      throw new Error('không được gọi supabase');
    });

    await expect(reclaimStaleProcessing(makeDoc())).resolves.toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe('schemas', () => {
  it('summaryTextSchema: rỗng và quá dài bị từ chối', () => {
    expect(summaryTextSchema.safeParse('   ').success).toBe(false);
    expect(summaryTextSchema.safeParse('x'.repeat(20001)).success).toBe(false);
    expect(summaryTextSchema.safeParse('  Tóm tắt.  ').data).toBe('Tóm tắt.');
  });

  it('summarySourceSchema: nguồn rỗng bị từ chối', () => {
    expect(
      summarySourceSchema.safeParse({ base64Data: '', kind: 'pdf' }).success,
    ).toBe(false);
    expect(
      summarySourceSchema.safeParse({ kind: 'txt', textContent: '' }).success,
    ).toBe(false);
  });
});

describe('toSummaryErrorMessage', () => {
  it('guard giữ nguyên câu tiếng Việt, lỗi lạ có câu chung', () => {
    expect(
      toSummaryErrorMessage(new SummaryGuardError('Câu guard.')),
    ).toBe('Câu guard.');
    expect(toSummaryErrorMessage(new Error('boom'))).toBe(
      'Không tạo được bản tóm tắt. Hãy thử lại.',
    );
    expect(toSummaryErrorMessage(new GeminiQuotaError())).toContain('1.500');
  });
});

describe('query keys', () => {
  it("summaryKey và documentDetailKey đúng hình dạng để invalidate", () => {
    expect(summaryKey('doc-1')).toEqual(['summary', 'doc-1']);
    expect(documentDetailKey('doc-1')).toEqual(['document', 'doc-1']);
  });
});
