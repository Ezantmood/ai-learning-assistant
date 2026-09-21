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
 * Đọc HTTP status số từ `StorageApiError` thật của supabase-js v2
 * (`status: number`, dự phòng `statusCode` chuỗi số). Trả null khi
 * không phải shape này — CẤM đoán nhóm lỗi từ message.
 */
export function getStorageHttpStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const record = error as Record<string, unknown>;
  if (typeof record.status === 'number') {
    return record.status;
  }
  if (typeof record.statusCode === 'number') {
    return record.statusCode;
  }
  if (
    typeof record.statusCode === 'string' &&
    record.statusCode !== '' &&
    Number.isInteger(Number(record.statusCode))
  ) {
    return Number(record.statusCode);
  }
  return null;
}

/**
 * Đọc mã lỗi chuỗi (`code`) của PostgrestError/API phía server. Chuỗi này
 * server trả nguyên văn trong body (postgrest-js/storage-js không chế),
 * nên có thể gặp mã không chuẩn SQLSTATE — caller tự quyết map theo pattern.
 */
export function getDbCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const code = (error as Record<string, unknown>).code;
  if (typeof code !== 'string' || code.trim() === '') {
    return null;
  }
  return code;
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

  const status = getStorageHttpStatus(error);
  if (status === 403) {
    return 'Không có quyền tải lên (lỗi 403). Kiểm tra đăng nhập rồi thử lại.';
  }
  if (status === 404) {
    return 'Không tìm thấy kho lưu trữ (lỗi 404). Báo chủ dự án kiểm tra bucket documents.';
  }

  // Từ chối phân quyền ở tầng DB: mã chuẩn Postgres 42501
  // (insufficient_privilege — RLS WITH CHECK trượt) hoặc mã server chứa
  // 'permis' (ghi cả biến thể sai chính tả từng gặp trên máy thật).
  const dbCode = getDbCode(error);
  if (dbCode === '42501' || (dbCode !== null && /permis/i.test(dbCode))) {
    return 'Không có quyền ghi tài liệu (lỗi phân quyền). Kiểm tra đăng nhập rồi thử lại.';
  }

  return 'Đã có lỗi xảy ra với tài liệu. Vui lòng thử lại.';
}

/**
 * Mã lỗi ngắn cho banner debug (`__DEV__`): phản ánh đúng field có thật
 * trong error (`status`/`code`), không bịa nhóm.
 */
export function getDocumentsErrorCode(error: unknown): string {
  if (isNetworkError(error)) {
    return 'E_NETWORK';
  }
  if (error instanceof DocumentGuardError) {
    return 'E_GUARD';
  }
  if (error instanceof DocumentDeletePartialError) {
    return 'E_DELETE_PARTIAL';
  }
  const status = getStorageHttpStatus(error);
  if (status !== null) {
    return `E_STORAGE_${status}`;
  }
  const dbCode = getDbCode(error);
  if (dbCode !== null) {
    // Chuẩn hóa chính tả khi hiển thị: họ phân quyền luôn là
    // PERMISSION_DENIED dù server có trả biến thể sai chính tả.
    // Object gốc giữ nguyên cho console.error.
    if (dbCode === '42501' || /permis/i.test(dbCode)) {
      return 'E_DB_PERMISSION_DENIED';
    }
    return `E_DB_${dbCode}`;
  }
  return 'E_UNKNOWN';
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
