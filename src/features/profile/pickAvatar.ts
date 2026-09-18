import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import {
  AVATAR_JPEG_QUALITY,
  AVATAR_MAX_EDGE,
  estimateBase64Bytes,
  isAllowedAvatarMime,
  validateAvatarFile,
} from './avatar';

export type PickAvatarOutcome =
  | { base64: string; status: 'ready' }
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { message: string; status: 'rejected' };

/**
 * Chọn + resize/nén avatar FR-04.
 * mediaTypes images, allowsEditing crop 1:1, cạnh dài ≤ 512px, JPEG ~0.7.
 * Từ chối quyền → 'denied' để UI hướng dẫn mở Settings (không Alert thô).
 */
export async function pickAndPrepareAvatar(): Promise<PickAvatarOutcome> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: 'denied' };
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ['images'],
    quality: AVATAR_JPEG_QUALITY,
  });

  if (picked.canceled) {
    return { status: 'cancelled' };
  }

  const asset = picked.assets[0];
  if (!asset) {
    return { status: 'cancelled' };
  }

  // Picker không luôn báo mimeType; output sau manipulate luôn là JPEG
  // nên chỉ chặn khi mime khai báo rõ và không hợp lệ.
  if (asset.mimeType && !isAllowedAvatarMime(asset.mimeType)) {
    return { message: 'Chỉ nhận ảnh JPEG, PNG hoặc WEBP.', status: 'rejected' };
  }

  const actions =
    asset.width > AVATAR_MAX_EDGE
      ? [{ resize: { width: AVATAR_MAX_EDGE } }]
      : [];

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    actions,
    {
      base64: true,
      compress: AVATAR_JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  if (!manipulated.base64) {
    return { message: 'Không đọc được ảnh đã chọn.', status: 'rejected' };
  }

  const sizeGuard = validateAvatarFile({
    mime: 'image/jpeg',
    sizeBytes: estimateBase64Bytes(manipulated.base64.length),
  });
  if (sizeGuard) {
    return { message: sizeGuard, status: 'rejected' };
  }

  return { base64: manipulated.base64, status: 'ready' };
}
