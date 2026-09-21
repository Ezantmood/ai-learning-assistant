/**
 * Logic chọn chế độ giao diện thuần túy (G7) — không import native module
 * hay storage thật để unit test chạy được mà không cần mock (bài học G4:
 * import AsyncStorage làm Jest crash nên tách lớp thuần ra riêng).
 *
 * Ba mode thay vì boolean: 'system' cho phép app bám theo cài đặt hệ điều
 * hành (người dùng đổi dark/light trong Settings điện thoại thì app đổi
 * theo mà không cần chạm lại app).
 */
import { AppIcons } from './icons';
/** Chế độ giao diện do người dùng chọn. Union hẹp, không string trần. */
export type ThemeMode = 'dark' | 'light' | 'system';

/** Scheme hiệu lực sau khi giải quyết mode + scheme hệ điều hành. */
export type EffectiveScheme = 'dark' | 'light';

/**
 * Scheme hệ điều hành: bao cả 'unspecified'/null/undefined vì
 * `useColorScheme` có thể trả về các giá trị này tùy nền tảng —
 * tất cả đều fallback light.
 */
export type SystemScheme = EffectiveScheme | 'unspecified' | null | undefined;

/** Key AsyncStorage duy nhất lưu lựa chọn của người dùng. */
export const THEME_MODE_STORAGE_KEY = 'app.theme.mode';

/** Type guard: giá trị rác/không parse được → false, caller fallback. */
export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light' || value === 'system';
}

/** Thứ tự cycle của nút nhanh: system → light → dark → system. */
export function cycleThemeMode(mode: ThemeMode): ThemeMode {
  switch (mode) {
    case 'system':
      return 'light';
    case 'light':
      return 'dark';
    case 'dark':
      return 'system';
  }
}

/** Giải quyết scheme hiệu lực; system null/undefined → light. */
export function resolveEffectiveScheme(
  mode: ThemeMode,
  systemScheme: SystemScheme,
): EffectiveScheme {
  if (mode === 'dark') {
    return 'dark';
  }
  if (mode === 'light') {
    return 'light';
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/** Icon Appbar tương ứng từng mode (tên đã có trong glyphmap G6). */
export function themeModeIcon(mode: ThemeMode): string {
  switch (mode) {
    case 'system':
      return AppIcons.themeLightDark;
    case 'light':
      return AppIcons.weatherSunny;
    case 'dark':
      return AppIcons.weatherNight;
  }
}

/** Nhãn accessibility tiếng Việt: nêu trạng thái hiện tại + hành động. */
export function themeModeAccessibilityLabel(mode: ThemeMode): string {
  switch (mode) {
    case 'light':
      return 'Chủ đề: Sáng. Chạm để đổi chủ đề';
    case 'dark':
      return 'Chủ đề: Tối. Chạm để đổi chủ đề';
    case 'system':
      return 'Chủ đề: Theo hệ thống. Chạm để đổi chủ đề';
  }
}

export type ThemeModeStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

/**
 * Đọc mode đã lưu. Giá trị rác (không phải union hợp lệ), null, lỗi
 * parse hay lỗi I/O đều → 'system', không throw để app không crash khi
 * storage bị ghi bẩn từ bên ngoài.
 */
export async function loadStoredThemeMode(
  storage: Pick<ThemeModeStorage, 'getItem'>,
): Promise<ThemeMode> {
  try {
    const raw = await storage.getItem(THEME_MODE_STORAGE_KEY);
    return isThemeMode(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

/** Ghi mode; lỗi I/O được nuốt để không chặn UI (lần mở sau đọc lại). */
export async function persistThemeMode(
  storage: Pick<ThemeModeStorage, 'setItem'>,
  mode: ThemeMode,
): Promise<void> {
  try {
    await storage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // Bỏ qua: lựa chọn vẫn có hiệu lực trong session hiện tại.
  }
}
