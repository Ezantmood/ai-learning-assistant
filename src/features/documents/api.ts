import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

import { supabase } from '../../shared/lib/supabase';
import type {
  DocumentRow,
  SubjectRow,
} from '../../shared/types/database';
import {
  DocumentDeletePartialError,
  DocumentGuardError,
} from './errors';
import { deriveDisplayName, displayNameSchema } from './schemas';
import {
  DOCUMENT_SIGNED_URL_TTL_SECONDS,
  DOCUMENTS_BUCKET,
  EXT_TO_MIME,
  buildDocumentSearchPattern,
  estimateBase64Bytes,
  getExtractionStatusForExt,
  getFileExtension,
  isAllowedExtension,
  normalizeSubjectName,
  validateDocumentCount,
  validatePickedFile,
  validateSubjectCount,
  buildStoragePath,
  type DocumentFileExt,
  type PickedDocumentInput,
  type SubjectFilterValue,
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
 * Tìm kiếm dùng `ilike` theo display_name (PHÂN BIỆT DẤU tiếng Việt —
 * giới hạn đã chốt, xem SPEC/CN2-2). Lọc môn: undefined = tất cả,
 * null = chưa phân loại, string = id môn cụ thể.
 */
export async function listDocuments(
  userId: string,
  options?: { search?: string; subjectFilter?: SubjectFilterValue },
): Promise<DocumentWithSubject[]> {
  const pattern =
    options?.search !== undefined
      ? buildDocumentSearchPattern(options.search)
      : null;

  let query = supabase
    .from('documents')
    .select('*, subjects ( name )')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (pattern) {
    query = query.ilike('display_name', pattern);
  }

  const filter = options?.subjectFilter;
  if (filter === null) {
    query = query.is('subject_id', null);
  } else if (typeof filter === 'string') {
    query = query.eq('subject_id', filter);
  }

  const { data, error } = await query;

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
  // Web không được hỗ trợ: luồng đọc `File`/`Paths` + base64 của
  // expo-file-system chỉ chạy trên Expo Go / thiết bị. Chặn sớm để lỗi
  // không ngã vào catch chung khó đọc.
  if (Platform.OS === 'web') {
    throw new DocumentGuardError(
      'Tải tài liệu chỉ chạy trên Expo Go / thiết bị. Phiên bản web không được hỗ trợ.',
    );
  }

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

/**
 * FR-09: chi tiết một tài liệu của mình (kèm tên môn, null → “Chưa phân
 * loại”). Không tìm thấy / không phải của mình → ném lỗi để UI báo chung
 * một câu, không lộ tài liệu của user khác.
 */
export async function getDocument(input: {
  documentId: string;
  userId: string;
}): Promise<DocumentWithSubject> {
  const { data, error } = await supabase
    .from('documents')
    .select('*, subjects ( name )')
    .eq('id', input.documentId)
    .eq('user_id', input.userId)
    .single();

  if (error || !data) {
    throw new DocumentGuardError(
      'Không tìm thấy tài liệu. Có thể tài liệu đã bị xóa.',
    );
  }

  return {
    created_at: data.created_at,
    display_name: data.display_name,
    extracted_text: data.extracted_text,
    extraction_status: data.extraction_status,
    file_ext: data.file_ext,
    file_size: data.file_size,
    id: data.id,
    mime_type: data.mime_type,
    storage_path: data.storage_path,
    subject_id: data.subject_id,
    subjectName: data.subjects?.name ?? null,
    updated_at: data.updated_at,
    user_id: data.user_id,
  };
}

/**
 * FR-09 (tiện ích ngoài FR, mức tối thiểu): signed URL TTL 3600s để nút
 * “Mở tài liệu” gọi `Linking.openURL`. DB chỉ lưu path, không lưu URL.
 */
export async function getDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, DOCUMENT_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw error ?? new DocumentGuardError('Không tạo được liên kết tệp.');
  }

  return data.signedUrl;
}

/**
 * FR-10: CHỈ đổi `documents.display_name`. Object trên storage giữ nguyên
 * tên UUID — không rename, không copy. Validate rỗng/quá dài tại form
 * (schema), tên cũ giữ nguyên khi lỗi.
 */
export async function renameDocument(input: {
  documentId: string;
  rawName: string;
}): Promise<DocumentRow> {
  const parsed = displayNameSchema.safeParse(input.rawName);
  if (!parsed.success) {
    throw new DocumentGuardError(parsed.error.issues[0]?.message ?? 'Tên tài liệu không hợp lệ.');
  }

  const { data, error } = await supabase
    .from('documents')
    .update({ display_name: parsed.data })
    .eq('id', input.documentId)
    .select()
    .single();

  if (error || !data) {
    throw error ?? new DocumentGuardError('Không đổi được tên tài liệu.');
  }

  return data;
}

/**
 * FR-12 (gán/đổi môn): CHỈ gọi ở màn chi tiết. Một tài liệu tối đa một
 * môn; `null` = bỏ về “Chưa phân loại”.
 */
