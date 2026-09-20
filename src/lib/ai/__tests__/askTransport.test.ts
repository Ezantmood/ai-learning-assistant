import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SUMMARY_MODEL } from '../models';
import {
  GeminiNetworkError,
  GeminiQuotaError,
  GeminiServerError,
  QA_PROMPT_HEADER,
  answerWithGemini,
} from '../transport';

const FAKE_KEY = 'test-gemini-key';
let savedKey: string | undefined;
let fetchMock: jest.MockedFunction<typeof fetch>;

function mockFetchJson(status: number, json: unknown) {
  fetchMock.mockResolvedValue({
    json: async () => json,
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response);
}

function lastRawBody(): string {
  const init = fetchMock.mock.calls[0]?.[1];
  return (init?.body ?? '') as string;
}

beforeEach(() => {
  savedKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  process.env.EXPO_PUBLIC_GEMINI_API_KEY = FAKE_KEY;
  fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  if (savedKey === undefined) {
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  } else {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = savedKey;
  }
  jest.restoreAllMocks();
});

describe('answerWithGemini — hỏi đáp thành công', () => {
  it('nhồi extracted_text + câu hỏi vào prompt, trả câu trả lời đã trim', async () => {
    mockFetchJson(200, {
      candidates: [{ content: { parts: [{ text: '  Đáp án: chương 1. ' }] } }],
    });

    const answer = await answerWithGemini({
      contextText: 'Nội dung chương 1 của tài liệu.',
      question: 'Chương 1 nói về gì?',
    });

    expect(answer).toBe('Đáp án: chương 1.');
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain(`${SUMMARY_MODEL}:generateContent`);
    const raw = lastRawBody();
    expect(raw).toContain(QA_PROMPT_HEADER);
    expect(raw).toContain('Nội dung chương 1 của tài liệu.');
    expect(raw).toContain('Chương 1 nói về gì?');
  });

  it('CẤM temperature/top_p/top_k và CẤM lộ key trong body', async () => {
    mockFetchJson(200, {
      candidates: [{ content: { parts: [{ text: 'OK' }] } }],
    });

    await answerWithGemini({ contextText: 'ctx', question: 'q?' });

    const raw = lastRawBody();
    expect(raw).not.toContain('temperature');
    expect(raw).not.toContain('top_p');
    expect(raw).not.toContain('top_k');
    expect(raw).not.toContain(FAKE_KEY);
  });
});

describe('answerWithGemini — map lỗi', () => {
  it('429 → GeminiQuotaError', async () => {
    mockFetchJson(429, { error: { message: 'quota' } });

    await expect(
      answerWithGemini({ contextText: 'ctx', question: 'q?' }),
    ).rejects.toBeInstanceOf(GeminiQuotaError);
  });

  it('500 → GeminiServerError giữ status', async () => {
    mockFetchJson(500, {});

    const error = await answerWithGemini({
      contextText: 'ctx',
      question: 'q?',
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GeminiServerError);
    expect((error as GeminiServerError).status).toBe(500);
  });

  it('fetch ném (mất mạng) → GeminiNetworkError', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'));

    await expect(
      answerWithGemini({ contextText: 'ctx', question: 'q?' }),
    ).rejects.toBeInstanceOf(GeminiNetworkError);
  });

  it('Gemini trả rỗng → lỗi câu trả lời rõ, không trả chuỗi rỗng', async () => {
    mockFetchJson(200, { candidates: [] });

    await expect(
      answerWithGemini({ contextText: 'ctx', question: 'q?' }),
    ).rejects.toThrow('không trả về câu trả lời');
  });
});
