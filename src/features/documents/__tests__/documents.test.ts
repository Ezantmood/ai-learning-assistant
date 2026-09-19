import { describe, expect, it } from '@jest/globals';

import {
  DocumentGuardError,
  toDocumentsErrorMessage,
} from '../errors';
import { deriveDisplayName, normalizeDisplayName } from '../schemas';
import {
  DOCUMENT_MAX_BYTES,
  buildStoragePath,
  estimateBase64Bytes,
  formatFileSize,
  getExtractionStatusForExt,
  getExtractionStatusLabel,
  getFileExtension,
  isAllowedExtension,
  isStoragePathValid,
  mimeMatchesExt,
  validateDocumentCount,
  validatePickedFile,
} from '../storage';

describe('getFileExtension', () => {
  it('lowercase phần mở rộng', () => {
    expect(getFileExtension('Bai Giang.PDF')).toBe('pdf');
  });

  it('lấy sau dấu chấm cuối', () => {
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('tệp không có phần mở rộng bị từ chối', () => {
    expect(getFileExtension('README')).toBe('');
    expect(getFileExtension('tail.')).toBe('');
  });
});

describe('whitelist pdf/docx/txt + MIME', () => {
  it.each(['pdf', 'docx', 'txt'])('nhận ext %s', (ext) => {
    expect(isAllowedExtension(ext)).toBe(true);
  });

  it.each(['jpg', 'png', 'zip', 'pdfx', ''])('từ chối ext %s', (ext) => {
    expect(isAllowedExtension(ext)).toBe(false);
  });

  it('MIME phải tương ứng với ext', () => {
    expect(mimeMatchesExt('application/pdf', 'pdf')).toBe(true);
    expect(
      mimeMatchesExt(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'docx',
      ),
    ).toBe(true);
    expect(mimeMatchesExt('text/plain', 'txt')).toBe(true);
    expect(mimeMatchesExt('application/pdf', 'docx')).toBe(false);
    expect(mimeMatchesExt(null, 'pdf')).toBe(false);
  });
});

describe('validatePickedFile (thứ tự: tồn tại → ext → MIME → size)', () => {
  const valid = {
    mimeType: 'application/pdf',
    name: 'bai-1.pdf',
    size: 1024,
    uri: 'file:///cache/bai-1.pdf',
  };

  it('nhận tệp hợp lệ', () => {
    expect(validatePickedFile(valid)).toBeNull();
  });

  it('chặn ngay khi không đọc được tệp', () => {
    expect(validatePickedFile(null)).toContain('Không đọc được');
  });

  it('dừng ở lỗi ext dù size cũng vượt', () => {
    expect(
      validatePickedFile({
        ...valid,
        name: 'anh.png',
        size: DOCUMENT_MAX_BYTES + 1,
      }),
    ).toContain('Định dạng');
  });

  it('từ chối MIME lệch ext', () => {
    expect(
      validatePickedFile({ ...valid, mimeType: 'image/png' }),
    ).toContain('không khớp');
  });

  it('chặn tệp quá 10 MB trước khi đọc', () => {
    expect(
      validatePickedFile({ ...valid, size: DOCUMENT_MAX_BYTES + 1 }),
    ).toContain('10 MB');
  });

  it('nhận tệp đúng bằng 10 MB', () => {
    expect(
      validatePickedFile({ ...valid, size: DOCUMENT_MAX_BYTES }),
    ).toBeNull();
  });

  it('bỏ qua guard size khi picker không báo size', () => {
    expect(validatePickedFile({ ...valid, size: null })).toBeNull();
  });
});

describe('validateDocumentCount (trần 100)', () => {
  it('99 tài liệu vẫn được tải thêm', () => {
    expect(validateDocumentCount(99)).toBeNull();
  });

  it('100 tài liệu thì chặn, không chèn im lặng', () => {
    expect(validateDocumentCount(100)).toContain('100');
  });

  it('vượt trần cũng chặn', () => {
    expect(validateDocumentCount(150)).toContain('100');
  });
});

describe('buildStoragePath + isStoragePathValid', () => {
  const uuid = 'a1b2c3d4-e5f6-47ab-8cd0-ef1234567890';

  it('dựng đúng {user_id}/{uuid}.{ext}', () => {
    expect(buildStoragePath('uid-1', uuid, 'pdf')).toBe(`uid-1/${uuid}.pdf`);
  });

  it('path dựng ra hợp lệ', () => {
    expect(isStoragePathValid(buildStoragePath('uid-1', uuid, 'docx'))).toBe(
      true,
    );
  });

  it('từ chối tên gốc có dấu/khoảng trắng và ext ngoài whitelist', () => {
    expect(isStoragePathValid('uid-1/Bài giảng 1.pdf')).toBe(false);
    expect(isStoragePathValid(`uid-1/${uuid}.zip`)).toBe(false);
    expect(isStoragePathValid('khong-co-uuid.pdf')).toBe(false);
  });
});

describe('formatFileSize', () => {
  it('byte dưới 1 KB', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('KB làm tròn 1 chữ số thập phân', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('MB cho tệp lớn', () => {
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
  });
});

describe('estimateBase64Bytes', () => {
  it('ước lượng đúng 3/4 độ dài chuỗi', () => {
    expect(estimateBase64Bytes(400)).toBe(300);
  });
});

describe('extraction_status (hạ tầng FR-13)', () => {
  it('PDF/TXT nhận pending, DOCX nhận unsupported', () => {
    expect(getExtractionStatusForExt('pdf')).toBe('pending');
    expect(getExtractionStatusForExt('txt')).toBe('pending');
    expect(getExtractionStatusForExt('docx')).toBe('unsupported');
  });

  it('map ascii sang tiếng Việt', () => {
    expect(getExtractionStatusLabel('pending')).toBe('Chưa xử lý');
    expect(getExtractionStatusLabel('unsupported')).toBe('Không hỗ trợ');
    expect(getExtractionStatusLabel('done')).toBe('Thành công');
    expect(getExtractionStatusLabel('la')).toBe('Không rõ');
  });
});

describe('normalizeDisplayName + deriveDisplayName', () => {
  it('trim và gộp khoảng trắng thừa', () => {
    expect(normalizeDisplayName('  Bài   giảng  1  ')).toBe('Bài giảng 1');
  });

  it('giữ nguyên tên hợp lệ', () => {
    expect(deriveDisplayName('Bài giảng 1.pdf', 'pdf')).toBe(
      'Bài giảng 1.pdf',
    );
  });

  it('cắt tên quá 120 ký tự', () => {
    const long = `${'a'.repeat(200)}.pdf`;
    const derived = deriveDisplayName(long, 'pdf');
    expect(derived.length).toBeLessThanOrEqual(120);
  });

  it('tên rỗng dùng tên dự phòng', () => {
    expect(deriveDisplayName('   ', 'txt')).toBe('Tài liệu.txt');
  });
});

describe('toDocumentsErrorMessage', () => {
  it('lỗi guard hiển thị trực tiếp', () => {
    expect(
      toDocumentsErrorMessage(new DocumentGuardError('Tệp vượt quá 10 MB.')),
    ).toBe('Tệp vượt quá 10 MB.');
  });

  it('lỗi mạng báo offline + retry', () => {
    expect(toDocumentsErrorMessage(new Error('Network request failed'))).toContain(
      'mạng',
    );
  });

  it('lỗi lạ không lộ chi tiết', () => {
    expect(toDocumentsErrorMessage(new Error('relation does not exist'))).toBe(
      'Đã có lỗi xảy ra với tài liệu. Vui lòng thử lại.',
    );
  });
});
