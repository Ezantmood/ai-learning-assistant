import { File, Paths } from 'expo-file-system';

import type { SummarySource } from '../../lib/ai/transport';
import { isNetworkError } from '../../shared/lib/network';
import { supabase } from '../../shared/lib/supabase';
import { SummaryGuardError } from './errors';

/**
 * Loader nội dung tệp cho CN3-G2 (FR-14/FR-15).
 * G2 tải object từ bucket về cache rồi đọc: PDF → base64 inline nguyên
 * file (≤ 10 MB theo luật CN2, dưới ngưỡng 50 MB nên không chunk),
 * TXT → text trực tiếp. Chỉ dùng API mới (`File`, `Paths`); CẤM
 * `expo-file-system/legacy`.
 */

/**
 * Bucket tài liệu. Literal khai tại đây thay vì import từ feature
 * documents (cấm import chéo giữa hai feature theo AGENTS.md).
 */
const SUMMARY_DOCUMENTS_BUCKET = 'documents';

/** TTL signed URL tải nội dung (cùng 3600s như nút “Mở tài liệu” CN2). */
const SOURCE_SIGNED_URL_TTL_SECONDS = 3600;

/** Trường tối thiểu để tải + đọc nội dung (đọc qua tham số). */
export type SummarySourceDocument = {
  file_ext: string;
  id: string;
  storage_path: string;
};

function toGuardMessage(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return 'Không có kết nối mạng. Kiểm tra Wi-Fi/4G rồi thử lại.';
  }
  return fallback;
}

/**
 * Tải object từ Storage về cache rồi đọc thành `SummarySource` cho
 * transport. DOCX không bao giờ tới được đây (UI ẩn nút + guard trong
 * `requestSummary`), lỡ lọt thì ném lỗi trước khi chạm mạng.
 * File tạm trong cache luôn được dọn best-effort (lỗi dọn không fail).
 */
export async function loadSummarySource(
  document: SummarySourceDocument,
): Promise<SummarySource> {
  if (document.file_ext === 'docx') {
    throw new SummaryGuardError(
      'Tệp DOCX không được hỗ trợ tóm tắt. Hãy chuyển sang PDF.',
    );
  }
  if (document.file_ext !== 'pdf' && document.file_ext !== 'txt') {
    throw new SummaryGuardError('Định dạng tệp không được hỗ trợ tóm tắt.');
  }

  let signedUrl: string;
  try {
    const { data, error } = await supabase.storage
      .from(SUMMARY_DOCUMENTS_BUCKET)
      .createSignedUrl(document.storage_path, SOURCE_SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      throw error ?? new Error('no signed url');
    }
    signedUrl = data.signedUrl;
  } catch (error) {
    if (error instanceof SummaryGuardError) {
      throw error;
    }
    throw new SummaryGuardError(
      toGuardMessage(error, 'Không tải được tệp. Hãy thử lại.'),
    );
  }

  const tempFile = new File(Paths.cache, `summary-${document.id}`);
  let downloaded: File | null = null;
  try {
    downloaded = await File.downloadFileAsync(signedUrl, tempFile, {
      idempotent: true,
    });
  } catch (error) {
    throw new SummaryGuardError(
      toGuardMessage(error, 'Không tải được nội dung tệp. Hãy thử lại.'),
    );
  }

  try {
    if (document.file_ext === 'pdf') {
      const base64Data = await downloaded.base64();
      if (!base64Data) {
        throw new SummaryGuardError(
          'Nội dung PDF rỗng. Hãy thử tải lại tệp.',
        );
      }
      return { base64Data, kind: 'pdf' };
    }
    const textContent = (await downloaded.text()).trim();
    if (!textContent) {
      throw new SummaryGuardError(
        'Nội dung TXT rỗng. Hãy thử tải lại tệp.',
      );
    }
    return { kind: 'txt', textContent };
  } catch (error) {
    if (error instanceof SummaryGuardError) {
      throw error;
    }
    throw new SummaryGuardError(
      toGuardMessage(error, 'Không đọc được nội dung tệp. Hãy thử lại.'),
    );
  } finally {
    try {
      if (downloaded.exists) {
        downloaded.delete();
      }
    } catch {
      // Dọn cache best-effort: kẹt file tạm chỉ tốn dung lượng, không fail.
    }
  }
}
