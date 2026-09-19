/**
 * Hằng số và hàm thuần cho tài liệu CN2 (FR-06 → FR-08).
 * Mọi guard chạy TRƯỚC khi đọc nội dung tệp; thứ tự kiểm tra khi chọn tệp:
 * tồn tại tệp → phần mở rộng → MIME → kích thước (dừng ở lỗi đầu tiên).
 * DB chỉ lưu path `{user_id}/{uuid}.{ext}`, không lưu URL.
 */

export const DOCUMENTS_BUCKET = 'documents';

/** Giới hạn file theo SPEC CN2: 10 MB = 10 × 1024 × 1024 byte. */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Trần số lượng mỗi user (lý do: free tier 1 GB, mỗi tệp tới 10 MB). */
export const MAX_DOCUMENTS_PER_USER = 100;
export const MAX_SUBJECTS_PER_USER = 30;

/** TTL signed URL xem/tải: 3600s (dùng từ màn chi tiết G2). */
export const DOCUMENT_SIGNED_URL_TTL_SECONDS = 3600;

export type DocumentFileExt = 'pdf' | 'docx' | 'txt';

export const ALLOWED_DOCUMENT_EXTS: readonly DocumentFileExt[] = [
  'pdf',
  'docx',
  'txt',
];

export const EXT_TO_MIME: Record<DocumentFileExt, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  txt: 'text/plain',
};

export type ExtractionStatus =
  | 'pending'
  | 'processing'
  | 'done'
  | 'failed'
  | 'unsupported';

/** Status lưu ascii trong DB, map sang tiếng Việt ở UI. */
export const EXTRACTION_STATUS_LABELS: Record<ExtractionStatus, string> = {
  done: 'Thành công',
  failed: 'Thất bại',
  pending: 'Chưa xử lý',
  processing: 'Đang xử lý',
  unsupported: 'Không hỗ trợ',
};

export function getExtractionStatusLabel(status: string): string {
  const label: string | undefined =
    EXTRACTION_STATUS_LABELS[status as ExtractionStatus];
  return label ?? 'Không rõ';
}

/** PDF/TXT chờ CN3 trích xuất; DOCX gắn `unsupported` ngay khi upload. */
export function getExtractionStatusForExt(
  ext: DocumentFileExt,
): ExtractionStatus {
  return ext === 'docx' ? 'unsupported' : 'pending';
}

/** Lấy phần mở rộng từ tên tệp gốc, lowercase; không có thì chuỗi rỗng. */
export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot < 0 || dot === fileName.length - 1) {
    return '';
  }
  return fileName.slice(dot + 1).toLowerCase();
}

export function isAllowedExtension(ext: string): ext is DocumentFileExt {
  return (ALLOWED_DOCUMENT_EXTS as readonly string[]).includes(ext);
}

/** MIME phải tương ứng với phần mở rộng, lệch thì từ chối. */
export function mimeMatchesExt(
  mime: string | null | undefined,
  ext: DocumentFileExt,
): boolean {
  if (!mime) {
    return false;
  }
  return mime.toLowerCase() === EXT_TO_MIME[ext];
}

export type PickedDocumentInput = {
  mimeType: string | null | undefined;
  name: string;
  size: number | null | undefined;
  uri: string | null | undefined;
};

/**
 * Guard tệp đã chọn. Trả về message tiếng Việt khi bị chặn, null khi hợp lệ.
 * `size` null (picker không báo) thì bỏ qua guard kích thước — bucket giới
 * hạn 10 MB ở server vẫn chặn trường hợp vượt.
 */
export function validatePickedFile(
  file: PickedDocumentInput | null | undefined,
): string | null {
  if (!file || !file.uri || !file.name) {
    return 'Không đọc được tệp đã chọn. Hãy thử chọn lại.';
  }

  const ext = getFileExtension(file.name);
  if (!ext || !isAllowedExtension(ext)) {
    return 'Định dạng tệp không được hỗ trợ. Chỉ nhận PDF, DOCX, TXT.';
  }

  if (!mimeMatchesExt(file.mimeType, ext)) {
    return 'Loại tệp không khớp với phần mở rộng. Chỉ nhận PDF, DOCX, TXT.';
  }

  if (file.size != null && file.size > DOCUMENT_MAX_BYTES) {
    return `Tệp vượt quá 10 MB (${formatFileSize(file.size)}). Hãy chọn tệp nhỏ hơn.`;
  }

  return null;
}

/** Guard trần 100 tài liệu: count trước khi insert, vượt thì chặn. */
export function validateDocumentCount(count: number): string | null {
  if (count >= MAX_DOCUMENTS_PER_USER) {
    return `Bạn đã đạt giới hạn ${MAX_DOCUMENTS_PER_USER} tài liệu. Hãy xóa bớt trước khi tải thêm.`;
  }
  return null;
}

/**
 * Dựng path object `{user_id}/{uuid}.{ext}`.
 * `uuid` do `Crypto.randomUUID()` của expo-crypto sinh (cấm crypto toàn cục
 * vì Hermes không đảm bảo có). Tên gốc có dấu/khoảng trắng nên không dùng
 * làm tên object — chỉ lưu ở `display_name`.
 */
export function buildStoragePath(
  userId: string,
  uuid: string,
  ext: DocumentFileExt,
): string {
  return `${userId}/${uuid}.${ext}`;
}

const STORAGE_PATH_PATTERN =
  /^[^/]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|docx|txt)$/;

/** Kiểm tra path có đúng định dạng `{user_id}/{uuid}.{ext}` không. */
export function isStoragePathValid(path: string): boolean {
  return STORAGE_PATH_PATTERN.test(path);
}

/** Ước lượng số byte từ độ dài chuỗi base64 (bỏ padding). */
export function estimateBase64Bytes(base64Length: number): number {
  return Math.floor((base64Length * 3) / 4);
}

/** Định dạng dung lượng cho FR-08/FR-09: B/KB/MB. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${trimDecimal(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${trimDecimal(mb)} MB`;
}

function trimDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
