import { describe, expect, it, jest } from '@jest/globals';

import { isStaleScan, STALE_SCAN_MS } from '../api';
import { getScanViewState } from '../viewState';

jest.mock('../../../shared/lib/supabase', () => ({ supabase: {} }));

describe('scan view', () => {
  it('processing ưu tiên hơn lỗi cũ và văn bản cũ', () => {
    expect(getScanViewState({ error: 'lỗi cũ', isProcessing: true, text: 'cũ' })).toBe('processing');
  });
  it('lỗi có nút thử lại, không hiện kết quả thành công giả', () => {
    expect(getScanViewState({ error: 'bị cắt', isProcessing: false, text: 'mẩu dở' })).toBe('error');
  });
  it('văn bản và empty tách rõ', () => {
    expect(getScanViewState({ error: null, isProcessing: false, text: 'Câu 1' })).toBe('result');
    expect(getScanViewState({ error: null, isProcessing: false, text: null })).toBe('empty');
  });
});

describe('stale processing', () => {
  const now = Date.parse('2026-09-22T12:00:00Z');
  it('chỉ thu hồi processing quá 15 phút', () => {
    expect(isStaleScan({ extraction_status: 'processing', updated_at: new Date(now - STALE_SCAN_MS - 1).toISOString() }, now)).toBe(true);
    expect(isStaleScan({ extraction_status: 'processing', updated_at: new Date(now - STALE_SCAN_MS).toISOString() }, now)).toBe(false);
    expect(isStaleScan({ extraction_status: 'done', updated_at: new Date(now - STALE_SCAN_MS - 1).toISOString() }, now)).toBe(false);
  });
});
