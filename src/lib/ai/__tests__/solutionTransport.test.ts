import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SUMMARY_MODEL } from '../models';
import { GeminiEmptyError, GeminiQuotaError, GeminiServerError,
  parseSolutionJson, SOLUTION_GENERATION_CONFIG, SOLUTION_PROMPT, solveWithGemini } from '../transport';

let fetchMock: jest.MockedFunction<typeof fetch>;
const oldKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
beforeEach(() => {
  process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-key';
  fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  globalThis.fetch = fetchMock;
});
afterEach(() => {
  if (oldKey === undefined) delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  else process.env.EXPO_PUBLIC_GEMINI_API_KEY = oldKey;
  jest.restoreAllMocks();
});
function response(status: number, body: unknown) {
  fetchMock.mockResolvedValue({ ok: status < 400, status, json: async () => body } as Response);
}

describe('CN6 Gemini', () => {
  it('parse đủ, chuỗi dở và rỗng', () => {
    expect(parseSolutionJson('{"solution_text":" Bước 1 "}')).toEqual({ solutionText: 'Bước 1', truncated: false });
    expect(parseSolutionJson('{"solution_text":"Bước 1\\nBước 2')).toEqual({ solutionText: 'Bước 1\nBước 2', truncated: true });
    for (const raw of ['', '{"solution_text":""}', '{"solution_text":']) {
      expect(() => parseSolutionJson(raw)).toThrow(GeminiEmptyError);
    }
  });
  it('một request qua model chung, schema JSON; không tham số cấm', async () => {
    response(200, { candidates: [{ content: { parts: [{ text: '{"solution_text":"Bước 1"}' }] } }] });
    await expect(solveWithGemini({ contextText: '  Đề bài  ' })).resolves.toEqual({ solutionText: 'Bước 1', truncated: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(`${SUMMARY_MODEL}:generateContent`);
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body.contents[0].parts).toEqual([{ text: `${SOLUTION_PROMPT}\n\n--- ĐỀ BÀI ---\n  Đề bài  ` }]);
    expect(body.generationConfig).toEqual(SOLUTION_GENERATION_CONFIG);
    expect(JSON.stringify(body)).not.toMatch(/temperature|top_p|top_k|candidate_count|thinking_budget/);
  });
  it('parts=null và 429/5xx báo lỗi, không retry', async () => {
    response(200, { candidates: [{ content: { parts: null } }] });
    await expect(solveWithGemini({ contextText: 'đề' })).rejects.toThrow(GeminiEmptyError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockReset(); response(429, {});
    await expect(solveWithGemini({ contextText: 'đề' })).rejects.toThrow(GeminiQuotaError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockReset(); response(503, {});
    await expect(solveWithGemini({ contextText: 'đề' })).rejects.toThrow(GeminiServerError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
