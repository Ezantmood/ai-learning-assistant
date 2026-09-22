import { isNetworkError } from '../../shared/lib/network';
import {
  GeminiConfigError,
  GeminiEmptyError,
  GeminiError,
  GeminiNetworkError,
  GeminiQuotaError,
  GeminiServerError,
} from '../../lib/ai/transport';

export class ScanGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScanGuardError';
  }
}

export class ScanTruncatedError extends Error {
  readonly extractedText: string;

  constructor(extractedText: string) {
    super('Nội dung trong ảnh bị cắt cụt. Phần chữ đã đọc được đã được lưu; hãy quét ảnh rõ hơn để có đầy đủ.');
    this.name = 'ScanTruncatedError';
    this.extractedText = extractedText;
  }
}

export function isScanQuotaError(error: unknown): boolean {
  return error instanceof GeminiQuotaError;
}

export function toScanErrorMessage(error: unknown): string {
  if (error instanceof ScanGuardError) {
    return error.message;
  }
  if (error instanceof ScanTruncatedError) {
    return error.message;
  }
  if (error instanceof GeminiEmptyError) {
    return 'AI không đọc được chữ trong ảnh. Hãy chụp ảnh rõ hơn hoặc chọn đề bài khác.';
  }
  if (error instanceof GeminiConfigError || error instanceof GeminiQuotaError || error instanceof GeminiServerError) {
    if (error instanceof GeminiServerError && error.status === 503) {
      return 'Máy chủ AI đang quá tải (503). Đợi một lát rồi bấm “Thử lại”.';
    }
    return error.message;
  }
  if (error instanceof GeminiNetworkError) {
    return error.message;
  }
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }
  if (error instanceof GeminiError) {
    return error.message;
  }
  return 'Không mở được ảnh hoặc camera. Hãy thử lại.';
}
