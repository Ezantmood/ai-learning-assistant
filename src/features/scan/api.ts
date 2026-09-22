import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

import { ocrWithGemini } from '../../lib/ai/transport';
import { supabase } from '../../shared/lib/supabase';
import type { DocumentRow } from '../../shared/types/database';
import { ScanGuardError, ScanTruncatedError } from './errors';
import { scanDisplayNameSchema, SCAN_MAX_BYTES, toScanImage, validateScanAsset, type ScanImage } from './schemas';

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

export type ScanResult = { document: DocumentRow; extractedText: string };

export const STALE_SCAN_MS = 15 * 60 * 1000;

export function isStaleScan(document: Pick<DocumentRow, 'extraction_status' | 'updated_at'>, now = Date.now()): boolean {
  const updatedAt = new Date(document.updated_at).getTime();
  return document.extraction_status === 'processing' &&
    Number.isFinite(updatedAt) && now - updatedAt > STALE_SCAN_MS;
}

export async function getLatestScan(userId: string): Promise<DocumentRow | null> {
  const { data, error } = await supabase.from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('file_ext', 'jpg')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function reclaimStaleScan(document: DocumentRow, userId: string): Promise<boolean> {
  if (document.user_id !== userId || !isStaleScan(document)) return false;
  const { error } = await supabase.from('documents')
    .update({ extraction_status: 'failed' })
    .eq('id', document.id)
    .eq('user_id', userId)
    .eq('extraction_status', 'processing');
  if (error) throw error;
  return true;
}

/** Mỗi lần bấm Quét tạo một row mới; ảnh gốc JPEG lên Storage trước DB. */
export async function runScan(input: {
  image: ScanImage;
  rawDisplayName?: string;
  userId: string;
}): Promise<ScanResult> {
  if (input.image.mimeType !== 'image/jpeg' || input.image.fileExt !== 'jpg' ||
      input.image.sizeBytes <= 0 || input.image.sizeBytes > SCAN_MAX_BYTES || !input.image.base64) {
    throw new ScanGuardError('Ảnh quét không hợp lệ. Hãy chọn hoặc chụp lại.');
  }

  const displayName = scanDisplayNameSchema.parse(
    input.rawDisplayName ?? `Đề bài quét ${new Date().toLocaleString('vi-VN')}`,
  );
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || authData.user?.id !== input.userId) {
    throw new ScanGuardError('Bạn không có quyền quét ảnh cho tài khoản này.');
  }
  const path = `${input.userId}/${Crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, decode(input.image.base64), { contentType: 'image/jpeg', upsert: false });
  if (uploadError) {
    throw uploadError;
  }

  const { data: document, error: insertError } = await supabase
    .from('documents')
    .insert({
      display_name: displayName,
      extraction_status: 'pending',
      file_ext: 'jpg',
      file_size: input.image.sizeBytes,
      mime_type: 'image/jpeg',
      storage_path: path,
      user_id: input.userId,
    })
    .select()
    .single();
  if (insertError || !document) {
    await supabase.storage.from('documents').remove([path]);
    throw insertError ?? new ScanGuardError('Không lưu được ảnh quét. Hãy thử lại.');
  }

  const { error: processingError } = await supabase
    .from('documents')
    .update({ extraction_status: 'processing' })
    .eq('id', document.id)
    .eq('user_id', input.userId);
  if (processingError) {
    throw processingError;
  }

  try {
    const result = await ocrWithGemini(input.image.base64);
    const { data: saved, error: doneError } = await supabase
      .from('documents')
      .update({ extracted_text: result.extractedText, extraction_status: 'done' })
      .eq('id', document.id)
      .eq('user_id', input.userId)
      .select()
      .single();
    if (doneError || !saved) {
      throw doneError ?? new ScanGuardError('Không lưu được kết quả quét. Hãy thử lại.');
    }
    if (result.truncated) {
      throw new ScanTruncatedError(result.extractedText);
    }
    return { document: saved, extractedText: result.extractedText };
  } catch (error) {
    if (error instanceof ScanTruncatedError) {
      throw error;
    }
    await supabase.from('documents')
      .update({ extraction_status: 'failed' })
      .eq('id', document.id)
      .eq('user_id', input.userId);
    throw error;
  }
}
