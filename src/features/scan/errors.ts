import { isNetworkError } from '../../shared/lib/network';

export class ScanGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScanGuardError';
  }
}

export function toScanErrorMessage(error: unknown): string {
  if (error instanceof ScanGuardError) {
    return error.message;
  }
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }
  return 'Không mở được ảnh hoặc camera. Hãy thử lại.';
}
