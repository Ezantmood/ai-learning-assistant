import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import TRỰC TIẾP file JSON glyphMap bằng đường dẫn tương đối để né
// `moduleNameMapper` stub `@expo/vector-icons` trong jest.config.js
// (khuôn `icons.test.ts`).
import glyphMap from '../../../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';

import { TAB_BAR_ICONS } from '../icons';

const TAB_LAYOUT_PATH = join(__dirname, '../../../../app/(app)/_layout.tsx');

/**
 * Cổng gác fix-tabbar-icons: tabBarIcon của expo-router render
 * MaterialCommunityIcons TRỰC TIẾP, không qua `settings.icon` của Paper
 * nên tên sai hiện tofu box (thay vì rỗng im lặng như bẫy cũ), và tên
 * viết literal ngoài AppIcons lọt lưới cổng ALL_APP_ICONS. Hai test dưới
 * khóa cả hai đường lọt: giá trị tab phải có trong glyphMap ĐÚNG họ, và
 * file tab không được chứa literal tên icon trong tabBarIcon.
 */
describe('tabBarIcons', () => {
  it('mọi icon tab bar tồn tại trong glyphMap MaterialCommunityIcons', () => {
    const names = Object.values(TAB_BAR_ICONS);
    expect(names.length).toBe(3);
    const missing = names.filter(
      (name) => !Object.prototype.hasOwnProperty.call(glyphMap, name),
    );
    expect(missing).toEqual([]);
  });

  it('tabBarIcon chỉ trỏ hằng đã gom, cấm literal tên icon', () => {
    const src = readFileSync(TAB_LAYOUT_PATH, 'utf8');
    // Cắt chính xác từng callback tabBarIcon (JSX trong đó không chứa
    // dấu ngoặc tròn nên dừng ở ')' đầu tiên sau '=> ('; name="..."
    // ngoài callback là tên route, không tính).
    const bodies =
      src.match(/tabBarIcon:\s*\([^)]*\)\s*=>\s*\([\s\S]*?\)/g) ?? [];
    expect(bodies.length).toBe(3);
    for (const body of bodies) {
      // Literal dạng name="..." trong callback icon là đường lọt cổng
      // (name="..." ngoài callback là tên route, không tính).
      expect(body).not.toMatch(/name\s*=\s*"/);
      // Icon phải lấy từ chỗ đã gom.
      expect(body).toMatch(/name=\{(AppIcons|TAB_BAR_ICONS)\.\w+\}/);
    }
  });
});
