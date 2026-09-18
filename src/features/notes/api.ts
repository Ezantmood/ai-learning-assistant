import { supabase } from '../../lib/supabase';
import type {
  StudyNoteInsert,
  StudyNoteRow,
} from '../../types/database';
import type { NoteFormValues } from './schemas';

/**
 * CRUD study_notes FR-05 qua Supabase client.
 * Mọi truy vấn lọc theo user_id để gọn UX; RLS mới là ranh giới bảo mật.
 */
export async function listNotes(userId: string): Promise<StudyNoteRow[]> {
  const { data, error } = await supabase
    .from('study_notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getNote(
  userId: string,
  noteId: string,
): Promise<StudyNoteRow> {
  const { data, error } = await supabase
    .from('study_notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    // RLS SELECT chéo trả 0 dòng: dùng cùng thông báo với "không tìm thấy".
    throw new Error('Note not found');
  }

  return data;
}

export async function createNote(
  userId: string,
  input: NoteFormValues,
): Promise<StudyNoteRow> {
  const payload: StudyNoteInsert = {
    content: input.content,
    title: input.title.trim(),
    user_id: userId,
  };
  const { data, error } = await supabase
    .from('study_notes')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: NoteFormValues,
): Promise<StudyNoteRow> {
  const { data, error } = await supabase
    .from('study_notes')
    .update({ content: input.content, title: input.title.trim() })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteNote(userId: string, noteId: string) {
  const { error } = await supabase
    .from('study_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}
