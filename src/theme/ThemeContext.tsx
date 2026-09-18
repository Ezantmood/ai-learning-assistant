import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import { navigationDarkTheme, navigationLightTheme } from './navigation';
import { darkTheme, lightTheme, type AppTheme } from './theme';
import {
  cycleThemeMode,
  loadStoredThemeMode,
  persistThemeMode,
  resolveEffectiveScheme,
  type EffectiveScheme,
  type SystemScheme,
  type ThemeMode,
  type ThemeModeStorage,
} from './themeMode';

export type { EffectiveScheme, ThemeMode };

export type ThemeContextValue = {
  /** Lựa chọn thô của người dùng (có 'system'). */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** system → light → dark → system, dùng cho nút nhanh trên Appbar. */
  cycleMode: () => void;
  /** Scheme sau khi giải quyết mode + hệ điều hành. */
  effectiveScheme: EffectiveScheme;
  theme: AppTheme;
  navigationTheme: ReactNavigation.Theme;
  /** False cho tới khi đọc xong storage — app chưa render theme thật. */
  isThemeHydrated: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeModeProviderProps = PropsWithChildren & {
  /** Override cho test (mock storage, không I/O thật). */
  storage?: ThemeModeStorage;
  /** Mode khởi tạo cho test; runtime luôn là 'system' rồi hydrate. */
  initialMode?: ThemeMode;
  /**
   * Override scheme hệ điều hành cho test (thay cho `useColorScheme`,
   * vì mock module react-native làm crash worker Jest).
   */
  systemScheme?: SystemScheme;
};

/**
 * Nguồn theme duy nhất của app (G7), đặt ở root bọc NGOÀI PaperProvider
 * và ThemeProvider của navigation — cả hai cùng ăn `theme` ở đây.
 *
 * Chống flash: khi chưa đọc xong storage (`isThemeHydrated === false`)
 * thì render null, KHÔNG render app bằng theme đoán bừa. Vì provider này
 * bọc ngoài AuthProvider (nơi gọi `SplashScreen.hideAsync`), splash hệ
 * thống vẫn hiển thị trong lúc hydrate nên user không thấy nháy sáng→tối.
 */
export function ThemeModeProvider({
  children,
  initialMode = 'system',
  storage = AsyncStorage,
  systemScheme,
}: ThemeModeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [isThemeHydrated, setIsThemeHydrated] = useState(false);
  const osScheme = useColorScheme();

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const stored = await loadStoredThemeMode(storage);
      if (isMounted) {
        setModeState(stored);
        setIsThemeHydrated(true);
      }
    }

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [storage]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      void persistThemeMode(storage, next);
    },
    [storage],
  );

  const cycleMode = useCallback(() => {
    setMode(cycleThemeMode(mode));
  }, [mode, setMode]);

  const effectiveScheme = resolveEffectiveScheme(
    mode,
    systemScheme ?? osScheme,
  );

  // Memo theo effectiveScheme để object theme ổn định giữa các render —
  // tránh remount navigator / render lại toàn cây không cần thiết.
  const theme = useMemo<AppTheme>(
    () => (effectiveScheme === 'dark' ? darkTheme : lightTheme),
    [effectiveScheme],
  );
  const navigationTheme = useMemo<ReactNavigation.Theme>(
    () =>
      effectiveScheme === 'dark' ? navigationDarkTheme : navigationLightTheme,
    [effectiveScheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      cycleMode,
      effectiveScheme,
      isThemeHydrated,
      mode,
      navigationTheme,
      setMode,
      theme,
    }),
    [
      cycleMode,
      effectiveScheme,
      isThemeHydrated,
      mode,
      navigationTheme,
      setMode,
      theme,
    ],
  );

  if (!isThemeHydrated) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Đọc theme dùng chung; throw khi dùng ngoài ThemeModeProvider. */
export function useThemeMode(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error('useThemeMode phải dùng bên trong ThemeModeProvider.');
  }
  return value;
}
