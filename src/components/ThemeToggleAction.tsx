import { Appbar } from 'react-native-paper';

import { useThemeMode } from '../theme/ThemeContext';
import { themeModeAccessibilityLabel, themeModeIcon } from '../theme/themeMode';

/**
 * Nút nhanh đổi chủ đề trên Appbar (G7): icon đổi động theo mode,
 * bấm để cycle system → light → dark → system.
 */
export function ThemeToggleAction() {
  const { cycleMode, mode } = useThemeMode();

  return (
    <Appbar.Action
      accessibilityLabel={themeModeAccessibilityLabel(mode)}
      accessibilityRole="button"
      icon={themeModeIcon(mode)}
      onPress={cycleMode}
      testID="theme-toggle"
    />
  );
}
