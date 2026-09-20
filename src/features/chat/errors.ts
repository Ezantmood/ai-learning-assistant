import { isNetworkError } from '../../shared/lib/network';
import {
  GeminiConfigError,
  GeminiError,
  GeminiNetworkError,
  GeminiQuotaError,
  GeminiServerError,
} from '../../lib/ai/transport';

/**
 * Lỗi guard CN4 (quyền sở hữu, DOCX, chưa có extracted_text, câu hỏi
 * sai) đã là tiếng Việt nên hiển thị trực tiếp; lỗi hạ tầng (mạng,
 * Gemini, Supabase) được chuẩn hóa trước khi hiển thị, không lộ chi
 * tiết kỹ thuật và không bao giờ lộ API key.
 */
export class ChatGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatGuardError';
  }
}

/** Chuẩn hóa mọi lỗi hỏi đáp sang tiếng Việt trước khi hiển thị. */
export function toChatErrorMessage(error: unknown): string {
  if (error instanceof ChatGuardError) {
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

  return 'Không trả lời được câu hỏi. Hãy thử lại.';
}

/**
 * UI dùng để quyết định hiện banner hạn mức (429/quota, CẤM retry)
 * thay vì khối lỗi thường kèm nút “Thử lại”.
 */
export function isChatQuotaError(error: unknown): boolean {
  return error instanceof GeminiQuotaError;
}
