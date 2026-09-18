import { describe, expect, it, jest } from '@jest/globals';
import type { ReactElement, ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Appbar, PaperProvider, SegmentedButtons } from 'react-native-paper';

import { ThemeSettingsCard } from '../../components/ThemeSettingsCard';
import { ThemeToggleAction } from '../../components/ThemeToggleAction';
import { lightTheme } from '../theme';
import {
  ThemeModeProvider,
  useThemeMode,
  type ThemeContextValue,
  type ThemeMode,
} from '../ThemeContext';
import type { SystemScheme, ThemeModeStorage } from '../themeMode';

// Tránh import AsyncStorage thật (native module crash Jest — bài học G4);
// provider trong test luôn nhận storage mock qua props.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async () => null,
    setItem: async () => undefined,
  },
}));

type MemoryStorage = ThemeModeStorage & {
  setCalls: Array<{ key: string; value: string }>;
};

function createMemoryStorage(initial: string | null): MemoryStorage {
  let stored: string | null = initial;
  const setCalls: Array<{ key: string; value: string }> = [];
  return {
    getItem: async (key: string) => {
      void key;
      return stored;
    },
    setCalls,
    setItem: async (key: string, value: string) => {
      setCalls.push({ key, value });
      stored = value;
    },
  };
}

async function renderWithTheme(
  ui: ReactNode,
  storage: ThemeModeStorage,
  systemScheme?: SystemScheme,
): Promise<ReactTestRenderer> {
  let tree: ReactTestRenderer | undefined;
  await act(async () => {
    tree = create(
      <PaperProvider theme={lightTheme}>
        <ThemeModeProvider storage={storage} systemScheme={systemScheme}>
          {ui as ReactElement}
        </ThemeModeProvider>
      </PaperProvider>,
    );
  });

  if (!tree) {
    throw new Error('Không render được cây theme trong test.');
  }
  return tree;
}

function Probe({ onValue }: { onValue: (value: ThemeContextValue) => void }) {
  const value = useThemeMode();
  onValue(value);
  return null;
}

function lastValue(seen: Array<ThemeContextValue>): ThemeContextValue {
  const value = seen[seen.length - 1];
  if (!value) {
    throw new Error('Probe chưa nhận giá trị theme nào.');
  }
  return value;
}

function toggleOf(tree: ReactTestRenderer) {
  return tree.root.findByType(Appbar.Action);
}

describe('ThemeModeProvider', () => {
  it('hydrate mode dark từ storage, theme hiệu lực là dark', async () => {
    const seen: Array<ThemeContextValue> = [];
    const storage = createMemoryStorage('dark');

    await renderWithTheme(
      <Probe
        onValue={(value) => {
          seen.push(value);
        }}
      />,
      storage,
      'light',
    );

    const value = lastValue(seen);
    expect(value.mode).toBe('dark');
    expect(value.effectiveScheme).toBe('dark');
    expect(value.isThemeHydrated).toBe(true);
    expect(value.theme.dark).toBe(true);
    expect(value.navigationTheme.dark).toBe(true);
  });

  it("mode system bám theo hệ điều hành ('dark' → tối, 'light' → sáng)", async () => {
    const storage = createMemoryStorage('system');

    const seenDark: Array<ThemeContextValue> = [];
    await renderWithTheme(
      <Probe
        onValue={(value) => {
          seenDark.push(value);
        }}
      />,
      storage,
      'dark',
    );
    expect(lastValue(seenDark).mode).toBe('system');
    expect(lastValue(seenDark).effectiveScheme).toBe('dark');
    expect(lastValue(seenDark).theme.dark).toBe(true);

    const seenLight: Array<ThemeContextValue> = [];
    await renderWithTheme(
      <Probe
        onValue={(value) => {
          seenLight.push(value);
        }}
      />,
      storage,
      'light',
    );
    expect(lastValue(seenLight).effectiveScheme).toBe('light');
    expect(lastValue(seenLight).theme.dark).toBe(false);
  });

  it('giá trị rác trong storage → fallback system', async () => {
    const seen: Array<ThemeContextValue> = [];

    await renderWithTheme(
      <Probe
        onValue={(value) => {
          seen.push(value);
        }}
      />,
      createMemoryStorage('sepia-không-hợp-lệ'),
      'light',
    );

    expect(lastValue(seen).mode).toBe('system');
    expect(lastValue(seen).effectiveScheme).toBe('light');
  });
});

describe('ThemeToggleAction', () => {
  it.each([
    ['system', 'theme-light-dark'],
    ['light', 'weather-sunny'],
    ['dark', 'weather-night'],
  ] as Array<[ThemeMode, string]>)(
    'mode %s render icon %s + testID theme-toggle',
    async (mode, icon) => {
      const tree = await renderWithTheme(
        <ThemeToggleAction />,
        createMemoryStorage(mode),
        'light',
      );

      const toggle = toggleOf(tree);
      expect(toggle.props.icon).toBe(icon);
      expect(toggle.props.testID).toBe('theme-toggle');
      expect(toggle.props.accessibilityRole).toBe('button');
      expect(typeof toggle.props.accessibilityLabel).toBe('string');
      expect(toggle.props.accessibilityLabel).toContain('Chạm để đổi chủ đề');
    },
  );

  it('bấm toggle cycle system → light và persist đúng key/value', async () => {
    const storage = createMemoryStorage('system');
    const tree = await renderWithTheme(
      <ThemeToggleAction />,
      storage,
      'light',
    );

    expect(toggleOf(tree).props.icon).toBe('theme-light-dark');

    await act(async () => {
      toggleOf(tree).props.onPress();
    });

    expect(toggleOf(tree).props.icon).toBe('weather-sunny');
    expect(toggleOf(tree).props.accessibilityLabel).toContain('Sáng');
    expect(storage.setCalls).toContainEqual({
      key: 'app.theme.mode',
      value: 'light',
    });
  });
});

describe('ThemeSettingsCard', () => {
  it('SegmentedButtons chọn đúng value theo mode + testID theme-segmented', async () => {
    const tree = await renderWithTheme(
      <ThemeSettingsCard />,
      createMemoryStorage('dark'),
      'light',
    );

    // testID forward từ View wrapper xuống host view nên có 2 node;
    // điều quan trọng là testID "theme-segmented" tồn tại trong cây.
    expect(
      tree.root.findAllByProps({ testID: 'theme-segmented' }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(tree.root.findByType(SegmentedButtons).props.value).toBe('dark');
  });

  it('đổi ở SegmentedButtons thì nút Appbar phản ánh ngay (cùng state)', async () => {
    const tree = await renderWithTheme(
      <>
        <ThemeToggleAction />
        <ThemeSettingsCard />
      </>,
      createMemoryStorage('dark'),
      'light',
    );

    expect(toggleOf(tree).props.icon).toBe('weather-night');

    await act(async () => {
      tree.root.findByType(SegmentedButtons).props.onValueChange('light');
    });

    expect(toggleOf(tree).props.icon).toBe('weather-sunny');
    expect(tree.root.findByType(SegmentedButtons).props.value).toBe('light');
  });
});
