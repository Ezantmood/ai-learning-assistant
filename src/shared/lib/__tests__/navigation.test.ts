import { describe, expect, it, jest } from '@jest/globals';

import {
  TAB_ROOTS,
  decideRouteTarget,
  goBackOrReplace,
  type BackNavigator,
} from '../navigation';

describe('decideRouteTarget', () => {
  it('đang tải session thì chờ (chống nháy)', () => {
    expect(
      decideRouteTarget({
        hasSession: false,
        isLoading: true,
        recovery: 'unknown',
      }),
    ).toBe('loading');
  });

  it('cờ recovery chưa đọc xong thì chờ dù session đã có', () => {
    expect(
      decideRouteTarget({
        hasSession: true,
        isLoading: false,
        recovery: 'unknown',
      }),
    ).toBe('loading');
  });

  it('recovery session + cờ pending thì tiếp tục đặt mật khẩu', () => {
    expect(
      decideRouteTarget({
        hasSession: true,
        isLoading: false,
        recovery: 'pending',
      }),
    ).toBe('recovery');
  });

  it('có session thường thì vào nhóm app (tabs)', () => {
    expect(
      decideRouteTarget({
        hasSession: true,
        isLoading: false,
        recovery: 'none',
      }),
    ).toBe('app');
  });

  it('không session thì về nhóm auth', () => {
    expect(
      decideRouteTarget({
        hasSession: false,
        isLoading: false,
        recovery: 'none',
      }),
    ).toBe('auth');
  });

  it('mất session giữa chừng (VD token hỏng) thì về auth, không kẹt app', () => {
    expect(
      decideRouteTarget({
        hasSession: false,
        isLoading: false,
        recovery: 'pending',
      }),
    ).toBe('auth');
  });
});

function mockNavigator(canGoBack: boolean): BackNavigator & {
  back: jest.Mock<() => void>;
  replace: jest.Mock<(href: unknown) => void>;
} {
  return {
    back: jest.fn<() => void>(),
    canGoBack: () => canGoBack,
    replace: jest.fn<(href: unknown) => void>(),
  };
}

describe('goBackOrReplace', () => {
  it('còn lịch sử thì back, không replace', () => {
    const nav = mockNavigator(true);
    goBackOrReplace(nav, TAB_ROOTS.account);
    expect(nav.back).toHaveBeenCalledTimes(1);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('hết lịch sử thì replace về gốc tab, không kẹt', () => {
    const nav = mockNavigator(false);
    goBackOrReplace(nav, TAB_ROOTS.documents);
    expect(nav.back).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledWith('/documents');
  });

  it('màn con CN1 hết lịch sử thì về tab Tài khoản', () => {
    const nav = mockNavigator(false);
    goBackOrReplace(nav, '/notes');
    expect(nav.replace).toHaveBeenCalledWith('/notes');
  });
});

describe('TAB_ROOTS', () => {
  it('đủ ba gốc tab Trang chủ / Tài liệu / Tài khoản', () => {
    expect(TAB_ROOTS.home).toBe('/dashboard');
    expect(TAB_ROOTS.documents).toBe('/documents');
    expect(TAB_ROOTS.account).toBe('/profile');
  });
});
