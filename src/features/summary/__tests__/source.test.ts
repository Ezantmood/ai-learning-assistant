import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { File } from 'expo-file-system';
import { supabase } from '../../../shared/lib/supabase';
import { loadSummarySource } from '../source';

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
  Paths: { cache: { uri: 'file:///cache' } },
}));

jest.mock('../../../shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

const FileMock = File as unknown as jest.Mock & {
  downloadFileAsync: jest.Mock;
};
const downloadFileAsyncMock = jest.fn<
  (...args: unknown[]) => Promise<unknown>
>();
FileMock.downloadFileAsync = downloadFileAsyncMock;

function mockSignedUrl(
  result: { signedUrl?: string; error?: unknown },
) {
  const storageFrom = (
    supabase.storage as unknown as { from: jest.Mock }
  ).from;
  (storageFrom as jest.Mock).mockReturnValue({
    createSignedUrl: jest.fn(async () => ({
      data: result.signedUrl ? { signedUrl: result.signedUrl } : null,
      error: result.error ?? null,
    })),
  });
  return storageFrom as jest.Mock;
}

function mockDownloaded(file: {
  base64?: () => Promise<string>;
  delete?: () => void;
  exists?: boolean;
  text?: () => Promise<string>;
}) {
  const deleteMock = jest.fn(file.delete ?? (() => undefined));
  const downloaded = {
    base64: file.base64 ?? (async () => ''),
    delete: deleteMock,
    exists: file.exists ?? true,
    text: file.text ?? (async () => ''),
  };
  downloadFileAsyncMock.mockResolvedValue(downloaded);
  return downloaded;
}

beforeEach(() => {
  jest.clearAllMocks();
  FileMock.downloadFileAsync = downloadFileAsyncMock;
});

describe('loadSummarySource — PDF thành công', () => {
  it('tạo signed URL 3600s → download về cache → base64, rồi dọn file tạm', async () => {
    const storageFrom = mockSignedUrl({ signedUrl: 'https://signed/pdf' });
    const downloaded = mockDownloaded({
      base64: async () => 'AAAABBBB',
    });

    const source = await loadSummarySource({
      file_ext: 'pdf',
      id: 'doc-1',
      storage_path: 'user-1/uuid.pdf',
    });

    expect(source).toEqual({ base64Data: 'AAAABBBB', kind: 'pdf' });
    expect(storageFrom).toHaveBeenCalledWith('documents');
    const createSignedUrl = (
      (storageFrom as jest.Mock).mock.results[0]?.value as {
        createSignedUrl: jest.Mock;
      }
    ).createSignedUrl;
    expect(createSignedUrl).toHaveBeenCalledWith('user-1/uuid.pdf', 3600);
    expect(downloadFileAsyncMock).toHaveBeenCalledTimes(1);
    expect(downloaded.delete).toHaveBeenCalledTimes(1);
  });
});

describe('loadSummarySource — TXT thành công', () => {
  it('đọc text trực tiếp (trim), không base64', async () => {
    mockSignedUrl({ signedUrl: 'https://signed/txt' });
    let base64Called = false;
    mockDownloaded({
      base64: async () => {
        base64Called = true;
        return 'không bao giờ dùng';
      },
      text: async () => '  Nội dung bài học.  ',
    });

    const source = await loadSummarySource({
      file_ext: 'txt',
      id: 'doc-2',
      storage_path: 'user-1/uuid.txt',
    });

    expect(source).toEqual({ kind: 'txt', textContent: 'Nội dung bài học.' });
    expect(base64Called).toBe(false);
  });
});

describe('loadSummarySource — chặn và lỗi', () => {
  it('DOCX bị chặn trước khi chạm mạng, KHÔNG tạo signed URL', async () => {
    const storageFrom = mockSignedUrl({ signedUrl: 'https://signed/docx' });

    await expect(
      loadSummarySource({
        file_ext: 'docx',
        id: 'doc-3',
        storage_path: 'user-1/uuid.docx',
      }),
    ).rejects.toThrow('DOCX');
    expect(storageFrom).not.toHaveBeenCalled();
    expect(downloadFileAsyncMock).not.toHaveBeenCalled();
  });

  it('signed URL lỗi → câu rõ ràng', async () => {
    mockSignedUrl({ error: new Error('storage down') });

    await expect(
      loadSummarySource({
        file_ext: 'pdf',
        id: 'doc-1',
        storage_path: 'user-1/uuid.pdf',
      }),
    ).rejects.toThrow('Không tải được tệp');
    expect(downloadFileAsyncMock).not.toHaveBeenCalled();
  });

  it('mất mạng lúc download → câu offline', async () => {
    mockSignedUrl({ signedUrl: 'https://signed/pdf' });
    downloadFileAsyncMock.mockRejectedValue(
      new Error('Network request failed'),
    );

    await expect(
      loadSummarySource({
        file_ext: 'pdf',
        id: 'doc-1',
        storage_path: 'user-1/uuid.pdf',
      }),
    ).rejects.toThrow('kết nối mạng');
  });

  it('TXT rỗng → từ chối, không trả text rỗng', async () => {
    mockSignedUrl({ signedUrl: 'https://signed/txt' });
    mockDownloaded({ text: async () => '   ' });

    await expect(
      loadSummarySource({
        file_ext: 'txt',
        id: 'doc-2',
        storage_path: 'user-1/uuid.txt',
      }),
    ).rejects.toThrow('rỗng');
  });

  it('dọn cache fail vẫn không làm hỏng kết quả (best-effort)', async () => {
    mockSignedUrl({ signedUrl: 'https://signed/pdf' });
    mockDownloaded({
      base64: async () => 'AAAABBBB',
      delete: () => {
        throw new Error('không xóa được');
      },
    });

    const source = await loadSummarySource({
      file_ext: 'pdf',
      id: 'doc-1',
      storage_path: 'user-1/uuid.pdf',
    });

    expect(source).toEqual({ base64Data: 'AAAABBBB', kind: 'pdf' });
  });
});
