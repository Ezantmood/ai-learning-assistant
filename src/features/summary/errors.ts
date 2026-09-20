import { isNetworkError } from '../../shared/lib/network';
import {
  GeminiConfigError,
  GeminiError,
  GeminiNetworkError,
  GeminiQuotaError,
  GeminiServerError,
} from '../../lib/ai/transport';

/**
 * Lỗi guard CN3 (quyền sở hữu, DOCX, vượt ngưỡng, gọi lặp, input rỗng)
 * đã là tiếng Việt nên hiển thị trực tiếp; lỗi hạ tầng (mạng, Gemini,
 * Supabase) được chuẩn hóa trước khi hiển thị, không lộ chi tiết kỹ thuật
 * và không bao giờ lộ API key.
 */
export class SummaryGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SummaryGuardError';
  }
}

/** Chuẩn hóa mọi lỗi tóm tắt sang tiếng Việt trước khi hiển thị ở G2. */
export function toSummaryErrorMessage(error: unknown): string {
  if (error instanceof SummaryGuardError) {
    return error.message;
  }

  if (error instanceof GeminiQuotaError) {
    return error.message;
  }

  if (error instanceof GeminiConfigError) {
    return error.message;
  }

  if (error instanceof GeminiNetworkError || isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }

  if (error instanceof GeminiServerError) {
    return error.message;
  }

  if (error instanceof GeminiError) {
    return error.message;
  }

  return 'Không tạo được bản tóm tắt. Hãy thử lại.';
}
