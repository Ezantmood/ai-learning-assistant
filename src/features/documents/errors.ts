import { isNetworkError } from '../../shared/lib/network';

/**
 * Lỗi guard (validate ext/MIME/size/trần số lượng) đã là tiếng Việt nên
 * hiển thị trực tiếp; lỗi hạ tầng (mạng, Supabase) được chuẩn hóa trước
 * khi hiển thị, không lộ chi tiết kỹ thuật.
 */
export class DocumentGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentGuardError';
  }
}

/**
 * Chuẩn hóa lỗi documents sang tiếng Việt trước khi hiển thị.
 */
export function toDocumentsErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  if (error instanceof DocumentGuardError) {
    return error.message;
  }

  return 'Đã có lỗi xảy ra với tài liệu. Vui lòng thử lại.';
}
