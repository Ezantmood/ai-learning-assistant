import { test, expect } from '@jest/globals';
import { buildSummaryPrompt } from '../../../lib/ai/transport';
import { summaryOptionsSchema } from '../schemas';

test.each(['short', 'medium', 'detailed'] as const)('mức %s thay đổi chỉ dẫn, giữ cấu trúc và nguồn', (level) => {
  const prompt = buildSummaryPrompt({ level, scope: 'whole', sectionTitle: '' });
  expect(prompt).toContain('chỉ dựa trên tài liệu');
  expect(prompt).toContain('tiêu đề');
  expect(prompt).toContain(({ short: '3–5', medium: 'dẫn giải ngắn', detailed: 'ví dụ' })[level]);
});
test('theo từng chương và phần cụ thể, không bịa phần thiếu', () => {
  const prompt = buildSummaryPrompt({ level: 'medium', scope: 'sections', sectionTitle: 'Chương 2' });
  expect(prompt).toContain('riêng từng chương/phần');
  expect(prompt).toContain('Chương 2');
  expect(prompt).toContain('không tìm thấy');
  expect(summaryOptionsSchema.safeParse({ level: 'other', scope: 'whole', sectionTitle: '' }).success).toBe(false);
  expect(summaryOptionsSchema.safeParse({ level: 'short', scope: 'sections', sectionTitle: 'a'.repeat(201) }).success).toBe(false);
});
