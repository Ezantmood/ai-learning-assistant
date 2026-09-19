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
 * Xóa storage xong nhưng xóa bản ghi DB thất bại: object đã biến mất,
 * bản ghi còn lại đang trỏ vào hư không. CẤM nuốt im lặng — ném lỗi này
 * để UI báo rõ và cho người dùng thử lại xóa bản ghi.
 */
export class DocumentDeletePartialError extends Error {
  readonly documentId: string;

  constructor(documentId: string) {
    super(
      'Đã xóa tệp trên kho lưu trữ nhưng chưa xóa được bản ghi. Hãy thử lại thao tác xóa để đồng bộ.',
    );
    this.name = 'DocumentDeletePartialError';
    this.documentId = documentId;
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

  if (error instanceof DocumentDeletePartialError) {
    return error.message;
  }

  return 'Đã có lỗi xảy ra với tài liệu. Vui lòng thử lại.';
}

/**
 * Chuẩn hóa lỗi môn học sang tiếng Việt. Trùng tên đúng hoa/thường do
 * Postgres báo 23505 thì map sang câu rõ ràng, không lộ raw error.
 */
export function toSubjectsErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  if (error instanceof DocumentGuardError) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  ) {
    return 'Tên môn học đã tồn tại. Hãy chọn tên khác.';
  }

  return 'Đã có lỗi xảy ra với môn học. Vui lòng thử lại.';
}

/**
 * Lỗi nút “Mở tài liệu”: signed URL lỗi, thiết bị không mở được link,
 * hoặc không có app xử lý định dạng này.
 */
export function toOpenDocumentErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không tải được liên kết tệp (lỗi mạng). Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  if (error instanceof DocumentGuardError) {
    return error.message;
  }

  return 'Không mở được tài liệu trên thiết bị này. Hãy thử lại hoặc mở bằng ứng dụng khác.';
}
