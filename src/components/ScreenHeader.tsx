import { Appbar } from 'react-native-paper';

type ScreenHeaderProps = {
  title: string;
  /** Chỉ render nút back khi màn hình có nơi để về. */
  showBack?: boolean;
  onBack?: () => void;
};

/**
 * Header Paper dùng chung G6.1 (header navigator đã tắt toàn bộ Stack).
 * Màn hình truyền `showBack={router.canGoBack()}` để entry point không
 * hiện nút back thừa.
 */
export function ScreenHeader({ onBack, showBack = false, title }: ScreenHeaderProps) {
  return (
    <Appbar.Header>
      {showBack ? (
        <Appbar.BackAction accessibilityLabel="Quay lại" onPress={onBack} />
      ) : null}
      <Appbar.Content title={title} />
    </Appbar.Header>
  );
}
