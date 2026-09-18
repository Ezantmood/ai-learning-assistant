import { describe, expect, it } from '@jest/globals';

import {
  cycleThemeMode,
  isThemeMode,
  loadStoredThemeMode,
  persistThemeMode,
  resolveEffectiveScheme,
  themeModeAccessibilityLabel,
  themeModeIcon,
  THEME_MODE_STORAGE_KEY,
  type ThemeModeStorage,
} from '../themeMode';

function memoryStorage(initial: string | null) {
  let stored: string | null = initial;
  const setCalls: { key: string; value: string }[] = [];
  const storage: ThemeModeStorage = {
    getItem: async (key: string) => {
      void key;
      return stored;
    },
    setItem: async (key: string, value: string) => {
      setCalls.push({ key, value });
      stored = value;
    },
  };
  return { setCalls, storage };
}

describe('themeMode', () => {
  it('cycle đúng thứ tự system → light → dark → system', () => {
    expect(cycleThemeMode('system')).toBe('light');
    expect(cycleThemeMode('light')).toBe('dark');
    expect(cycleThemeMode('dark')).toBe('system');
  });

  it('isThemeMode chỉ nhận đúng union light/dark/system', () => {
    expect(isThemeMode('light')).toBe(true);
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('system')).toBe(true);
    expect(isThemeMode('sepia')).toBe(false);
    expect(isThemeMode('')).toBe(false);
    expect(isThemeMode(null)).toBe(false);
    expect(isThemeMode(undefined)).toBe(false);
    expect(isThemeMode(123)).toBe(false);
    expect(isThemeMode({})).toBe(false);
  });

  it('resolveEffectiveScheme đúng cho cả 3 mode', () => {
    expect(resolveEffectiveScheme('light', 'dark')).toBe('light');
    expect(resolveEffectiveScheme('light', null)).toBe('light');
    expect(resolveEffectiveScheme('dark', 'light')).toBe('dark');
    expect(resolveEffectiveScheme('dark', undefined)).toBe('dark');
    expect(resolveEffectiveScheme('system', 'dark')).toBe('dark');
    expect(resolveEffectiveScheme('system', 'light')).toBe('light');
    expect(resolveEffectiveScheme('system', null)).toBe('light');
    expect(resolveEffectiveScheme('system', undefined)).toBe('light');
  });

  it('mapping mode → icon đúng bảng G7', () => {
    expect(themeModeIcon('system')).toBe('theme-light-dark');
    expect(themeModeIcon('light')).toBe('weather-sunny');
    expect(themeModeIcon('dark')).toBe('weather-night');
  });

  it('accessibilityLabel tiếng Việt nêu trạng thái + hành động', () => {
    expect(themeModeAccessibilityLabel('light')).toContain('Sáng');
    expect(themeModeAccessibilityLabel('dark')).toContain('Tối');
    expect(themeModeAccessibilityLabel('system')).toContain('hệ thống');
    for (const mode of ['light', 'dark', 'system'] as const) {
      expect(themeModeAccessibilityLabel(mode)).toContain('Chạm để đổi chủ đề');
    }
  });

  it('đọc giá trị rác từ storage → fallback system, không throw', async () => {
    const garbage = memoryStorage('sepia');
    await expect(loadStoredThemeMode(garbage.storage)).resolves.toBe('system');

    const empty = memoryStorage(null);
    await expect(loadStoredThemeMode(empty.storage)).resolves.toBe('system');

    const failing: ThemeModeStorage = {
      getItem: async () => {
        throw new Error('I/O lỗi');
      },
      setItem: async () => undefined,
    };
    await expect(loadStoredThemeMode(failing)).resolves.toBe('system');
  });

  it('đọc giá trị hợp lệ từ storage giữ nguyên', async () => {
    const stored = memoryStorage('dark');
    await expect(loadStoredThemeMode(stored.storage)).resolves.toBe('dark');
  });

  it('persist ghi đúng key và giá trị, lỗi I/O không throw', async () => {
    const { setCalls, storage } = memoryStorage(null);
    await persistThemeMode(storage, 'dark');
    expect(setCalls).toEqual([{ key: 'app.theme.mode', value: 'dark' }]);
    expect(THEME_MODE_STORAGE_KEY).toBe('app.theme.mode');

    const failing: ThemeModeStorage = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('I/O lỗi');
      },
    };
    await expect(persistThemeMode(failing, 'light')).resolves.toBeUndefined();
  });
});
