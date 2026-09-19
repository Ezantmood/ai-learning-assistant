import { describe, expect, it } from '@jest/globals';

import { darkTheme, lightTheme } from '../theme';

/**
 * Khóa bảng màu CN2-13 (seed indigo `#4A5FC1`, TonalSpot): chống regress
 * về màu tím mặc định của Paper (`#6750A4` / `#D0BCFF`).
 */
describe('app theme palette (CN2-13)', () => {
  it('light dùng primary indigo, không còn tím Paper', () => {
    expect(lightTheme.colors.primary).toBe('#505B92');
    expect(lightTheme.colors.onPrimaryContainer).toBe('#09164B');
    expect(lightTheme.colors.inversePrimary).toBe('#B9C3FF');
    expect(lightTheme.colors.surface).toBe('#FEFBFF');
  });

  it('dark dùng primary indigo nhạt, không còn tím Paper', () => {
    expect(darkTheme.colors.primary).toBe('#B9C3FF');
    expect(darkTheme.colors.onPrimary).toBe('#212C61');
    expect(darkTheme.colors.inversePrimary).toBe('#505B92');
    expect(darkTheme.colors.surface).toBe('#1B1B21');
  });

  it('giữ nhóm success tự định nghĩa ở cả hai mode', () => {
    expect(lightTheme.colors.success).toBe('#1B7A3D');
    expect(lightTheme.colors.onSuccessContainer).toBe('#0C3B1E');
    expect(darkTheme.colors.success).toBe('#6FDC8C');
    expect(darkTheme.colors.onSuccessContainer).toBe('#D9F2E3');
  });
});
