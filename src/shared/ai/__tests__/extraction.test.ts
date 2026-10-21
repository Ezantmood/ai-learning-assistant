import { describe, expect, it } from '@jest/globals';

import {
  EXTRACTION_GENERATION_CONFIG,
  GeminiEmptyError,
  parseExtractionJson,
  SUMMARY_PROMPT,
} from '../transport';

/**
 * Parser JSON trích PDF: đủ / thiếu-cắt / rỗng. Chỉ cờ true mới nhận là đủ.
 * Không chạm mạng, không sửa/skip test cũ.
 */
describe('parseExtractionJson — đủ', () => {
  it('JSON hợp lệ 2 trường → truncated false', () => {
    const raw = JSON.stringify({
      extracted_text: 'Toàn văn chương 1. Nội dung bài học.',
      summary_text: 'Ý chính 1. Ý chính 2.',
      extraction_complete: true,
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

describe('EXTRACTION_GENERATION_CONFIG — nội dung và xác nhận đã trích đủ', () => {
  it('responseMimeType JSON, bắt buộc văn bản/tóm tắt/cờ đầy đủ', () => {
    expect(EXTRACTION_GENERATION_CONFIG.responseMimeType).toBe(
      'application/json',
    );
    const schema = EXTRACTION_GENERATION_CONFIG.responseSchema;
    expect(schema.type).toBe('OBJECT');
    expect(schema.required).toEqual(['extracted_text', 'summary_text', 'extraction_complete']);
    expect(Object.keys(schema.properties)).toEqual([
      'extracted_text',
      'summary_text',
      'extraction_complete',
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

  it('SUMMARY_PROMPT vẫn dùng cho bản tóm tắt', () => {
    expect(typeof SUMMARY_PROMPT).toBe('string');
    expect(SUMMARY_PROMPT.length).toBeGreaterThan(0);
  });
});

it.each([false, undefined, 'true'])('không coi cờ extraction_complete=%s là đã trích đủ', (flag) => {
  const parsed = parseExtractionJson(JSON.stringify({ extracted_text: 'Một đoạn', summary_text: 'Tóm tắt', extraction_complete: flag }));
  expect(parsed.truncated).toBe(true);
});

it('văn bản thường không có nguồn PDF được đánh dấu chưa đủ', () => {
  expect(parseExtractionJson('Chỉ có tóm tắt')).toEqual({ extractedText: '', summaryText: 'Chỉ có tóm tắt', truncated: true });
});


it('JSON null không được lưu thành bản tóm tắt chữ null', () => {
  expect(() => parseExtractionJson('null')).toThrow(GeminiEmptyError);
});
