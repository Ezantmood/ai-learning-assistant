import { describe, expect, it } from '@jest/globals';

import { FEATURE_STATUS } from '../featureStatus';

/**
 * Chặn tái phát: CN3/CN4/CN6 vào Tài liệu; CN5 vào màn quét.
 */
describe('FEATURE_STATUS (nguồn duy nhất trạng thái dashboard)', () => {
  it('CN3/CN4 hoàn thành: status done + route vào tab Tài liệu', () => {
    expect(FEATURE_STATUS['3'].status).toBe('done');
    expect(FEATURE_STATUS['3'].route).toBe('/documents');
    expect(FEATURE_STATUS['4'].status).toBe('done');
    expect(FEATURE_STATUS['4'].route).toBe('/documents');
  });

  it('CN5 vào màn quét; CN6 vào tab Tài liệu', () => {
    expect(FEATURE_STATUS['5'].status).toBe('done');
    expect(FEATURE_STATUS['5'].route).toBe('/scan');
    expect(FEATURE_STATUS['6'].status).toBe('done');
    expect(FEATURE_STATUS['6'].route).toBe('/documents');
  });

  it('CN1/CN2 giữ nguyên done + route cũ', () => {
    expect(FEATURE_STATUS['1']).toEqual({
      route: '/notes',
      status: 'done',
    });
    expect(FEATURE_STATUS['2']).toEqual({
      route: '/documents',
      status: 'done',
    });
  });
});
