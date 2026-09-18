import { decode } from 'base64-arraybuffer';

import { supabase } from '../../lib/supabase';
import type { ProfileRow } from '../../types/database';
import {
  AVATAR_BUCKET,
  AVATAR_SIGNED_URL_TTL_SECONDS,
  buildAvatarPath,
} from './avatar';
import type { ProfileFormValues } from './schemas';

/**
 * FR-04 qua Supabase client. RLS thu hẹp theo auth.uid();
 * screen không bao giờ gọi Supabase trực tiếp.
 */
export async function getProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Profile not found');
  }

  return data;
}

export async function updateProfile(
  userId: string,
  input: ProfileFormValues,
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      student_code: input.studentCode.trim(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/** Tạo signed URL ngắn hạn để hiển thị; không lưu URL vào DB. */
export async function createAvatarSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw error ?? new Error('Cannot create signed URL');
  }

  return data.signedUrl;
}

/**
 * Upload avatar mới rồi trỏ profiles.avatar_path sang path mới.
 * React Native không dùng fetch(uri).blob() (polyfill lỗi, file 0 byte):
 * đọc base64 từ image-manipulator rồi decode sang ArrayBuffer.
 * Xóa object cũ best-effort: lỗi xóa không làm fail luồng chính.
 */
export async function uploadAvatar(input: {
  base64: string;
  previousPath: string | null;
  userId: string;
}): Promise<string> {
  const path = buildAvatarPath(input.userId, Date.now());
  const buffer = decode(input.base64);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', input.userId);

  if (updateError) {
    // Tránh object mồ côi khi update DB thất bại.
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    throw updateError;
  }

  if (input.previousPath && input.previousPath !== path) {
    const { error: removeError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([input.previousPath]);
    if (removeError) {
      console.warn(
        `[profile] không xóa được avatar cũ: ${removeError.message}`,
      );
    }
  }

  return path;
}
