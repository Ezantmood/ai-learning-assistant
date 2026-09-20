import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SUMMARY_MODEL } from '../../../lib/ai/models';
import {
  GeminiQuotaError,
  answerWithGemini,
} from '../../../lib/ai/transport';
import { supabase } from '../../../shared/lib/supabase';
import {
  askQuestion,
  listQuestions,
  type ChatDocument,
} from '../api';
import {
  ChatGuardError,
  isChatQuotaError,
  toChatErrorMessage,
} from '../errors';
import { questionsKey } from '../queries';
import { answerSchema, questionSchema } from '../schemas';

jest.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

jest.mock('../../../lib/ai/transport', () => {
  const actual = jest.requireActual('../../../lib/ai/transport') as Record<
    string,
    unknown
  >;
  return { ...actual, answerWithGemini: jest.fn() };
});

const answerMock = jest.mocked(answerWithGemini);

function mockFrom(impl: (table: string) => unknown) {
  const fromMock = supabase.from as unknown as jest.Mock;
  (
    fromMock as unknown as {
      mockImplementation: (fn: (table: string) => unknown) => unknown;
    }
  ).mockImplementation(impl);
  return fromMock;
}

function makeDoc(overrides?: Partial<ChatDocument>): ChatDocument {
  return {
    extracted_text: 'Nội dung trích xuất của tài liệu.',
    extraction_status: 'done',
    file_ext: 'txt',
    id: 'doc-1',
    user_id: 'user-1',
    ...overrides,
  };
}

