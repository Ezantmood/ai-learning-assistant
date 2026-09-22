import { isNetworkError } from '../../shared/lib/network';
import {
  GeminiConfigError, GeminiError, GeminiNetworkError,
  GeminiQuotaError, GeminiServerError,
} from '../../lib/ai/transport';

export class SolverGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SolverGuardError';
  }
}

export class SolverTruncatedError extends Error {
  constructor() {
    super('Gợi ý bị cắt cụt. Phần đã lưu chỉ là một phần lời giải; hãy thử với tài liệu ngắn hơn.');
    this.name = 'SolverTruncatedError';
  }
}

export function toSolverErrorMessage(error: unknown): string {
  if (error instanceof GeminiNetworkError || isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }
  if (error instanceof SolverGuardError || error instanceof SolverTruncatedError ||
      error instanceof GeminiQuotaError || error instanceof GeminiConfigError ||
      error instanceof GeminiServerError || error instanceof GeminiError) {
    return error.message;
  }
  return 'Không tạo được gợi ý lời giải. Hãy thử lại.';
}

export function isSolverQuotaError(error: unknown): boolean {
  return error instanceof GeminiQuotaError;
}
