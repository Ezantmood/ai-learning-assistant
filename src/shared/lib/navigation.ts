import type { Href } from 'expo-router';

/**
 * Logic quyết định vỏ ứng dụng (app shell) — thuần túy, unit-test được.
 *
 * Bối cảnh: repo vốn là bài 1 đơn lẻ, `(app)` là Stack phẳng quanh `/notes`.
 * Sau khi gộp 6 CN vẫn chưa có vỏ chung nên user kẹt trong nhóm màn CN1:
 * đăng nhập `replace` sang `/notes` xóa sạch lịch sử, màn gốc CN1 lại không
 * có Appbar.BackAction. Vỏ mới: `(app)` là bottom tabs
 * (Trang chủ / Tài liệu / Tài khoản), CN1 nằm trong tab Tài khoản.
 */

export type RecoveryFlag = 'unknown' | 'pending' | 'none';

export type SessionSnapshot = {
  hasSession: boolean;
  isLoading: boolean;
  recovery: RecoveryFlag;
};

/** Nhóm route mà route gốc `/` sẽ đẩy vào. */
export type RouteTarget = 'loading' | 'recovery' | 'app' | 'auth';

/**
 * Quyết định nhóm route theo trạng thái phiên (mirror logic `app/index.tsx`):
 * đang hydrate (session chưa xong hoặc cờ recovery chưa đọc xong) → chờ;
 * recovery session còn hiệu lực + cờ pending → đặt mật khẩu;
 * có session → vào tabs; ngược lại → đăng nhập.
 */
export function decideRouteTarget(snapshot: SessionSnapshot): RouteTarget {
  if (snapshot.isLoading || snapshot.recovery === 'unknown') {
    return 'loading';
  }

  if (snapshot.hasSession && snapshot.recovery === 'pending') {
    return 'recovery';
  }

  if (snapshot.hasSession) {
    return 'app';
  }

  return 'auth';
}

/** Gốc mỗi tab — lối lùi cuối cùng khi stack không còn gì để back. */
export const TAB_ROOTS = {
  account: '/profile',
  documents: '/documents',
  home: '/dashboard',
} as const;

export type TabRoot = (typeof TAB_ROOTS)[keyof typeof TAB_ROOTS];

/** Hình dáng tối thiểu của router mà `goBackOrReplace` cần. */
export type BackNavigator = {
  back: () => void;
  canGoBack: () => boolean;
  replace: (href: Href) => void;
};

/**
 * Lối lùi mọi màn con: còn lịch sử thì back, hết lịch sử (deep link,
 * restart giữa chừng) thì replace về gốc tab tương ứng — không để kẹt.
 */
export function goBackOrReplace(
  navigator: BackNavigator,
  fallback: TabRoot | '/notes' | '/sign-in',
): void {
  if (navigator.canGoBack()) {
    navigator.back();
    return;
  }

  navigator.replace(fallback);
}
