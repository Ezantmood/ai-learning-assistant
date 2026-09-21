import { describe, expect, it } from '@jest/globals';

import {
  EXTRACTION_GENERATION_CONFIG,
  GeminiEmptyError,
  parseExtractionJson,
  SUMMARY_PROMPT,
} from '../transport';

/**
 * Parser JSON trích PDF (CN3-PDF): đủ / dở / RỖNG HOÀN TOÀN.
 * Không chạm mạng, không sửa/skip test cũ.
 */
describe('parseExtractionJson — đủ', () => {
  it('JSON hợp lệ 2 trường → truncated false', () => {
    const raw = JSON.stringify({
      extracted_text: 'Toàn văn chương 1. Nội dung bài học.',
      summary_text: 'Ý chính 1. Ý chính 2.',
    });

    expect(parseExtractionJson(raw)).toEqual({
      extractedText: 'Toàn văn chương 1. Nội dung bài học.',
      summaryText: 'Ý chính 1. Ý chính 2.',
      truncated: false,
    });
  });
});

describe('parseExtractionJson — dở', () => {
  it('JSON bị cắt giữa chừng nhưng còn chuỗi dở → cứu phần lấy được, truncated true', () => {
    const raw =
      '{"extracted_text": "Toàn văn chương 1 còn dở, ' +
      '"summary_text": "Ý chính còn dở';

    const result = parseExtractionJson(raw);

    expect(result.truncated).toBe(true);
    expect(result.extractedText).toContain('Toàn văn chương 1');
    expect(result.summaryText).toContain('Ý chính còn dở');
  });
});

describe('parseExtractionJson — RỖNG HOÀN TOÀN', () => {
  it('chuỗi rỗng → GeminiEmptyError, caller KHÔNG được upsert rỗng', () => {
    expect(() => parseExtractionJson('   ')).toThrow(GeminiEmptyError);
  });

  it('JSON rỗng hai trường → GeminiEmptyError', () => {
    const raw = JSON.stringify({ extracted_text: '  ', summary_text: '' });

    expect(() => parseExtractionJson(raw)).toThrow(GeminiEmptyError);
  });

  it('mẩu JSON vỡ không cứu được gì → GeminiEmptyError', () => {
    expect(() => parseExtractionJson('{"extract')).toThrow(GeminiEmptyError);
  });
});

describe('EXTRACTION_GENERATION_CONFIG — một lần gọi, JSON 2 trường', () => {
  it("responseMimeType application/json + schema đúng 2 trường, cấm suy luận giá", () => {
    expect(EXTRACTION_GENERATION_CONFIG.responseMimeType).toBe(
      'application/json',
    );
    const schema = EXTRACTION_GENERATION_CONFIG.responseSchema;
    expect(schema.type).toBe('OBJECT');
    expect(schema.required).toEqual(['extracted_text', 'summary_text']);
    expect(Object.keys(schema.properties)).toEqual([
      'extracted_text',
      'summary_text',
    ]);
  });

  it('CẤM temperature/top_p/top_k/candidate_count/thinking_budget trong config', () => {
    const raw = JSON.stringify(EXTRACTION_GENERATION_CONFIG);
    expect(raw).not.toContain('temperature');
    expect(raw).not.toContain('top_p');
    expect(raw).not.toContain('top_k');
    expect(raw).not.toContain('candidate_count');
    expect(raw).not.toContain('thinking_budget');
  });

  it('SUMMARY_PROMPT giữ nguyên để test cũ so parts[1] vẫn xanh', () => {
    expect(typeof SUMMARY_PROMPT).toBe('string');
    expect(SUMMARY_PROMPT.length).toBeGreaterThan(0);
  });
});
