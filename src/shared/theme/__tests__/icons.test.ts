import { describe, expect, it } from '@jest/globals';

// Import TRỰC TIẾP file JSON glyphMap bằng đường dẫn tương đối để né
// `moduleNameMapper` stub `@expo/vector-icons` trong jest.config.js
// (stub đó thay cả subpath bằng mock, không còn glyphMap thật).
import glyphMap from '../../../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';

import { ALL_APP_ICONS, AppIcons } from '../icons';

/**
 * Cổng gác fix/icons-cn1-cn2: Paper resolve icon chuỗi qua
 * `settings.icon` sang MaterialCommunityIcons; tên sai render rỗng
 * IM LẶNG, không warning. Mọi icon app dùng gom trong `AppIcons`;
 * test này fail ngay khi có tên rác lọt vào.
 */
describe('icons', () => {
  it('mọi tên trong AppIcons đều tồn tại trong glyphMap thật', () => {
    expect(ALL_APP_ICONS.length).toBeGreaterThan(0);
    const missing = ALL_APP_ICONS.filter(
      (name) => !Object.prototype.hasOwnProperty.call(glyphMap, name),
    );
    expect(missing).toEqual([]);
  });

  it('không có key trùng giá trị rỗng', () => {
    const values = Object.values(AppIcons);
    expect(new Set(values).size).toBe(values.length);
    for (const name of values) {
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
