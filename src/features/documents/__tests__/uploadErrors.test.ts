import { describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';

import { uploadDocument } from '../api';
import {
  DocumentGuardError,
  getDocumentsErrorCode,
  toDocumentsErrorMessage,
} from '../errors';
import {
  validateDocumentCount,
  validatePickedFile,
} from '../storage';

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid',
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
}));

jest.mock('base64-arraybuffer', () => ({
  decode: jest.fn(),
}));

jest.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

/** Shape lỗi Storage thật của supabase-js v2 (status số + statusCode). */
function storageError(status: number) {
  return {
    error: 'Storage error',
    message: status === 403 ? 'Access denied' : 'Not found',
    status,
    statusCode: String(status),
  };
}

describe('toDocumentsErrorMessage — nhóm lỗi upload', () => {
  it('403 thiếu quyền báo riêng, có mã 403', () => {
    const message = toDocumentsErrorMessage(storageError(403));
    expect(message).toContain('403');
    expect(message).toContain('quyền');
  });

  it('404 bucket báo riêng, có mã 404', () => {
    const message = toDocumentsErrorMessage(storageError(404));
    expect(message).toContain('404');
    expect(message).not.toBe(
      'Đã có lỗi xảy ra với tài liệu. Vui lòng thử lại.',
    );
  });

  it('vượt trần 100 giữ câu guard', () => {
    const guard = validateDocumentCount(100);
    expect(guard).not.toBeNull();
    expect(toDocumentsErrorMessage(new DocumentGuardError(guard as string))).toContain(
      '100',
    );
  });

  it('sai định dạng giữ câu guard whitelist', () => {
    const guard = validatePickedFile({
      mimeType: 'application/zip',
      name: 'tai-lieu.zip',
      size: 225,
      uri: 'file:///cache/tai-lieu.zip',
    });
    expect(guard).not.toBeNull();
    expect(toDocumentsErrorMessage(new DocumentGuardError(guard as string))).toContain(
      'PDF',
    );
  });
});

describe('getDocumentsErrorCode — mã ngắn cho banner __DEV__', () => {
  it('phản ánh đúng status/mạng/guard/lạ', () => {
    expect(getDocumentsErrorCode(storageError(403))).toBe('E_STORAGE_403');
    expect(getDocumentsErrorCode(storageError(404))).toBe('E_STORAGE_404');
    expect(getDocumentsErrorCode(new Error('Network request failed'))).toBe(
      'E_NETWORK',
    );
    expect(getDocumentsErrorCode(new DocumentGuardError('x'))).toBe('E_GUARD');
    expect(getDocumentsErrorCode(new Error('lỗi lạ'))).toBe('E_UNKNOWN');
  });
});

describe('uploadDocument — chặn web sớm', () => {
  it('Platform.OS web ném guard Expo Go trước mọi guard khác', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    try {
      await expect(
        uploadDocument({
          asset: {
            mimeType: 'text/plain',
            name: 'ghi-chu.txt',
            size: 225,
            uri: 'file:///cache/ghi-chu.txt',
          },
          userId: 'user-1',
        }),
      ).rejects.toThrow('Expo Go');
    } finally {
      jest.restoreAllMocks();
    }
  });
});
