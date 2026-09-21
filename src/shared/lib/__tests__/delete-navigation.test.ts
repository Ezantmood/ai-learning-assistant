import { describe, expect, it, jest } from '@jest/globals';

import {
  TAB_ROOTS,
  goBackOrReplace,
  goBackToDocuments,
  type BackNavigator,
} from '../navigation';

function mockRouter(canGoBack: boolean): BackNavigator & {
  back: jest.Mock<() => void>;
  replace: jest.Mock<(href: unknown) => void>;
} {
  return {
    back: jest.fn<() => void>(),
    canGoBack: () => canGoBack,
    replace: jest.fn<(href: unknown) => void>(),
  };
}

/**
 * fix/delete-navigation: khóa helper luồng tài liệu.
 * - Deep link mở `/documents/[id]` trực tiếp (stack rỗng) rồi xóa/back:
 *   canGoBack=false → replace về `/documents`, KHÔNG gọi back (khóa lỗi
 *   "GO_BACK was not handled").
 * - Mở từ danh sách (còn lịch sử): canGoBack=true → back.
 * File mới, không sửa test cũ `navigation.test.ts`.
 */
describe('goBackToDocuments (luồng tài liệu)', () => {
  it('stack rỗng (deep link) thì replace về /documents, không back', () => {
    const nav = mockRouter(false);
    goBackToDocuments(nav);
    expect(nav.back).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledWith(TAB_ROOTS.documents);
  });

  it('còn lịch sử thì back, không replace', () => {
    const nav = mockRouter(true);
    goBackToDocuments(nav);
    expect(nav.back).toHaveBeenCalledTimes(1);
    expect(nav.replace).not.toHaveBeenCalled();
  });
});

describe('goBackOrReplace fallback /documents', () => {
  it('canGoBack=false thì replace chứ không back', () => {
    const nav = mockRouter(false);
    goBackOrReplace(nav, '/documents');
    expect(nav.back).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledWith('/documents');
  });

  it('canGoBack=true thì back chứ không replace', () => {
    const nav = mockRouter(true);
    goBackOrReplace(nav, '/documents');
    expect(nav.back).toHaveBeenCalledTimes(1);
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
