/**
 * Token khoảng cách và bo góc duy nhất của app (G6).
 * Mọi style mới đều dùng token này, không hardcode số lẻ.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  /** Bo góc bottom sheet theo DESIGN-SYSTEM (CN2-13). */
  sheet: 28,
  full: 9999,
} as const;
