import type { ImagePickerAsset } from 'expo-image-picker';
import { z } from 'zod';

export const SCAN_MAX_BYTES = 10 * 1024 * 1024;

export const scanDisplayNameSchema = z.string()
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(1, 'Tên ảnh quét không được để trống.').max(120, 'Tên ảnh quét tối đa 120 ký tự.'));

const ALLOWED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif']);

export type ScanImage = {
  /** ImagePicker.base64 is always JPEG data, including an original HEIC. */
  base64: string;
  mimeType: 'image/jpeg';
  fileExt: 'jpg';
  sizeBytes: number;
  uri: string;
};

export function validateScanAsset(asset: ImagePickerAsset, source: 'camera' | 'library'): string | null {
  const mime = asset.mimeType?.toLowerCase();
  const ext = asset.fileName?.split('.').pop()?.toLowerCase();
  if (mime === 'image/gif' || ext === 'gif') {
    return 'Ảnh GIF không được hỗ trợ. Hãy chọn ảnh PNG, JPEG, WEBP hoặc HEIC.';
  }
  if (mime && !ALLOWED_MIMES.has(mime)) {
    return 'Định dạng ảnh không được hỗ trợ. Hãy chọn PNG, JPEG, WEBP hoặc HEIC.';
  }
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return 'Định dạng ảnh không được hỗ trợ. Hãy chọn PNG, JPEG, WEBP hoặc HEIC.';
  }
  if (source === 'library' && !mime && !ext) {
    return 'Không xác định được định dạng ảnh. Hãy chọn ảnh khác.';
  }
  if (!asset.base64) {
    return 'Không đọc được ảnh. Hãy chọn hoặc chụp lại.';
  }
  const sizeBytes = Math.floor((asset.base64.length * 3) / 4) -
    (asset.base64.endsWith('==') ? 2 : asset.base64.endsWith('=') ? 1 : 0);
  if (sizeBytes <= 0) {
    return 'Ảnh không có dữ liệu. Hãy chọn hoặc chụp lại.';
  }
  if (sizeBytes > SCAN_MAX_BYTES) {
    return 'Ảnh vượt quá 10 MB. Hãy chọn ảnh nhỏ hơn.';
  }
  return null;
}

export function toScanImage(asset: ImagePickerAsset): ScanImage {
  const base64 = asset.base64 as string;
  return {
    base64,
    fileExt: 'jpg',
    mimeType: 'image/jpeg',
    sizeBytes: Math.floor((base64.length * 3) / 4) -
      (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0),
    uri: asset.uri,
  };
}
