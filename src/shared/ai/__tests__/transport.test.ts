import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SUMMARY_MODEL } from '../models';
import {
  AI_TIMEOUT_MS,
  GeminiTimeoutError,
  GeminiConfigError,
  GeminiNetworkError,
  GeminiQuotaError,
  GeminiServerError,
  SUMMARY_PROMPT,
  summarizeWithGemini,
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

function lastBody(): Record<string, unknown> {
  const init = fetchMock.mock.calls[0]?.[1];
  return JSON.parse((init?.body ?? '{}') as string) as Record<string, unknown>;
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

describe('SUMMARY_MODEL (hằng số duy nhất)', () => {
  it("ghim model stable đã smoke cho demo", () => {
    expect(SUMMARY_MODEL).toBe('gemini-3.5-flash-lite');
  });
});

describe('summarizeWithGemini — PDF thành công', () => {
  it('gửi base64 inline + prompt tiếng Việt, trả text đã trim', async () => {
    mockFetchJson(200, {
      candidates: [{ content: { parts: [{ text: '  Ý chính 1. Ý chính 2. ' }] } }],
    });

    const text = await summarizeWithGemini({
      base64Data: 'AAAABBBB',
      kind: 'pdf',
    });

    expect(text).toBe('Ý chính 1. Ý chính 2.');
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain(`${SUMMARY_MODEL}:generateContent`);
    const body = lastBody();
    const parts = (
      body.contents as { parts: Record<string, unknown>[] }[]
    )[0]?.parts;
    expect(parts).toHaveLength(2);
    expect(parts[0]).toEqual({
      inline_data: { data: 'AAAABBBB', mime_type: 'application/pdf' },
    });
    expect(parts[1]).toEqual({ text: SUMMARY_PROMPT });
  });

  it('CẤM temperature/top_p/top_k và CẤM lộ key trong body', async () => {
    mockFetchJson(200, {
      candidates: [{ content: { parts: [{ text: 'OK' }] } }],
    });

    await summarizeWithGemini({ base64Data: 'AAA', kind: 'pdf' });

    const raw = lastRawBody();
    expect(raw).not.toContain('temperature');
    expect(raw).not.toContain('top_p');
    expect(raw).not.toContain('top_k');
    expect(raw).not.toContain(FAKE_KEY);
  });
});

describe('summarizeWithGemini — TXT gửi text trực tiếp', () => {
  it('không base64, nội dung nằm trong part text', async () => {
    mockFetchJson(200, {
      candidates: [{ content: { parts: [{ text: 'Tóm tắt TXT.' }] } }],
    });

    const text = await summarizeWithGemini({
      kind: 'txt',
      textContent: 'Nội dung bài học hôm nay.',
    });

    expect(text).toBe('Tóm tắt TXT.');
    const raw = lastRawBody();
    expect(raw).toContain('Nội dung bài học hôm nay.');
    expect(raw).not.toContain('inline_data');
  });
});

describe('summarizeWithGemini — map lỗi', () => {
  it('thiếu key → GeminiConfigError, không gọi fetch', async () => {
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    await expect(
      summarizeWithGemini({ base64Data: 'AAA', kind: 'pdf' }),
    ).rejects.toBeInstanceOf(GeminiConfigError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('429 → GeminiQuotaError', async () => {
    mockFetchJson(429, { error: { message: 'quota' } });

    await expect(
      summarizeWithGemini({ base64Data: 'AAA', kind: 'pdf' }),
    ).rejects.toBeInstanceOf(GeminiQuotaError);
  });

  it('500 → GeminiServerError giữ status', async () => {
    mockFetchJson(500, {});

    const error = await summarizeWithGemini({
      base64Data: 'AAA',
      kind: 'pdf',
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GeminiServerError);
    expect((error as GeminiServerError).status).toBe(500);
  });

  it('fetch ném (mất mạng) → GeminiNetworkError', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'));

    await expect(
      summarizeWithGemini({ base64Data: 'AAA', kind: 'pdf' }),
    ).rejects.toBeInstanceOf(GeminiNetworkError);
  });

  it('Gemini trả rỗng → lỗi rõ, không trả chuỗi rỗng', async () => {
    mockFetchJson(200, { candidates: [] });

    await expect(
      summarizeWithGemini({ base64Data: 'AAA', kind: 'pdf' }),
    ).rejects.toThrow('không trả về nội dung tóm tắt');
  });
});

it('key ở header, thinking minimal, không đưa key lên URL', async () => {
  mockFetchJson(200, { candidates: [{ content: { parts: [{ text: 'Tóm tắt' }] } }] });
  await summarizeWithGemini({ kind: 'txt', textContent: 'Nội dung' });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).not.toContain(FAKE_KEY);
  expect(init?.headers).toMatchObject({ 'x-goog-api-key': FAKE_KEY });
  expect(lastBody()).toMatchObject({ generationConfig: { thinkingConfig: { thinkingLevel: 'minimal' } } });
});


it('timeout ngắt fetch và trả lỗi tiếng Việt, không tự retry', async () => {
  jest.useFakeTimers();
  try {
    fetchMock.mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const pending = summarizeWithGemini({ kind: 'txt', textContent: 'Bài học' });
    const assertion = expect(pending).rejects.toBeInstanceOf(GeminiTimeoutError);
    await jest.advanceTimersByTimeAsync(AI_TIMEOUT_MS);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally { jest.useRealTimers(); }
});

const quotaDetail = (id: string, value = '20') => ({
  '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
  violations: [{ quotaId: id, quotaValue: value }],
});
const retryDetail = (delay: string) => ({ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: delay });

it('quota ngày khác quota phút; báo RetryInfo và không lộ message thô', async () => {
  for (const [id, type] of [['GenerateRequestsPerDayPerProjectPerModel-FreeTier', 'daily'], ['GenerateRequestsPerMinutePerProjectPerModel-FreeTier', 'rate']]) {
    fetchMock.mockClear();
    mockFetchJson(429, { error: { message: `unsafe ${FAKE_KEY}`, details: [quotaDetail(id), retryDetail('47578.2s')] } });
    const error: unknown = await summarizeWithGemini({ kind: 'txt', textContent: 'Bài học' }).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(GeminiQuotaError);
    expect(error).toMatchObject({ limitType: type, retryAfterSeconds: 47579 });
    expect((error as Error).message).toContain('13 giờ 13 phút');
    expect((error as Error).message).not.toContain(FAKE_KEY);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }
});

it('quota bằng 0 không dẫn người dùng chờ reset ngày; metadata lạ vẫn là lỗi quota', async () => {
  mockFetchJson(429, { error: { details: [quotaDetail('RequestsPerDay', '0'), retryDetail('60s')] } });
  await expect(summarizeWithGemini({ kind: 'txt', textContent: 'Bài' })).rejects.toMatchObject({ limitType: 'unavailable' });
  for (const details of [null, [null, 'bad', {}], [retryDetail('NaNs')], [retryDetail('999999999999999999999s')]]) {
    mockFetchJson(429, { error: { details } });
    await expect(summarizeWithGemini({ kind: 'txt', textContent: 'Bài' })).rejects.toMatchObject({ limitType: 'unknown', retryAfterSeconds: undefined });
  }
});

it('429 body không phải JSON vẫn trả lỗi quota, không đổi thành lỗi mạng', async () => {
  fetchMock.mockResolvedValue({ status: 429, ok: false, json: async () => { throw new SyntaxError('bad JSON'); } } as unknown as Response);
  await expect(summarizeWithGemini({ kind: 'txt', textContent: 'Bài' })).rejects.toBeInstanceOf(GeminiQuotaError);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});


it('402 báo cần kiểm số dư API, không hướng người dùng thử lại liên tục', async () => {
  mockFetchJson(402, {});
  await expect(summarizeWithGemini({ kind: 'txt', textContent: 'Bài' })).rejects.toThrow('Số dư thanh toán Gemini API');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
