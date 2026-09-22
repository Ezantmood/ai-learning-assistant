import { describe, expect, it } from '@jest/globals';

import { FEATURE_STATUS } from '../featureStatus';

/**
 * Chặn tái phát: CN3/CN4 đã hoàn thành (kiểm tay Expo Go PDF thật) nên
 * KHÔNG được ở trạng thái "sắp có"; CN5/CN6 vẫn đang làm nên phải CÒN
 * "sắp có" và không có route để bấm.
 */
describe('FEATURE_STATUS (nguồn duy nhất trạng thái dashboard)', () => {
  it('CN3/CN4 hoàn thành: status done + route vào tab Tài liệu', () => {
    expect(FEATURE_STATUS['3'].status).toBe('done');
    expect(FEATURE_STATUS['3'].route).toBe('/documents');
    expect(FEATURE_STATUS['4'].status).toBe('done');
    expect(FEATURE_STATUS['4'].route).toBe('/documents');
  });

  it('CN5/CN6 vẫn đang làm: còn soon, không route', () => {
    expect(FEATURE_STATUS['5'].status).toBe('soon');
    expect(FEATURE_STATUS['5'].route).toBeUndefined();
    expect(FEATURE_STATUS['6'].status).toBe('soon');
    expect(FEATURE_STATUS['6'].route).toBeUndefined();
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
