import { useColorScheme } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

/**
 * Bảng màu riêng của app (CN2-13), sinh từ seed indigo `#4A5FC1` bằng
 * Material Theme Builder (`@material/material-color-utilities`,
 * variant TonalSpot — mặc định của tool).
 *
 * Cách sinh (tái lập được, đã kiểm chứng):
 * - Lấy tonal palette TonalSpot của seed: primary/secondary/tertiary/
 *   neutral/neutralVariant/error.
 * - Giữ NGUYÊN ánh xạ tone → token của `MD3LightTheme`/`MD3DarkTheme`
 *   trong react-native-paper đang cài (VD light `primary` = tone 40,
 *   `onPrimaryContainer` = tone 10), chỉ thay giá trị bằng tone mới.
 * - Nhóm `success*` tự định nghĩa giữ nguyên (MD3 không có sẵn).
 * - `surfaceDisabled`/`onSurfaceDisabled`/`backdrop` giữ đúng công thức
 *   alpha của Paper; `elevation` level1–5 là blend màu primary trên nền
 *   surface theo đúng công thức Paper (alpha 0.05/0.08/0.11/0.12/0.14).
 *
 * Tương phản WCAG (tính theo công thức chuẩn, xem `docs/DESIGN-SYSTEM.md`):
 * mọi cặp chữ/nền đều ≥ 4.5:1 ở cả light lẫn dark (yếu nhất là
 * `inversePrimary`/`inverseSurface` dark 4.98:1 và
 * `onSuccess`/`success` light 5.39:1).
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
    primary: '#505B92',
    primaryContainer: '#DDE1FF',
    secondary: '#5A5D72',
    secondaryContainer: '#DFE1F9',
    tertiary: '#76546E',
    tertiaryContainer: '#FFD7F2',
    surface: '#FEFBFF',
    surfaceVariant: '#E3E1EC',
    surfaceDisabled: 'rgba(27, 27, 33, 0.12)',
    background: '#FEFBFF',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#09164B',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#171B2C',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#2D1228',
    onSurface: '#1B1B21',
    onSurfaceVariant: '#45464F',
    onSurfaceDisabled: 'rgba(27, 27, 33, 0.38)',
    onError: '#FFFFFF',
    onErrorContainer: '#410002',
    onBackground: '#1B1B21',
    outline: '#767680',
    outlineVariant: '#C6C5D0',
    inverseSurface: '#303036',
    inverseOnSurface: '#F2F0F7',
    inversePrimary: '#B9C3FF',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(26, 27, 35, 0.4)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(245, 243, 250)',
      level2: 'rgb(240, 238, 246)',
      level3: 'rgb(235, 233, 243)',
      level4: 'rgb(233, 232, 242)',
      level5: 'rgb(230, 229, 240)',
    },
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
    primary: '#B9C3FF',
    primaryContainer: '#384379',
    secondary: '#C3C5DD',
    secondaryContainer: '#434659',
    tertiary: '#E5BAD8',
    tertiaryContainer: '#5C3C55',
    surface: '#1B1B21',
    surfaceVariant: '#45464F',
    surfaceDisabled: 'rgba(227, 225, 233, 0.12)',
    background: '#1B1B21',
    error: '#FFB4AB',
    errorContainer: '#93000A',
    onPrimary: '#212C61',
    onPrimaryContainer: '#DDE1FF',
    onSecondary: '#2C2F42',
    onSecondaryContainer: '#DFE1F9',
    onTertiary: '#44263E',
    onTertiaryContainer: '#FFD7F2',
    onSurface: '#E3E1E9',
    onSurfaceVariant: '#C6C5D0',
    onSurfaceDisabled: 'rgba(227, 225, 233, 0.38)',
    onError: '#690005',
    onErrorContainer: '#FFDAD6',
    onBackground: '#E3E1E9',
    outline: '#90909A',
    outlineVariant: '#45464F',
    inverseSurface: '#E3E1E9',
    inverseOnSurface: '#303036',
    inversePrimary: '#505B92',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(26, 27, 35, 0.4)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(35, 35, 44)',
      level2: 'rgb(40, 40, 51)',
      level3: 'rgb(44, 45, 57)',
      level4: 'rgb(46, 47, 60)',
      level5: 'rgb(49, 51, 64)',
    },
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
