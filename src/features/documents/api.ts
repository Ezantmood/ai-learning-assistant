import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import { supabase } from '../../shared/lib/supabase';
import type { DocumentRow } from '../../shared/types/database';
import { DocumentGuardError } from './errors';
import { deriveDisplayName } from './schemas';
import {
  DOCUMENTS_BUCKET,
  EXT_TO_MIME,
  estimateBase64Bytes,
  getExtractionStatusForExt,
  getFileExtension,
  isAllowedExtension,
  validateDocumentCount,
  validatePickedFile,
  buildStoragePath,
  type DocumentFileExt,
  type PickedDocumentInput,
} from './storage';

/**
 * FR-06/FR-07/FR-08 qua Supabase client. Mọi lời gọi Supabase của CN2 nằm ở
 * đây; screen không bao giờ gọi Supabase trực tiếp. RLS thu hẹp theo
 * auth.uid(); filter user_id chỉ để gọn UX.
 */

export type PickedDocumentAsset = PickedDocumentInput & {
  mimeType: string | null;
  name: string;
  size: number | null;
  uri: string;
};

/**
 * Mở picker chọn đúng 1 tệp (lọc gợi ý PDF/DOCX/TXT ở UI picker).
 * Hủy picker thì trả null, im lặng. Chưa đọc nội dung tệp ở bước này.
 */
export async function pickDocument(): Promise<PickedDocumentAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: [
      EXT_TO_MIME.pdf,
      EXT_TO_MIME.docx,
      EXT_TO_MIME.txt,
    ],
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  return {
    mimeType: asset.mimeType ?? null,
    name: asset.name,
    size: asset.size ?? null,
    uri: asset.uri,
  };
}

/** Đếm tài liệu của user để guard trần 100 trước khi insert. */
export async function countDocuments(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export type DocumentWithSubject = DocumentRow & {
  subjectName: string | null;
};

/**
 * FR-08: liệt kê tài liệu của mình, mới nhất trước, kèm tên môn học
 * (null → UI hiển thị “Chưa phân loại”).
 */
export async function listDocuments(
  userId: string,
): Promise<DocumentWithSubject[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*, subjects ( name )')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map((row) => ({
    created_at: row.created_at,
    display_name: row.display_name,
    extracted_text: row.extracted_text,
    extraction_status: row.extraction_status,
    file_ext: row.file_ext,
    file_size: row.file_size,
    id: row.id,
    mime_type: row.mime_type,
    storage_path: row.storage_path,
    subject_id: row.subject_id,
    subjectName: row.subjects?.name ?? null,
    updated_at: row.updated_at,
    user_id: row.user_id,
  }));
}

/**
 * FR-06/FR-07: guard ext/MIME/size + guard trần 100 (count trước insert)
 * → đọc base64 bằng API `File` mới của expo-file-system → decode ArrayBuffer
 * → upload Storage trước → insert DB sau.
 * Insert lỗi thì dọn object vừa upload, không để rác mồ côi.
 * React Native cấm `fetch(uri).blob()` (ra file 0 byte) và cấm import
 * `expo-file-system/legacy` (hàm cũ throw lúc chạy).
 */
export async function uploadDocument(input: {
  asset: PickedDocumentAsset;
  userId: string;
}): Promise<DocumentRow> {
  const guardMessage = validatePickedFile(input.asset);
  if (guardMessage) {
    throw new DocumentGuardError(guardMessage);
  }

  const ext = getFileExtension(input.asset.name);
  if (!isAllowedExtension(ext)) {
    throw new DocumentGuardError(
      'Định dạng tệp không được hỗ trợ. Chỉ nhận PDF, DOCX, TXT.',
    );
  }
  const fileExt: DocumentFileExt = ext;

  const total = await countDocuments(input.userId);
  const capMessage = validateDocumentCount(total);
  if (capMessage) {
    throw new DocumentGuardError(capMessage);
  }

  // Chỉ đọc nội dung SAU khi mọi guard đã qua.
  const base64 = await new File(input.asset.uri).base64();
  const buffer = decode(base64);

  const path = buildStoragePath(
    input.userId,
    Crypto.randomUUID(),
    fileExt,
  );

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, buffer, { contentType: EXT_TO_MIME[fileExt], upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      display_name: deriveDisplayName(input.asset.name, fileExt),
      extraction_status: getExtractionStatusForExt(fileExt),
      file_ext: fileExt,
      file_size: input.asset.size ?? estimateBase64Bytes(base64.length),
      mime_type: input.asset.mimeType ?? EXT_TO_MIME[fileExt],
      storage_path: path,
      user_id: input.userId,
    })
    .select()
    .single();

  if (insertError) {
    // Tránh object mồ côi khi insert DB thất bại.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    throw insertError;
  }

  return data;
}
