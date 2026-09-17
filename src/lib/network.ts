const NETWORK_ERROR_PATTERN =
  /network request failed|failed to fetch|fetch failed|networkerror|load failed|timeout|timed out|abort|offline|econn|enotfound/i;

/**
 * Phát hiện lỗi mạng mà không cần thêm dependency (NetInfo ngoài stack).
 * Mọi màn hình dùng hàm này để hiện thông báo offline + nút thử lại.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message =
    error instanceof Error ? error.message : String(error);
  return NETWORK_ERROR_PATTERN.test(message);
}