const QUESTION_ROW = {
  answer: 'Đáp án: chương 1.',
  created_at: new Date().toISOString(),
  document_id: 'doc-1',
  id: 'q-1',
  model: SUMMARY_MODEL,
  question: 'Chương 1 nói về gì?',
  updated_at: new Date().toISOString(),
  user_id: 'user-1',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('askQuestion — hỏi thành công', () => {
  it('gọi Gemini đúng một lần rồi insert lịch sử (model gemini-3.5-flash)', async () => {
    let insertPayload: Record<string, unknown> = {};
    const fromMock = mockFrom(() => ({
      insert: jest.fn((payload: Record<string, unknown>) => {
        insertPayload = payload;
        return {
          select: () => ({
            single: async () => ({ data: QUESTION_ROW, error: null }),
          }),
        };
      }),
    }));
    answerMock.mockResolvedValue('Đáp án: chương 1.');

    const result = await askQuestion({
      document: makeDoc(),
      question: '  Chương 1 nói về gì?  ',
      userId: 'user-1',
    });

    expect(result).toEqual(QUESTION_ROW);
    expect(answerMock).toHaveBeenCalledTimes(1);
    expect(answerMock).toHaveBeenCalledWith({
      contextText: 'Nội dung trích xuất của tài liệu.',
      question: 'Chương 1 nói về gì?',
    });
    expect(insertPayload).toMatchObject({
      answer: 'Đáp án: chương 1.',
      document_id: 'doc-1',
      model: 'gemini-3.5-flash',
      question: 'Chương 1 nói về gì?',
      user_id: 'user-1',
    });
    expect(fromMock).toHaveBeenCalledWith('document_questions');
  });
});

describe('askQuestion — chặn hỏi (lệnh session)', () => {
  it('chưa có extracted_text → chặn, bảo tóm tắt trước, KHÔNG gọi Gemini', async () => {
    const fromMock = mockFrom(() => {
      throw new Error('không được chạm DB');
    });
    answerMock.mockResolvedValue('không bao giờ tới');

    await expect(
      askQuestion({
        document: makeDoc({ extracted_text: null }),
        question: 'Hỏi gì đó?',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Tóm tắt bằng AI');
    expect(answerMock).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('extracted_text toàn khoảng trắng cũng bị chặn', async () => {
    answerMock.mockResolvedValue('không bao giờ tới');

    await expect(
      askQuestion({
        document: makeDoc({ extracted_text: '   ' }),
        question: 'Hỏi gì đó?',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Tóm tắt bằng AI');
    expect(answerMock).not.toHaveBeenCalled();
  });

  it('DOCX bị chặn, KHÔNG gọi Gemini', async () => {
    answerMock.mockResolvedValue('không bao giờ tới');

    await expect(
      askQuestion({
        document: makeDoc({
          extracted_text: 'giả sử có',
          extraction_status: 'unsupported',
          file_ext: 'docx',
        }),
        question: 'Hỏi gì đó?',
        userId: 'user-1',
      }),
    ).rejects.toThrow('DOCX');
    expect(answerMock).not.toHaveBeenCalled();
  });

  it('document của người khác → từ chối, chưa chạm DB/Gemini', async () => {
    const fromMock = mockFrom(() => {
      throw new Error('không được chạm DB');
    });
    answerMock.mockResolvedValue('không bao giờ tới');

    await expect(
      askQuestion({
        document: makeDoc(),
        question: 'Hỏi gì đó?',
        userId: 'user-2',
      }),
    ).rejects.toThrow('quyền');
    expect(answerMock).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('câu hỏi rỗng/quá 500 ký tự → từ chối trước khi gọi Gemini', async () => {
    answerMock.mockResolvedValue('không bao giờ tới');

    await expect(
      askQuestion({ document: makeDoc(), question: '   ', userId: 'user-1' }),
    ).rejects.toThrow('nhập câu hỏi');
    await expect(
      askQuestion({
        document: makeDoc(),
        question: 'a'.repeat(501),
        userId: 'user-1',
      }),
    ).rejects.toThrow('500');
    expect(answerMock).not.toHaveBeenCalled();
  });
});

describe('askQuestion — Gemini lỗi', () => {
  it('429/quota → ném lên câu hạn mức, KHÔNG insert lịch sử', async () => {
    const insertMock = jest.fn();
    const fromMock = mockFrom(() => ({ insert: insertMock }));
    answerMock.mockRejectedValue(new GeminiQuotaError());

    await expect(
      askQuestion({
        document: makeDoc(),
        question: 'Hỏi gì đó?',
        userId: 'user-1',
      }),
    ).rejects.toThrow('giới hạn miễn phí');
    expect(insertMock).not.toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledTimes(0);
  });

  it('câu trả lời vượt 20.000 ký tự → báo rõ, không cắt im lặng, không insert', async () => {
    const insertMock = jest.fn();
    mockFrom(() => ({ insert: insertMock }));
    answerMock.mockResolvedValue(`x${'a'.repeat(20000)}`);

    await expect(
      askQuestion({
        document: makeDoc(),
        question: 'Hỏi gì đó?',
        userId: 'user-1',
      }),
    ).rejects.toThrow('20.000');
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('listQuestions — lịch sử mới nhất trước', () => {
  it('lọc đúng document + user, sắp created_at desc', async () => {
    const calls: Record<string, unknown>[] = [];
    mockFrom(() => ({
      select: jest.fn(() => ({
        eq: jest.fn((column: string, value: string) => {
          calls.push({ column, value });
          return {
            eq: jest.fn((column2: string, value2: string) => {
              calls.push({ column: column2, value: value2 });
              return {
                order: jest.fn(
                  async (column3: string, options: { ascending: boolean }) => {
                    calls.push({ column: column3, options });
                    return { data: [QUESTION_ROW], error: null };
                  },
                ),
              };
            }),
          };
        }),
      })),
    }));

    const rows = await listQuestions({ documentId: 'doc-1', userId: 'user-1' });

    expect(rows).toEqual([QUESTION_ROW]);
    expect(calls).toEqual([
      { column: 'document_id', value: 'doc-1' },
      { column: 'user_id', value: 'user-1' },
      { column: 'created_at', options: { ascending: false } },
    ]);
  });

  it('lỗi DB ném lên để UI báo + thử lại', async () => {
    mockFrom(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: async () => ({
              data: null,
              error: new Error('db down'),
            }),
          }),
        }),
      }),
    }));

    await expect(
      listQuestions({ documentId: 'doc-1', userId: 'user-1' }),
    ).rejects.toThrow('db down');
  });
});

describe('chat schemas/errors/keys', () => {
  it('questionSchema trim + chặn rỗng/quá 500', () => {
    expect(questionSchema.parse('  Hỏi gì?  ')).toBe('Hỏi gì?');
    expect(questionSchema.safeParse('   ').success).toBe(false);
    expect(questionSchema.safeParse('a'.repeat(501)).success).toBe(false);
    expect(questionSchema.safeParse('a'.repeat(500)).success).toBe(true);
  });

  it('answerSchema chặn rỗng/vượt 20.000', () => {
    expect(answerSchema.safeParse('').success).toBe(false);
    expect(answerSchema.safeParse('a'.repeat(20001)).success).toBe(false);
  });

  it('toChatErrorMessage: guard trực tiếp, quota hạn mức, mạng offline', () => {
    expect(
      toChatErrorMessage(new ChatGuardError('Câu guard.')),
    ).toBe('Câu guard.');
    expect(toChatErrorMessage(new GeminiQuotaError())).toContain(
      'giới hạn miễn phí',
    );
    expect(
      toChatErrorMessage(new Error('Network request failed')),
    ).toContain('kết nối mạng');
    expect(toChatErrorMessage(new Error('lạ'))).toContain('thử lại');
  });

  it('isChatQuotaError chỉ đúng với GeminiQuotaError', () => {
    expect(isChatQuotaError(new GeminiQuotaError())).toBe(true);
    expect(isChatQuotaError(new ChatGuardError('x'))).toBe(false);
  });

  it("questionsKey là ['questions', documentId]", () => {
    expect(questionsKey('doc-1')).toEqual(['questions', 'doc-1']);
  });
});
