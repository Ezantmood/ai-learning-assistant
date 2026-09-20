/**
 * Model Gemini duy nhất cho CN3 (FR-14/FR-21, nhánh key trực tiếp sau probe
 * cn3-g1: WITH_AUTH 401 + WITHOUT_AUTH 401 nên key nằm ở client bản demo).
 *
 * 'gemini-3.5-flash': model 2.5-flash có lịch shutdown sớm nhất 16/10/2026
 * nên G1 chốt 3.5-flash ngay từ đầu, khỏi migrate giữa chừng.
 *
 * CẤM set temperature/top_p/top_k (đã deprecated trên Gemini 3.x).
 * CẤM dùng bản -preview.
 */
export const SUMMARY_MODEL = 'gemini-3.5-flash' as const;
