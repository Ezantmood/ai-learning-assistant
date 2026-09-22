import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { ScanGuardError } from './errors';
import { toScanImage, validateScanAsset, type ScanImage } from './schemas';

export type ScanPickOutcome =
  | { status: 'ready'; image: ScanImage }
  | { status: 'cancelled' }
  | { status: 'denied'; canAskAgain: boolean };

function fromPickerResult(
  result: ImagePicker.ImagePickerResult,
  source: 'camera' | 'library',
): ScanPickOutcome {
  if (result.canceled) {
    return { status: 'cancelled' };
  }
  const asset = result.assets[0];
  if (!asset) {
    throw new ScanGuardError('Không nhận được ảnh. Hãy chọn hoặc chụp lại.');
  }
  const error = validateScanAsset(asset, source);
  if (error) {
    throw new ScanGuardError(error);
  }
  return { image: toScanImage(asset), status: 'ready' };
}

export async function pickScanImage(): Promise<ScanPickOutcome> {
  const result = await ImagePicker.launchImageLibraryAsync({
    base64: true,
    mediaTypes: ['images'],
  });
  return fromPickerResult(result, 'library');
}

export async function captureScanImage(): Promise<ScanPickOutcome> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { canAskAgain: permission.canAskAgain, status: 'denied' };
  }
  const result = await ImagePicker.launchCameraAsync({
    base64: true,
    mediaTypes: ['images'],
  });
  return fromPickerResult(result, 'camera');
}

/** Call once on Android screen mount after activity recreation. */
export async function recoverPendingScanImage(): Promise<ScanPickOutcome | null> {
  if (Platform.OS !== 'android') {
    return null;
  }
  const result = await ImagePicker.getPendingResultAsync();
  if (!result) {
    return null;
  }
  if ('code' in result) {
    throw new ScanGuardError('Không khôi phục được ảnh vừa chụp. Hãy thử lại.');
  }
  return fromPickerResult(result, 'camera');
}
