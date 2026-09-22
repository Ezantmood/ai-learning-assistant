import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { captureScanImage, pickScanImage, recoverPendingScanImage } from '../api';
import { ScanGuardError } from '../errors';
import { validateScanAsset } from '../schemas';

jest.mock('expo-image-picker', () => ({
  PermissionStatus: { DENIED: 'denied', GRANTED: 'granted' },
  getPendingResultAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));
jest.mock('../../../shared/lib/supabase', () => ({ supabase: {} }));

const library = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<typeof ImagePicker.launchImageLibraryAsync>;
const camera = ImagePicker.launchCameraAsync as jest.MockedFunction<typeof ImagePicker.launchCameraAsync>;
const permission = ImagePicker.requestCameraPermissionsAsync as jest.MockedFunction<typeof ImagePicker.requestCameraPermissionsAsync>;
const pending = ImagePicker.getPendingResultAsync as jest.MockedFunction<typeof ImagePicker.getPendingResultAsync>;

const jpegAsset = {
  base64: '/9j/AA==',
  fileName: 'de-bai.HEIC',
  height: 100,
  mimeType: 'image/heic',
  uri: 'file:///photo.heic',
  width: 100,
} satisfies ImagePicker.ImagePickerAsset;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scan image picker', () => {
  it('hủy thư viện im lặng, không lấy asset', async () => {
    library.mockResolvedValue({ assets: null, canceled: true });
    await expect(pickScanImage()).resolves.toEqual({ status: 'cancelled' });
    expect(library).toHaveBeenCalledWith({ base64: true, mediaTypes: ['images'] });
  });

  it('nhận HEIC gốc nhưng chuẩn hóa JPEG base64 thành .jpg/image/jpeg', async () => {
    library.mockResolvedValue({ assets: [jpegAsset], canceled: false });
    await expect(pickScanImage()).resolves.toMatchObject({
      image: { fileExt: 'jpg', mimeType: 'image/jpeg', uri: jpegAsset.uri },
      status: 'ready',
    });
  });

  it('từ chối GIF trước khi tạo ảnh quét', async () => {
    library.mockResolvedValue({ assets: [{ ...jpegAsset, fileName: 'bai.gif', mimeType: 'image/gif' }], canceled: false });
    await expect(pickScanImage()).rejects.toThrow(ScanGuardError);
    expect(validateScanAsset({ ...jpegAsset, fileName: 'bai.gif' }, 'library')).toContain('GIF');
  });

  it('chặn dữ liệu ảnh rỗng và ảnh quá 10 MB', () => {
    expect(validateScanAsset({ ...jpegAsset, base64: null }, 'camera')).toContain('Không đọc được ảnh');
    expect(validateScanAsset({ ...jpegAsset, base64: 'A'.repeat(14_000_000) }, 'camera')).toContain('10 MB');
  });

  it('xin quyền camera trước khi mở; từ chối vĩnh viễn trả canAskAgain false', async () => {
    permission.mockResolvedValue({ canAskAgain: false, expires: 'never', granted: false, status: ImagePicker.PermissionStatus.DENIED });
    await expect(captureScanImage()).resolves.toEqual({ canAskAgain: false, status: 'denied' });
    expect(camera).not.toHaveBeenCalled();
  });

  it('được cấp quyền mới mở camera với base64', async () => {
    permission.mockResolvedValue({ canAskAgain: true, expires: 'never', granted: true, status: ImagePicker.PermissionStatus.GRANTED });
    camera.mockResolvedValue({ assets: [jpegAsset], canceled: false });
    await expect(captureScanImage()).resolves.toMatchObject({ status: 'ready' });
    expect(camera).toHaveBeenCalledWith({ base64: true, mediaTypes: ['images'] });
  });

  it('cứu ảnh pending trên Android sau khi activity bị kill', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    pending.mockResolvedValue({ assets: [jpegAsset], canceled: false });
    try {
      await expect(recoverPendingScanImage()).resolves.toMatchObject({ status: 'ready' });
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
    }
  });
});
