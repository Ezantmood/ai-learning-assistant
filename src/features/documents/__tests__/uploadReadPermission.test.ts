import { describe, expect, it, jest } from '@jest/globals';

import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import { supabase } from '../../../shared/lib/supabase';
import { pickDocument, uploadDocument } from '../api';
import {
  DocumentFileReadError,
  getDocumentsErrorCode,
  isFileSystemError,
  toDocumentsErrorMessage,
} from '../errors';

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

const TXT_ASSET = {
  mimeType: 'text/plain',
  name: 'ghi-chu.txt',
  size: 225,
  uri: 'file:///cache/DocumentPicker/ghi-chu.txt',
};

/** Lỗi thật trên Expo Go: chết ở bước đọc file local, chưa chạm Supabase. */
function realExpoGoReadError() {
  return new Error(
    "Call to function 'FileSystemFile.base64' has been rejected. → Caused by: Missing 'READ' permission for accessing the file.",
  );
}

function mockCountZero() {
  (supabase.from as unknown as jest.Mock).mockReturnValue({
    insert: () => ({
      select: () => ({
        single: () => ({
          data: {
            display_name: 'ghi-chu.txt',
            file_ext: 'txt',
            file_size: 225,
            id: 'doc-1',
            storage_path: 'user-1/mock-uuid.txt',
          },
          error: null,
        }),
      }),
    }),
    select: () => ({ eq: () => ({ count: 0, error: null }) }),
  });
}

describe('uploadReadPermission — lỗi đọc file local KHÔNG ra nhãn DB', () => {
  it('raw FileSystemFile.base64 lỗi READ → nhãn filesystem, không phải E_DB_*', () => {
    const error = realExpoGoReadError();
    expect(isFileSystemError(error)).toBe(true);
    expect(getDocumentsErrorCode(error)).toBe('E_FILE_READ');
    expect(getDocumentsErrorCode(error).startsWith('E_DB_')).toBe(false);
    const message = toDocumentsErrorMessage(error);
    expect(message).toContain('thiết bị');
    expect(message).not.toContain('quyền ghi tài liệu');
  });

  it('DocumentFileReadError → đúng message + mã E_FILE_READ', () => {
    const error = new DocumentFileReadError();
    expect(toDocumentsErrorMessage(error)).toContain('thiết bị');
    expect(getDocumentsErrorCode(error)).toBe('E_FILE_READ');
  });

  it('4 nhóm lỗi ra 4 thông điệp khác nhau', () => {
    const filesystemMsg = toDocumentsErrorMessage(realExpoGoReadError());
    const networkMsg = toDocumentsErrorMessage(
      new Error('Network request failed'),
    );
    const storageMsg = toDocumentsErrorMessage({
      message: 'Access denied',
      status: 403,
      statusCode: '403',
    });
    const dbMsg = toDocumentsErrorMessage({
      code: '42501',
      message: 'permission denied for table documents',
    });
    const unique = new Set([filesystemMsg, networkMsg, storageMsg, dbMsg]);
    expect(unique.size).toBe(4);
  });

  it('uploadDocument bọc lỗi READ thành DocumentFileReadError', async () => {
    (File as unknown as jest.Mock).mockImplementation(() => ({
      base64: () => Promise.reject(realExpoGoReadError()),
      delete: jest.fn(),
    }));
    mockCountZero();

    const error = await uploadDocument({
      asset: TXT_ASSET,
      userId: 'user-1',
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DocumentFileReadError);
    expect(getDocumentsErrorCode(error)).toBe('E_FILE_READ');
    expect(toDocumentsErrorMessage(error)).toContain('thiết bị');
  });
});

describe('uploadReadPermission — ca upload .txt 225 B thành công', () => {
  it('đọc base64 từ URI cache → ArrayBuffer + contentType text/plain', async () => {
    const deleteMock = jest.fn();
    (File as unknown as jest.Mock).mockImplementation(
      (...args: unknown[]) => {
        // Đọc đúng URI cache mà picker trả về, không đọc URI gốc provider.
        expect(args[0]).toBe(TXT_ASSET.uri);
        return {
          base64: () => Promise.resolve('aGVsbG8='),
          delete: deleteMock,
        };
      },
    );
    (decode as unknown as jest.Mock).mockReturnValue(new ArrayBuffer(8));
    mockCountZero();

    const uploadMock = jest.fn(() =>
      Promise.resolve({ data: { path: 'user-1/mock-uuid.txt' }, error: null }),
    );
    (
      supabase.storage as unknown as { from: jest.Mock }
    ).from.mockReturnValue({ remove: jest.fn(), upload: uploadMock });

    const row = await uploadDocument({ asset: TXT_ASSET, userId: 'user-1' });
    expect(row.storage_path).toBe('user-1/mock-uuid.txt');
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const uploadArgs = uploadMock.mock.calls[0] as unknown[];
    expect(uploadArgs[1]).toBeInstanceOf(ArrayBuffer);
    expect(uploadArgs[2]).toMatchObject({
      contentType: 'text/plain',
    });
    // Dọn cache sau khi upload xong.
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});

describe('uploadReadPermission — dọn cache best-effort', () => {
  it('lỗi dọn cache không làm hỏng kết quả upload', async () => {
    (File as unknown as jest.Mock).mockImplementation(() => ({
      base64: () => Promise.resolve('aGVsbG8='),
      delete: () => {
        throw new Error('cache busy');
      },
    }));
    (decode as unknown as jest.Mock).mockReturnValue(new ArrayBuffer(8));
    mockCountZero();

    const uploadMock = jest.fn(() =>
      Promise.resolve({ data: { path: 'user-1/mock-uuid.txt' }, error: null }),
    );
    (
      supabase.storage as unknown as { from: jest.Mock }
    ).from.mockReturnValue({ remove: jest.fn(), upload: uploadMock });

    const row = await uploadDocument({ asset: TXT_ASSET, userId: 'user-1' });
    expect(row.storage_path).toBe('user-1/mock-uuid.txt');
  });

  it('pickDocument giữ copyToCacheDirectory: true để lấy URI cache', async () => {
    const pickerMock = jest.requireMock('expo-document-picker') as {
      getDocumentAsync: unknown;
    };
    const getDocumentAsync = pickerMock.getDocumentAsync as jest.Mock;
    (getDocumentAsync as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      assets: [
        {
          mimeType: 'text/plain',
          name: 'ghi-chu.txt',
          size: 225,
          uri: TXT_ASSET.uri,
        },
      ],
      canceled: false,
    });

    const asset = await pickDocument();
    expect(getDocumentAsync).toHaveBeenCalledWith(
      expect.objectContaining({ copyToCacheDirectory: true }),
    );
    expect(asset?.uri).toBe(TXT_ASSET.uri);
  });
});
