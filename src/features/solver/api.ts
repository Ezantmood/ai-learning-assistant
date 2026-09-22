import { SUMMARY_MODEL } from '../../lib/ai/models';
import { solveWithGemini } from '../../lib/ai/transport';
import { supabase } from '../../shared/lib/supabase';
import type { DocumentRow, DocumentSolutionRow } from '../../shared/types/database';
import { SolverGuardError, SolverTruncatedError } from './errors';
import { solutionTextSchema } from './schemas';

export type SolverDocument = Pick<DocumentRow,
  'id' | 'user_id' | 'file_ext' | 'extraction_status' | 'extracted_text'>;

const activeDocuments = new Set<string>();

export async function getSolution(input: {
  documentId: string; userId: string;
}): Promise<DocumentSolutionRow | null> {
  const { data, error } = await supabase.from('document_solutions')
    .select('*')
    .eq('document_id', input.documentId)
    .eq('user_id', input.userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Guard trước mạng; một request Gemini, sau đó ghi đè row 1-1. */
export async function requestSolution(input: {
  document: SolverDocument; userId: string;
}): Promise<DocumentSolutionRow> {
  const { document, userId } = input;
  if (!userId || document.user_id !== userId) {
    throw new SolverGuardError('Bạn không có quyền gợi ý lời giải cho tài liệu này.');
  }
  if (document.file_ext === 'docx' || document.extraction_status === 'unsupported') {
    throw new SolverGuardError('Tệp DOCX không được hỗ trợ. Hãy chuyển sang PDF hoặc ảnh đề bài.');
  }
  const contextText = document.extracted_text?.trim() ?? '';
  if (!contextText) {
    throw new SolverGuardError('Hãy tóm tắt tài liệu hoặc quét ảnh đề bài trước khi gợi ý lời giải.');
  }
  if (activeDocuments.has(document.id)) {
    throw new SolverGuardError('Gợi ý lời giải đang chạy. Hãy đợi xong rồi thử lại.');
  }
  activeDocuments.add(document.id);
  try {
    const result = await solveWithGemini({ contextText });
    const parsed = solutionTextSchema.safeParse(result.solutionText);
    if (!parsed.success) {
      throw new SolverGuardError(parsed.error.issues[0]?.message ?? 'Gợi ý không hợp lệ.');
    }
    const { data, error } = await supabase.from('document_solutions')
      .upsert({
        document_id: document.id,
        model: SUMMARY_MODEL,
        solution_text: parsed.data,
        user_id: userId,
      }, { onConflict: 'document_id' })
      .select().single();
    if (error || !data) throw error ?? new SolverGuardError('Không lưu được gợi ý lời giải.');
    if (result.truncated) throw new SolverTruncatedError();
    return data;
  } finally {
    activeDocuments.delete(document.id);
  }
}

/** Thử lại chỉ khi user bấm, không có retry tự động. */
export const retrySolution = requestSolution;
