import { View } from 'react-native';
import { Card, SegmentedButtons } from 'react-native-paper';

import { useThemeMode } from '../theme/ThemeContext';
import { isThemeMode } from '../theme/themeMode';

/**
 * Lựa chọn tường minh Sáng / Tối / Hệ thống trong Profile (G7).
 * Đọc/ghi cùng state với nút nhanh trên Appbar nên hai chỗ luôn
 * phản ánh nhau ngay.
 */
export function ThemeSettingsCard() {
  const { mode, setMode } = useThemeMode();

  return (
    <Card>
      <Card.Title
        subtitle="Chọn sáng, tối hoặc theo hệ thống."
        title="Giao diện"
      />
      <Card.Content>
        {/* testID đặt ở wrapper: SegmentedButtons Paper 5 không nhận
            testID ở root, chỉ nhận theo từng button. */}
        <View testID="theme-segmented">
          <SegmentedButtons
            buttons={[
              { icon: 'weather-sunny', label: 'Sáng', value: 'light' },
              { icon: 'weather-night', label: 'Tối', value: 'dark' },
              {
                icon: 'theme-light-dark',
                label: 'Hệ thống',
                value: 'system',
              },
            ]}
            onValueChange={(value) => {
              if (isThemeMode(value)) {
                setMode(value);
              }
            }}
            value={mode}
          />
        </View>
      </Card.Content>
    </Card>
  );
}
