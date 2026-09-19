import { z } from 'zod';

/**
 * Schema tên hiển thị tài liệu CN2 (luật validate SPEC:
 * trim đầu/cuối + gộp khoảng trắng thừa, sau chuẩn hóa 1–120 ký tự).
 * G1 dùng để suy `display_name` từ tên tệp gốc khi upload (FR-06);
 * màn đổi tên G2 dùng lại schema này (FR-10).
 */

/** Chuẩn hóa tên: trim + gộp khoảng trắng thừa thành một. */
export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export const displayNameSchema = z
  .string()
  .transform(normalizeDisplayName)
  .pipe(
    z
      .string()
      .min(1, 'Tên tài liệu không được để trống.')
      .max(120, 'Tên tài liệu tối đa 120 ký tự.'),
  );

export type DisplayNameValues = {
  displayName: string;
};

export const MAX_DISPLAY_NAME_LENGTH = 120;

/**
 * Suy nhãn hiển thị từ tên tệp gốc: chuẩn hóa, cắt còn 120 ký tự.
 * Tên rỗng sau chuẩn hóa (hiếm) thì dùng tên dự phòng theo định dạng.
 */
export function deriveDisplayName(
  fileName: string,
  fallbackExt: string,
): string {
  const normalized = normalizeDisplayName(fileName);
  if (!normalized) {
    return `Tài liệu.${fallbackExt}`;
  }
  if (normalized.length <= MAX_DISPLAY_NAME_LENGTH) {
    return normalized;
  }
  return normalizeDisplayName(normalized.slice(0, MAX_DISPLAY_NAME_LENGTH));
}