export async function assignDocumentSubject(input: {
  documentId: string;
  subjectId: string | null;
}): Promise<DocumentRow> {
  const { data, error } = await supabase
    .from('documents')
    .update({ subject_id: input.subjectId })
    .eq('id', input.documentId)
    .select()
    .single();

  if (error || !data) {
    throw error ?? new DocumentGuardError('Không đổi được môn học.');
  }

  return data;
}

/**
 * FR-11: xóa thẳng, không thùng rác. Thứ tự storage TRƯỚC, DB SAU:
 * - Storage lỗi → dừng, giữ bản ghi (UI không bao giờ trỏ vào hư không).
 * - Storage xong mà DB fail → ném `DocumentDeletePartialError` để UI báo
 *   rõ và cho thử lại; CẤM nuốt im lặng để lại bản ghi trỏ vào object
 *   đã biến mất.
 */
export async function deleteDocument(input: {
  documentId: string;
  storagePath: string;
}): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([input.storagePath]);

  if (storageError) {
    throw storageError;
  }

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', input.documentId);

  if (dbError) {
    throw new DocumentDeletePartialError(input.documentId);
  }
}

/** Đếm môn học của user để guard trần 30 trước khi insert. */
export async function countSubjects(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('subjects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/** FR-12: liệt kê môn học của mình, mới nhất trước. */
export async function listSubjects(userId: string): Promise<SubjectRow[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Đếm tài liệu đang gán vào một môn (để cảnh báo trước khi xóa môn:
 * bấy nhiêu tài liệu sẽ chuyển thành “Chưa phân loại”).
 */
export async function countDocumentsInSubject(input: {
  subjectId: string;
  userId: string;
}): Promise<number> {
  const { count, error } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .eq('subject_id', input.subjectId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * FR-12: tạo môn học. Chuẩn hóa tên, validate 1–60, guard trần 30
 * (count trước insert), chặn trùng tên sau chuẩn hóa (phân biệt
 * hoa/thường) trước khi insert; unique (user_id, name) ở DB là lưới
 * cuối (map 23505 ở `toSubjectsErrorMessage`).
 */
export async function createSubject(input: {
  rawName: string;
  userId: string;
}): Promise<SubjectRow> {
  const normalized = normalizeSubjectName(input.rawName);
  if (!normalized || normalized.length > 60) {
    throw new DocumentGuardError(
      !normalized
        ? 'Tên môn học không được để trống.'
        : 'Tên môn học tối đa 60 ký tự.',
    );
  }

  const total = await countSubjects(input.userId);
  const capMessage = validateSubjectCount(total);
  if (capMessage) {
    throw new DocumentGuardError(capMessage);
  }

  const { data: existing, error: checkError } = await supabase
    .from('subjects')
    .select('id')
    .eq('user_id', input.userId)
    .eq('name', normalized)
    .limit(1);

  if (checkError) {
    throw checkError;
  }
  if (existing.length > 0) {
    throw new DocumentGuardError('Tên môn học đã tồn tại. Hãy chọn tên khác.');
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({ name: normalized, user_id: input.userId })
    .select()
    .single();

  if (error || !data) {
    throw error ?? new DocumentGuardError('Không tạo được môn học.');
  }

  return data;
}

/** FR-12: đổi tên môn (validate + chặn trùng như khi tạo). */
export async function renameSubject(input: {
  rawName: string;
  subjectId: string;
  userId: string;
}): Promise<SubjectRow> {
  const normalized = normalizeSubjectName(input.rawName);
  if (!normalized || normalized.length > 60) {
    throw new DocumentGuardError(
      !normalized
        ? 'Tên môn học không được để trống.'
        : 'Tên môn học tối đa 60 ký tự.',
    );
  }

  const { data: existing, error: checkError } = await supabase
    .from('subjects')
    .select('id')
    .eq('user_id', input.userId)
    .eq('name', normalized)
    .limit(1);

  if (checkError) {
    throw checkError;
  }
  if (existing.some((row) => row.id !== input.subjectId)) {
    throw new DocumentGuardError('Tên môn học đã tồn tại. Hãy chọn tên khác.');
  }

  const { data, error } = await supabase
    .from('subjects')
    .update({ name: normalized })
    .eq('id', input.subjectId)
    .select()
    .single();

  if (error || !data) {
    throw error ?? new DocumentGuardError('Không đổi được tên môn học.');
  }

  return data;
}

/**
 * FR-12: xóa môn. Tài liệu thuộc môn rơi về null nhờ
 * `ON DELETE SET NULL` — UI phải cảnh báo trước (số tài liệu ảnh hưởng
 * do `countDocumentsInSubject` cung cấp), không xóa theo tài liệu.
 */
export async function deleteSubject(subjectId: string): Promise<void> {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId);

  if (error) {
    throw error;
  }
}
