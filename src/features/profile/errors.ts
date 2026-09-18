import { isNetworkError } from '../../lib/network';

type CodedError = {
  code?: string;
};

/**
 * FR-04: chuyển lỗi Supabase khi cập nhật profile sang tiếng Việt.
 * Unique violation của student_code (Postgres 23505) thành câu dễ hiểu,
 * không bao giờ đổ raw error ra UI.
 */
export function toProfileErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as CodedError).code
      : undefined;
  const message = error instanceof Error ? error.message : '';

  if (
    code === '23505' ||
    /duplicate key value/i.test(message) ||
    /student_code/i.test(message)
  ) {
    return 'Mã sinh viên này đã được sử dụng. Vui lòng dùng mã khác.';
  }

  return 'Không thể cập nhật hồ sơ. Vui lòng thử lại.';
}

/**
 * Lỗi upload/signed URL avatar sang tiếng Việt.
 * Bucket private nên lỗi quyền/policy cũng chỉ hiện câu chung an toàn.
 */
export function toAvatarErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  return 'Không thể tải ảnh lên. Vui lòng thử lại.';
}
