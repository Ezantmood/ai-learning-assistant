import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const APP_DIR = join(__dirname, '../../../../app');

function listRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listRouteFiles(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out.sort();
}

/**
 * Cổng gác fix-route-exports: expo-router coi MỌI file .ts/.tsx trong
 * `app/` là route (regex require.context trong `expo-router/_ctx.js`,
 * chỉ trừ `+api`/`+html`) và ở dev `validateRouteTreeExports` require
 * từng node — file component/test đặt trong `app/` gây warning vàng
 * thiếu default export, file test còn nổ ngay khi require vì
 * `@jest/globals` cấm import ngoài Jest. Component/test phải nằm ngoài
 * `app/` (feature/shared), route trong `app/` bắt buộc default export.
 */
describe('routeExports', () => {
  it('mọi file trong app/ đều có default export (đúng là route)', () => {
    const files = listRouteFiles(APP_DIR);
    expect(files.length).toBeGreaterThan(0);
    const missing = files.filter(
      (file) => !/export\s+default\b/.test(readFileSync(file, 'utf8')),
    );
    expect(missing).toEqual([]);
  });
});
