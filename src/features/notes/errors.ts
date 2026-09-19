import { isNetworkError } from '../../shared/lib/network';

/**
 * Chuẩn hóa lỗi notes sang tiếng Việt trước khi hiển thị.
 * Không lộ nội dung row hay chi tiết RLS.
 */
export function toNotesErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  const message = error instanceof Error ? error.message : '';

  if (/note not found|pgrst116|no rows/i.test(message)) {
    return 'Không tìm thấy ghi chú (có thể đã bị xóa hoặc bạn không có quyền xem).';
  }

  return 'Đã có lỗi xảy ra với ghi chú. Vui lòng thử lại.';
}
