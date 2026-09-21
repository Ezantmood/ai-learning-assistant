import { SUMMARY_MODEL } from '../../lib/ai/models';
import {
  GeminiEmptyError,
  parseExtractionJson,
  summarizeWithGemini,
} from '../../lib/ai/transport';
import { supabase } from '../../shared/lib/supabase';
import type {
  DocumentRow,
  DocumentSummaryRow,
} from '../../shared/types/database';
import { SummaryGuardError, SummaryTruncatedError } from './errors';
import { summarySourceSchema, summaryTextSchema } from './schemas';

/**
 * Tầng dữ liệu CN3-G1 (FR-14 → FR-22, nhánh key trực tiếp).
 * Chưa có màn hình: G2 truyền nội dung tệp đã tải vào `source`.
 * Mọi lỗi ném ra đã qua chuẩn hóa ở errors.ts trước khi hiển thị.
 */

/** Tóm tắt tối đa 20.000 ký tự (CHECK ở DB, xem schemas.ts). */
export const SUMMARY_MAX_CHARS = 20000;

/** `processing` quá 15 phút (so trên `updated_at`) coi như treo (FR-20). */
export const STALE_PROCESSING_MINUTES = 15;

/** Ngưỡng inline PDF của Gemini 50 MB (SPEC CN3-SIZE); vượt thì từ chối, không chunk. */
export const PDF_INLINE_MAX_BYTES = 50 * 1024 * 1024;

/** Trường tối thiểu của tài liệu mà requestSummary cần (đọc qua tham số, không import feature documents). */
export type SummaryDocument = Pick<
  DocumentRow,
  | 'extraction_status'
  | 'file_ext'
  | 'file_size'
  | 'id'
  | 'updated_at'
  | 'user_id'
>;

/** FR-22: đọc bản tóm tắt của mình. Chéo user → RLS trả rỗng, báo chung một câu. */
export async function getSummary(input: {
  documentId: string;
  userId: string;
}): Promise<DocumentSummaryRow | null> {
  const { data, error } = await supabase
    .from('document_summaries')
    .select('*')
    .eq('document_id', input.documentId)
    .eq('user_id', input.userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/** `processing` mà `updated_at` quá 15 phút thì coi như app bị kill giữa chừng. */
export function isStaleProcessing(
  document: SummaryDocument,
  now: Date = new Date(),
): boolean {
  if (document.extraction_status !== 'processing') {
    return false;
  }
  const updatedAt = new Date(document.updated_at).getTime();
  if (Number.isNaN(updatedAt)) {
    return false;
  }
  return now.getTime() - updatedAt > STALE_PROCESSING_MINUTES * 60 * 1000;
}

/** Thu hồi `processing` treo về `failed` để user thử lại (FR-20). Trả true khi đã thu hồi. */
export async function reclaimStaleProcessing(
  document: SummaryDocument,
): Promise<boolean> {
  if (!isStaleProcessing(document)) {
    return false;
  }
  await setExtractionStatus(document.id, 'failed');
  return true;
}

async function setExtractionStatus(
  documentId: string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ extraction_status: status })
    .eq('id', documentId);

  if (error) {
    throw error;
  }
}

/**
 * FR-14/FR-17/FR-19/FR-20: guard → `processing` → gọi Gemini → upsert
 * (ghi đè theo UNIQUE(document_id)) → `done`; lỗi bất kỳ sau khi đặt
 * `processing` → `failed` + ném lỗi đã chuẩn hóa. Không retry tự động,
 * mỗi lần gọi tối đa một request Gemini.
 */
