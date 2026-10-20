/** Model stable chung cho tóm tắt/hỏi đáp/OCR/giải bài.
 * Xác minh docs/models API và generateContent ngày 2026-10-20.
 * 3.8 Flash trả timeout/503 trong probe; 3.6 Flash sinh nội dung thành công.
 * Dùng minimal cho hỏi đáp/OCR, low cho gợi ý/trích PDF, medium cho lời giải đầy đủ; không tự fallback/retry.
 */
export const SUMMARY_MODEL = 'gemini-3.6-flash' as const;
