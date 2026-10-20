/** Model stable cho tóm tắt/hỏi đáp/OCR/giải bài.
 * 2026-10-21: Gemini 3.6 Flash của project hết quota Free Tier 20 lượt/ngày.
 * Flash-Lite 3.5 có trong models API, đã qua 10/10 ca smoke cả PDF/ảnh/ngữ cảnh.
 * AI Studio đúng project: Free Tier 15 RPM, 250K TPM, 500 RPD (2026-10-21).
 * Mẫu OCR 6,5s, PDF 7,1s; xem SETUP, quota/latency có thể thay đổi.
 * Không tự đổi model/key hoặc retry khi lỗi.
 */
export const SUMMARY_MODEL = 'gemini-3.5-flash-lite' as const;
