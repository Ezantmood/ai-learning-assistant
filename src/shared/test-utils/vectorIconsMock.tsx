import { Text, type TextProps } from 'react-native';

type MockIconProps = TextProps & {
  name: unknown;
};

/**
 * Stub đồng bộ cho @expo/vector-icons trong Jest (G6).
 * Icon thật tải font bất đồng bộ qua expo-font; promise resolve sau khi
 * test env teardown làm crash tiến trình Jest
 * (`window.dispatchEvent is not a function`). Stub này render tên icon
 * thành text nên test vẫn assert được icon nào đang dùng, không nới
 * assertion. Tên icon hợp lệ đã được kiểm tra với glyphmap thật
 * (xem DEVLOG G6).
 */
function MockMaterialCommunityIcons({ name, ...rest }: MockIconProps) {
  return <Text {...rest}>{String(name ?? '')}</Text>;
}

export default MockMaterialCommunityIcons;
export { MockMaterialCommunityIcons as MaterialCommunityIcons };
