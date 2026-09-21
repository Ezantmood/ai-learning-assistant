import type { ReactNode } from 'react';
import { Appbar } from 'react-native-paper';

type ScreenHeaderProps = {
  title: string;
  /** Chỉ render nút back khi màn hình có nơi để về. */
  showBack?: boolean;
  onBack?: () => void;
  /** Action phụ bên phải (VD nút đổi chủ đề) — G7. */
  actions?: ReactNode;
};

/**
 * Header Paper dùng chung G6.1 (header navigator đã tắt toàn bộ Stack —
 * `headerShown: false`, Appbar này là header duy nhất, màu ăn theme hiệu
 * lực). BẪY: CẤM `router.back()` trần ở `onBack` — luôn đi qua
 * `goBackOrReplace`/`goBackToDocuments` (canGoBack thì back, không thì
 * replace về gốc tab) để deep link/stack rỗng không vỡ GO_BACK.
 */
export function ScreenHeader({
  actions,
  onBack,
  showBack = false,
  title,
}: ScreenHeaderProps) {
  return (
    <Appbar.Header>
      {showBack ? (
        <Appbar.BackAction accessibilityLabel="Quay lại" onPress={onBack} />
      ) : null}
      <Appbar.Content title={title} />
      {actions}
    </Appbar.Header>
  );
}
