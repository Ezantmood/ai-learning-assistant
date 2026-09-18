import { useColorScheme } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

/**
 * Màu semantic của app (G6).
 *
 * - `success*`: màu thành công (MD3 không có sẵn).
 * - `danger*`: KHÔNG tạo mới — dùng thẳng `error`/`errorContainer` của MD3,
 *   đã là màu semantic cho nguy hiểm/xóa trong mọi màn hình.
 */
export type AppThemeColors = MD3Theme['colors'] & {
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
};

export type AppTheme = Omit<MD3Theme, 'colors'> & {
  colors: AppThemeColors;
};

/**
 * GHI CHÚ KỸ THUẬT: `MD3Theme` trong react-native-paper là `type` alias,
 * không phải `interface`, nên không thể `declare module ... interface MD3Theme`
 * để merge (TypeScript báo trùng định danh khác loại khai báo). Thay vào đó
 * dùng intersection type ở trên — vẫn type-safe hoàn toàn, không `any`,
 * không `@ts-ignore`; mọi màn hình đọc theme qua `useTheme<AppTheme>()`.
 */
export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    success: '#1B7A3D',
    onSuccess: '#FFFFFF',
    successContainer: '#D9F2E3',
    onSuccessContainer: '#0C3B1E',
  },
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    success: '#6FDC8C',
    onSuccess: '#00390F',
    successContainer: '#0C5A28',
    onSuccessContainer: '#D9F2E3',
  },
};

/**
 * Sáng/tối theo hệ điều hành, fallback light khi không đọc được scheme.
 */
export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