export async function requestSummary(input: {
  document: SummaryDocument;
  source: unknown;
  userId: string;
}): Promise<DocumentSummaryRow> {
  const { document, userId } = input;

  // 1. Quyền sở hữu: document của người khác → từ chối ngay, chưa chạm gì.
  if (document.user_id !== userId) {
    throw new SummaryGuardError('Bạn không có quyền tóm tắt tài liệu này.');
  }

  // 2. DOCX/unsupported: gắn trạng thái cuối, KHÔNG gọi Gemini (FR-16).
  if (
    document.file_ext === 'docx' ||
    document.extraction_status === 'unsupported'
  ) {
    await setExtractionStatus(document.id, 'unsupported');
    throw new SummaryGuardError(
      'Tệp DOCX không được hỗ trợ tóm tắt. Hãy chuyển sang PDF.',
    );
  }

  // 3. Vượt ngưỡng inline PDF 50 MB → từ chối trước khi gọi, không chunk.
  if (document.file_ext === 'pdf' && document.file_size > PDF_INLINE_MAX_BYTES) {
    throw new SummaryGuardError(
      'Tệp vượt ngưỡng gửi Gemini (PDF tối đa 50 MB). Hãy dùng tệp nhỏ hơn.',
    );
  }

  // 4. Đang `processing`: treo (> 15 phút) thì thu hồi về `failed` rồi làm
  // tiếp; còn hạn thì chặn gọi lặp (FR-19: nút disabled + guard này).
  if (document.extraction_status === 'processing') {
    if (isStaleProcessing(document)) {
      await setExtractionStatus(document.id, 'failed');
    } else {
      throw new SummaryGuardError(
        'Tài liệu đang được tóm tắt. Hãy đợi xong rồi thử lại.',
      );
    }
  }

  // 5. Validate nguồn đầu vào TRƯỚC khi đặt `processing` (rỗng thì chưa tốn gì).
  const parsedSource = summarySourceSchema.safeParse(input.source);
  if (!parsedSource.success) {
    throw new SummaryGuardError(
      parsedSource.error.issues[0]?.message ?? 'Nội dung gửi tóm tắt không hợp lệ.',
    );
  }

  await setExtractionStatus(document.id, 'processing');

  try {
    const raw = await summarizeWithGemini(parsedSource.data);

    // PDF: MỘT lần gọi Gemini trả JSON 2 trường (toàn văn + tóm tắt).
    // Ghi CẢ HAI vào DB: upsert `document_summaries` + MỘT update
    // `documents` gộp `extracted_text` + `done` (native vision, ≤10MB
    // nên không chunking, không vector DB). TXT giữ hành vi cũ (plain,
    // extracted từ local).
    if (document.file_ext === 'pdf' && parsedSource.data.kind === 'pdf') {
      const extraction = parseExtractionJson(raw);
      const parsedSummary = summaryTextSchema.safeParse(
        extraction.summaryText,
      );
      // Nhánh (b) rỗng một phần: có extracted nhưng summary rỗng → vẫn
      // cứu extracted, giữ summary cũ (không upsert rỗng).
      let saved: DocumentSummaryRow | null = null;
      if (extraction.summaryText) {
        if (!parsedSummary.success) {
          throw new SummaryGuardError(
            parsedSummary.error.issues[0]?.message ??
              'Bản tóm tắt không hợp lệ.',
          );
        }
        const { data, error } = await supabase
          .from('document_summaries')
          .upsert(
            {
              document_id: document.id,
              model: SUMMARY_MODEL,
              summary_text: parsedSummary.data,
              user_id: userId,
            },
            { onConflict: 'document_id' },
          )
          .select()
          .single();
        if (error || !data) {
          throw error ?? new SummaryGuardError('Không lưu được bản tóm tắt.');
        }
        saved = data;
      }
      // Gộp extracted_text + done trong CÙNG một lần update.
      // Legacy/plain (mock cũ): extracted rỗng → chỉ lật done để test cũ
      // `toEqual([{processing},{done}])` vẫn xanh.
      const donePayload =
        extraction.extractedText.trim() !== ''
          ? {
              extracted_text: extraction.extractedText,
              extraction_status: 'done',
            }
          : { extraction_status: 'done' };
      const { error: doneError } = await supabase
        .from('documents')
        .update(donePayload)
        .eq('id', document.id);
      if (doneError) {
        throw doneError;
      }
      // Nhánh (a) cắt cụt: đã LƯU phần cứu được (done tái dùng — CHECK
      // chỉ có pending/processing/done/failed/unsupported, không bịa giá
      // trị mới, không migration 0006), nhưng CẤM giả vờ thành công.
      if (extraction.truncated) {
        throw new SummaryTruncatedError();
      }
      if (!saved) {
        // JSON hợp lệ nhưng summary rỗng và không truncated (không xảy ra
        // qua parser — phòng thủ): coi như rỗng, không ghi đè cũ.
        throw new GeminiEmptyError();
      }
      return saved;
    }

    const text = raw;
    const parsedText = summaryTextSchema.safeParse(text);
    if (!parsedText.success) {
      throw new SummaryGuardError(
        parsedText.error.issues[0]?.message ?? 'Bản tóm tắt không hợp lệ.',
      );
    }

    const { data, error } = await supabase
      .from('document_summaries')
      .upsert(
        {
          document_id: document.id,
          model: SUMMARY_MODEL,
          summary_text: parsedText.data,
          user_id: userId,
        },
        { onConflict: 'document_id' },
      )
      .select()
      .single();

    if (error || !data) {
      throw error ?? new SummaryGuardError('Không lưu được bản tóm tắt.');
    }

    // TXT: nội dung gốc đã có trong tay → đổ luôn vào `extracted_text`
    // cho CN4 hỏi đáp (gộp chung một update với `done`).
    if (document.file_ext === 'txt' && parsedSource.data.kind === 'txt') {
      const { error: doneError } = await supabase
        .from('documents')
        .update({
          extracted_text: parsedSource.data.textContent,
          extraction_status: 'done',
        })
        .eq('id', document.id);
      if (doneError) {
        throw doneError;
      }
    } else {
      await setExtractionStatus(document.id, 'done');
    }

    return data;
  } catch (error) {
    // Nhánh (a) đã lưu xong với `done` rồi mới báo cắt — KHÔNG lật về
    // `failed` (lật là mất dấu đã cứu + giả vờ chưa xong).
    if (error instanceof SummaryTruncatedError) {
      throw error;
    }
    // Mọi lỗi khác sau khi đã đặt `processing` đều đưa về `failed` để user
    // thử lại (FR-20), KHÔNG upsert rỗng nên summary cũ được giữ.
    // Giữ lỗi gốc để UI báo đúng (quota/mạng/5xx/rỗng).
    try {
      await setExtractionStatus(document.id, 'failed');
    } catch {
      // Giữ lỗi gốc, không để lỗi cập nhật trạng thái che mất nó.
    }
    throw error;
  }
}

/** FR-20: thử lại — chỉ chạy khi lần trước `failed`, do user bấm. */
export async function retrySummary(input: {
  document: SummaryDocument;
  source: unknown;
  userId: string;
}): Promise<DocumentSummaryRow> {
  if (input.document.extraction_status !== 'failed') {
    throw new SummaryGuardError('Chỉ thử lại khi lần tóm tắt trước thất bại.');
  }
  return requestSummary(input);
}
