/**
 * Hằng số và hàm thuần cho avatar FR-04.
 * DB chỉ lưu path (ví dụ `<uid>/avatar_1726579200000.jpg`), không lưu URL.
 * Quy ước path timestamp (quyết định chủ dự án G5): mỗi lần đổi avatar tạo
 * object mới, object cũ được xóa best-effort sau khi update DB thành công.
 */

export const AVATAR_BUCKET = 'avatars';

/** Giới hạn file sau nén theo SPEC (quyết định 5): 2 MB. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Cạnh dài ảnh sau resize: 512px, JPEG quality ~0.7. */
export const AVATAR_MAX_EDGE = 512;
export const AVATAR_JPEG_QUALITY = 0.7;

/** TTL signed URL: 3600s; cache React Query phải ngắn hơn TTL. */
export const AVATAR_SIGNED_URL_TTL_SECONDS = 3600;
export const AVATAR_URL_STALE_MS = 55 * 60 * 1000;

const ALLOWED_AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

/** Path object mới cho mỗi lần đổi avatar: `<userId>/avatar_<timestamp>.jpg`. */
export function buildAvatarPath(userId: string, timestampMs: number): string {
  return `${userId}/avatar_${timestampMs}.jpg`;
}

export function isAllowedAvatarMime(mime: string | null | undefined): boolean {
  if (!mime) {
    return false;
  }
  return ALLOWED_AVATAR_MIMES.includes(mime.toLowerCase());
}

/** Ước lượng số byte từ độ dài chuỗi base64 (bỏ padding). */
export function estimateBase64Bytes(base64Length: number): number {
  return Math.floor((base64Length * 3) / 4);
}

/**
 * Guard kích thước/định dạng ảnh sau nén.
 * Trả về message tiếng Việt khi bị chặn, null khi hợp lệ.
 */
export function validateAvatarFile(input: {
  mime: string | null | undefined;
  sizeBytes: number;
}): string | null {
  if (!isAllowedAvatarMime(input.mime)) {
    return 'Chỉ nhận ảnh JPEG, PNG hoặc WEBP.';
  }

  if (input.sizeBytes > AVATAR_MAX_BYTES) {
    return 'Ảnh sau nén vẫn quá 2 MB. Hãy chọn ảnh nhỏ hơn.';
  }

  return null;
}
