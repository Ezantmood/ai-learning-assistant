import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SUMMARY_MODEL } from '../models';
import {
  GeminiEmptyError,
  GeminiQuotaError,
  GeminiServerError,
  OCR_GENERATION_CONFIG,
  OCR_PROMPT,
  ocrWithGemini,
  parseOcrJson,
} from '../transport';

let oldKey: string | undefined;
let fetchMock: jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  oldKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-only-key';
  fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  if (oldKey === undefined) delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  else process.env.EXPO_PUBLIC_GEMINI_API_KEY = oldKey;
  jest.restoreAllMocks();
});

function mockResponse(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    json: async () => body,
    ok: status >= 200 && status < 300,
    status,
  } as Response);
}

describe('OCR parser', () => {
  it('đủ JSON → toàn văn', () => {
    expect(parseOcrJson('{"extracted_text":" Câu 1: 2 + 2? "}')).toEqual({
      extractedText: 'Câu 1: 2 + 2?', truncated: false,
    });
  });
  it('JSON bị cắt → cứu chuỗi dở và đánh dấu cắt', () => {
    expect(parseOcrJson('{"extracted_text":"Câu 1\\nĐáp án')).toEqual({
      extractedText: 'Câu 1\nĐáp án', truncated: true,
    });
  });
  it.each(['', '{"extracted_text":""}', '{"other":"x"}', '{"extracted_text":'])('rỗng %s → lỗi', (raw) => {
    expect(() => parseOcrJson(raw)).toThrow(GeminiEmptyError);
  });
});

describe('OCR transport', () => {
  it('một request: prompt trước ảnh JPEG, JSON schema, model chung', async () => {
    mockResponse(200, { candidates: [{ content: { parts: [{ text: '{"extracted_text":"Bài toán"}' }] } }] });
    await expect(ocrWithGemini('JPEGBASE64')).resolves.toEqual({ extractedText: 'Bài toán', truncated: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(`${SUMMARY_MODEL}:generateContent`);
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body.contents[0].parts).toEqual([
      { text: OCR_PROMPT },
      { inline_data: { mime_type: 'image/jpeg', data: 'JPEGBASE64' } },
    ]);
    expect(body.generationConfig).toEqual(OCR_GENERATION_CONFIG);
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'minimal' });
    expect(body.generationConfig.mediaResolution).toBe('MEDIA_RESOLUTION_MEDIUM');
    expect(JSON.stringify(body)).not.toMatch(/temperature|top_p|top_k|candidate_count|thinking_budget/);
  });
  it('429 và 5xx giữ mapping chung, không retry', async () => {
    mockResponse(429, {});
    await expect(ocrWithGemini('x')).rejects.toThrow(GeminiQuotaError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockReset();
    mockResponse(503, {});
    await expect(ocrWithGemini('x')).rejects.toThrow(GeminiServerError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
