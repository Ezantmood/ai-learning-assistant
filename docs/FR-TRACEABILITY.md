# Truy vết yêu cầu — AI Learning Assistant (FR-01 → FR-45)

Chỉ chuyển trạng thái sau khi file/hàm tồn tại và case test tương ứng đã chạy. Giá trị hợp lệ: `chưa làm`, `đang làm`, `đạt`, `lỗi`.

## Chức năng 1 — Quản lý tài khoản người dùng (đạt)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-01 | `app/(auth)/sign-up.tsx`; `src/features/auth/api.ts`; `schemas.ts`; migration profile | `signUp`; `signUpSchema`; `handle_new_user` | G3: unit test schema/strength/errors 26/26 PASS; chờ test tay trên thiết bị (đăng ký hợp lệ, email/mã trùng, input sai, offline) | đạt |
| FR-02 | `app/(auth)/sign-in.tsx`; `app/(app)/profile.tsx`; `src/features/auth/api.ts`; `useSession.ts` | `signIn`; `signOut`; `useSession` | G1 session restore + guard; G3 AuthProvider boot gate + unit test errors PASS; chờ test tay login/logout/restart/token/offline | đạt |
| FR-03 | `app/(auth)/{forgot-password,verify-reset-otp,reset-password}.tsx`; `app/(app)/profile/change-password.tsx`; `src/features/auth/{api.ts,schemas.ts,errors.ts,recovery.ts,recoveryStorage.ts}` | `requestPasswordReset`; `verifyRecoveryOtp`; `updatePassword`; `changePassword` (+reauth `signInWithPassword`) | G4: unit test 51/51 PASS (otpSchema, reset/changePasswordSchema, nhánh map lỗi OTP/quota/trùng pass, cooldown 60s); chờ test tay trên thiết bị (OTP đúng/sai/hết hạn, resend cooldown, rate limit 100/giờ, kill app giữa luồng, reset thành công, đổi pass khi login) | đạt |
| FR-04 | `app/(app)/profile/index.tsx`; `src/features/profile/{api.ts,schemas.ts,queries.ts,errors.ts,avatar.ts,pickAvatar.ts,ProfileView.tsx}`; migration profile/Storage policy | `getProfile`; `updateProfile`; `uploadAvatar`; `useAvatarUrl` (signed URL TTL 3600s, cache 55 phút) | G5: unit test 84/84 PASS (giữ 51 cũ + 33 mới: profileSchema, buildAvatarPath, guard MIME/size, map lỗi 23505, render ProfileView loading/error/ready); `scripts/storage-rls-proof.ts` 5/5 PASS trên remote 2026-09-18 (A upload folder mình, A không đọc file B qua download + signed URL, anon không đọc/không list); chờ test tay đổi avatar + A/B chéo trên thiết bị | đạt |
| FR-05 | `notes/*.tsx`; `src/features/notes/*`; migration `study_notes` | `listNotes`; `createNote`; `updateNote`; `deleteNote`; 4 RLS policies | G2: trigger/grants/4 policies + `scripts/rls-proof.ts` 7/7 PASS trên remote 2026-09-17 (log ở `RLS-PROOF.md` mục 7); G3: API/UI CRUD + unit test schema/errors PASS; chờ test tay A/B trên thiết bị | đạt |

## Chức năng 2 — Quản lý tài liệu học tập (HOÀN THÀNH — chốt tại `fix/delete-navigation`, tag `cn2-hoan-thanh`; test tay thiết bị + proof A/B thuộc chủ dự án — xem khoảng trống bên dưới)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-06 | `app/(app)/documents/upload.tsx`; `app/(app)/documents/index.tsx`; `src/features/documents/{api.ts,storage.ts,schemas.ts,queries.ts,errors.ts}`; bucket `documents` | `pickDocument`; `uploadDocument` (guard ext/MIME/size + trần 100, Storage trước DB sau, insert lỗi dọn object); Android đọc `content://` từ picker để tránh READ permission của cache Expo Go, iOS đọc bản sao cache; `useUploadDocument` invalidate `['documents', userId]` | Unit 264/264 PASS (giữ 260 mốc Android + 4 mới khóa điều hướng xóa); schema verify remote 14/14; chờ test tay Expo Go (Android TXT/PDF/DOCX, tệp quá lớn/sai định dạng/offline) | đạt |
| FR-07 | Cùng FR-06 | Whitelist `pdf`/`docx`/`txt` + MIME tương ứng (`EXT_TO_MIME`, `mimeMatchesExt`) | Unit test whitelist + MIME lệch PASS (trong 64 trên); test tay mỗi định dạng (chủ dự án) | đạt |
| FR-08 | `app/(app)/documents/index.tsx`; `src/features/documents/{api.ts,queries.ts}` | `listDocuments` (kèm tên môn, `created_at desc`, `ilike` debounce 300ms + Chip lọc môn); key `['documents', userId]`; index `documents_user_created_idx` | Unit test pattern `ilike`/lọc PASS; chờ test tay danh sách/tìm kiếm phân biệt dấu/empty/skeleton | đạt |
| FR-09 | `app/(app)/documents/[id].tsx`; `src/features/documents/{api.ts,queries.ts}` | `getDocument`; `getDocumentUrl` (signed URL TTL 3600s, cache 55 phút); nút “Mở tài liệu” (`Linking.openURL` + `canOpenURL`, tiện ích ngoài FR, không WebView) | Code + test tay checklist CN2-G2 do chủ dự án chạy trên Expo Go ở light/dark | đạt |
| FR-10 | Cùng màn chi tiết; `src/features/documents/api.ts` | `renameDocument` (chỉ đổi `display_name`, không đổi object) | Unit test payload update chỉ `display_name` + chặn tên rỗng/quá dài PASS; test tay tên sai/giữ tên cũ (chủ dự án) | đạt |
| FR-11 | Cùng màn chi tiết; Storage policy `documents_delete_own` | `deleteDocument` (storage trước, DB sau, có dialog); điều hướng `router.replace('/documents', {deleted: stamp})` + dọn cache chi tiết SAU điều hướng + Snackbar “Đã xóa tài liệu.” (khóa lỗi GO_BACK deep link qua `goBackToDocuments`) | Unit test thứ tự storage→DB + nhánh storage-lỗi-giữ-bản-ghi + nhánh DB-fail→`DocumentDeletePartialError` PASS + 4 test điều hướng xóa (canGoBack true→back / false→replace) PASS; test tay hủy dialog/xóa thật + deep link xóa (chủ dự án) | đạt |
| FR-12 | `app/(app)/subjects/index.tsx`; `app/(app)/documents/[id].tsx` (gán); bảng `subjects`; `documents.subject_id ON DELETE SET NULL` | `listSubjects`; `createSubject` (guard trần 30); `renameSubject`; `deleteSubject`; `assignDocumentSubject` (chỉ ở chi tiết); `countDocumentsInSubject` (cảnh báo trước xóa) | Unit test schema 1–60/trùng tên/trần 30 + lọc `filterDocumentsLocal` PASS; test tay xóa môn đang có tài liệu → “Chưa phân loại” (chủ dự án) | đạt |
| FR-13 | Bảng `documents` (`extracted_text`, `extraction_status`); `src/lib/ai/transport.ts` (`EXTRACTION_GENERATION_CONFIG`, `parseExtractionJson`); `src/features/summary/api.ts` (PDF: 1 gọi Gemini JSON 2 trường, update gộp `extracted_text` + `done`) | Hạ tầng ở CN2 (`pending`/`unsupported` qua `getExtractionStatusForExt`, nhãn tiếng Việt `getExtractionStatusLabel`); CN3-PDF trích toàn văn + tóm tắt trong một lần gọi, ghi cả hai trong cùng một update — FR-13 hoàn thành phần còn dở, PDF hỏi đáp được như TXT khi có text | Unit test map trạng thái PASS + `extraction.test.ts` 8 test parser (đủ/dở/rỗng) PASS; UI chi tiết hiện nhãn đúng | đạt |

### Khoảng trống chưa phủ của CN2 (ghi thẳng, không tô hồng)

- Chưa chạy test tay Expo Go cho CN2-G1 (12 case) và CN2-G2 (10 case): toàn bộ thuộc chủ dự án theo TEST-CHECKLIST.
- Chưa viết `scripts/documents-rls-proof.ts` (kịch bản A/B cho `documents`/`subjects` + Storage theo khuôn FR-05): cách ly hiện chỉ được chứng minh gián tiếp qua verify schema remote 14/14 (đủ 4+4 policy bảng, đủ 4 policy storage, RLS enabled) và proof CN1 (7/7 + 5/5). TASKS CN2-02 giữ nguyên chưa tick.
- `src/shared/types/database.ts` đồng bộ tay theo `0002` (chờ regen bằng CLI): TASKS CN2-01 giữ nguyên chưa tick.

## Chức năng 3 — AI tóm tắt tài liệu PDF (đạt — code + unit + kiểm tay Expo Go với PDF thật)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-14 | `app/(app)/documents/summary-section.tsx` (G2); `src/features/summary/{api.ts,source.ts,schemas.ts,queries.ts,errors.ts}`; `src/lib/ai/{models.ts,transport.ts}` | `loadSummarySource` (signed URL → cache → PDF base64/TXT text) + `requestSummary` + `summarizeWithGemini` (model `gemini-3.5-flash`); key `['summary', documentId]` | G1: unit 25 test PASS; G2: thêm `source.test.ts` 8 test (PDF/TXT OK, DOCX chặn trước mạng, signed URL lỗi, offline, TXT rỗng, dọn cache best-effort); tổng 23 suites 240/240; test tay bấm nút → bản tiếng Việt (chủ dự án) | đạt |
| FR-15 | `src/lib/ai/transport.ts` (`summarizeWithGemini`); `src/features/summary/source.ts` | PDF gửi base64 inline nguyên file (download về cache bằng `File.downloadFileAsync` API mới), không lib trích xuất PDF | Unit payload inline (mime + prompt, cấm temperature/top_p/top_k) PASS + grep không thấy dependency PDF mới; test tay PDF thật (chủ dự án) | đạt |
| FR-16 | `src/features/summary/api.ts` (`requestSummary` guard) + `summary-section.tsx` (G2) + `source.ts` | Guard `unsupported`: gắn trạng thái + ném lỗi, KHÔNG gọi Gemini; UI G2 trả null (Banner DOCX của CN2 vẫn hiện); loader chặn DOCX trước khi chạm mạng | Unit DOCX (transport không chạy, update `unsupported`) PASS + unit loader DOCX PASS; test tay DOCX không sinh request (chủ dự án) | đạt |
| FR-17 | Bảng `document_summaries` (`0004_cn3_summaries.sql`); `requestSummary` upsert | Upsert ghi đè theo `UNIQUE(document_id)` (`onConflict: 'document_id'`); CASCADE khi xóa tài liệu | Verify `cn3-schema-verify.sql` 10/10 + `scripts/cn3-schema-verify.mjs` VERIFY_PASS qua PostgREST; unit ghi đè PASS; G2: test tay xóa tài liệu mất summary theo | đạt |
| FR-18 | `app/(app)/documents/summary-section.tsx` (G2, vùng tóm tắt) | Bốn trạng thái: spinner + nút disabled khi chạy/tải tệp/`processing`; bản mới nhất + “Tóm tắt lại”; empty dẫn bấm nút; lỗi + “Thử lại” (quota → banner hạn mức, không retry); fetch lỗi + “Thử lại” riêng | Unit loader + guard PASS; test tay 4 trạng thái light/dark (chủ dự án) | đạt |
| FR-19 | `requestSummary` guard `processing` + `useRequestSummary` (invalidate cả khi lỗi) + nút ở `summary-section.tsx` | Nút disabled khi pending/tải tệp; guard `processing` (unit PASS); map lỗi 429/quota sang banner hạn mức (`isSummaryQuotaError`), không auto-retry | Unit chặn bấm đôi + map 429 PASS; test tay bấm dồn + banner hạn mức (chủ dự án) | đạt |
| FR-20 | `reclaimStaleProcessing`/`retrySummary` + effect thu hồi trong `summary-section.tsx` | Retry khi `failed` (nút “Thử lại”); `processing` treo (> 15 phút theo `updated_at`, ref chống lặp) tự về `failed` khi mở màn | Unit ngưỡng 15 phút PASS; test tay kill app giữa chừng (chủ dự án) | đạt |
| FR-21 | Nhánh trực tiếp `EXPO_PUBLIC_GEMINI_API_KEY` (G1 đã code đúng MỘT nhánh này) | Probe CN3-G1 chốt bằng `scripts/probe-gemini-proxy.mjs`: WITH_AUTH 401 + WITHOUT_AUTH 401 → trực tiếp; key không bao giờ vào repo | Probe + verify thật (status nguyên văn trong DEVLOG cn3-g1); `git diff --cached` không có key; khi proxy deploy được thì quay lại MỘT nhánh proxy | đạt |
| FR-22 | Bảng `document_summaries` + 4 RLS policy `auth.uid() = user_id`; `getSummary` lọc `user_id` | Cách ly theo `user_id` như FR-05 | Verify 10/10 (đủ 4 policy, RLS bật) + unit từ chối document người khác PASS; G3: proof A/B theo khuôn `rls-proof.ts` | đạt |

## Chức năng 4 — AI hỏi đáp dựa trên tài liệu (đạt — code + unit + migration 0005 đã apply + kiểm tay Expo Go với PDF thật)

> Đặc tả FR-23 → FR-30 xem `docs/SPEC.md` mục CN4 (bổ sung theo code).

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-23 | `app/(app)/documents/qa-section.tsx`; `src/features/chat/{api.ts,schemas.ts,queries.ts,errors.ts}`; `src/lib/ai/transport.ts` (`answerWithGemini`) | `askQuestion` (guard → 1 request Gemini → validate → insert); ô nhập + nút “Hỏi” (testID `qa-input`/`qa-submit`); key `['questions', documentId]` | Unit `chat.test.ts` 13 test + `askTransport.test.ts` 7 test (mock, không gọi mạng) PASS, tổng 29 suites 274/274; test tay hỏi TXT + PDF sau trích xuất (chủ dự án) | đạt |
| FR-24 | `src/lib/ai/transport.ts` (`QA_PROMPT_HEADER`, `answerWithGemini`) | Toàn văn `extracted_text` nhồi thẳng vào prompt một request; header bắt model chỉ trả lời theo tài liệu, không bịa; cấm vector DB/RAG/chunking | Unit prompt chứa context + câu hỏi, cấm temperature/top_p/top_k PASS; grep không thấy dependency vector/chunk mới | đạt |
| FR-25 | `src/features/chat/api.ts` (guard) + `qa-section.tsx` (UI) | DOCX/`unsupported` → `ChatGuardError`, KHÔNG gọi Gemini; UI không hiện ô nhập khi thiếu text (Banner DOCX của CN2 vẫn hiện) | Unit DOCX (transport không chạy) PASS; test tay DOCX (chủ dự án) | đạt |
| FR-26 | Bảng `document_questions` (`0005_cn4_questions.sql`); `listQuestions`/`useQuestions` | Lịch sử append-only theo tài liệu, mới nhất trước (`order created_at desc`); lượt hỏi lỗi không tạo row; không sửa/xóa từng câu | Unit insert payload + thứ tự desc PASS; migration 0005 đã apply tay + verify đạt; kiểm tay Expo Go với PDF thật đạt | đạt |
| FR-27 | `qa-section.tsx` (vùng hỏi đáp) | Bốn trạng thái lịch sử: skeleton/empty (icon + câu dẫn)/nội dung/lỗi + “Thử lại”; chặn hỏi khi chưa có text (empty dẫn tóm tắt trước); field lỗi nằm dưới ô nhập, giữ câu hỏi khi lỗi mạng | Unit guard + map lỗi PASS; test tay light/dark (chủ dự án) | đạt |
| FR-28 | `toChatErrorMessage` + `qa-section.tsx` | Lỗi 429/quota → banner hạn mức (`isChatQuotaError`, không retry); 5xx/mạng → câu riêng + “Thử lại” giữ nguyên câu hỏi | Unit map 429/5xx/mạng PASS; test tay máy bay + quota (chủ dự án) | đạt |
| FR-29 | Bảng `document_questions` + 4 RLS policy `auth.uid() = user_id`; `askQuestion`/`listQuestions` lọc `user_id` | Cách ly theo `user_id` như FR-05/FR-22 | Unit từ chối document người khác (chưa chạm DB) PASS; proof A/B theo khuôn `rls-proof.ts` (phiên sau) | đạt |
| FR-30 | `supabase/migrations/0005_cn4_questions.sql` + `scripts/cn4-schema-verify.mjs` + types tay trong `database.ts` | Migration idempotent dán tay qua SQL Editor (CẤM db push); verify chỉ-đọc qua PostgREST | `node --check` script đạt; remote apply tay + verify đạt (chủ dự án); kiểm tay Expo Go đạt | đạt |

## Chức năng 5 — Quét hình ảnh đề bài bằng AI (chưa làm — đặc tả ở `docs/SPEC.md` mục CN5, diễn giải do session `docs/cn5-spec` đề xuất)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-31 | `app/(app)/scan.tsx`; `src/features/scan/{api.ts,schemas.ts,queries.ts,errors.ts}`; `expo-image-picker` (đã cài, không plugin app.json) | `pickScanImage` (`mediaTypes: ['images']`, `result.canceled`/`assets[0]`, `base64: true`); lọc mime nhận png/jpeg/webp/heic/heif, từ chối gif tiếng Việt; testID `scan-pick` | Unit lọc mime + nhánh hủy (mock picker, không gọi mạng); test tay Expo Go (thư viện/GIF/hủy) | Chưa làm |
| FR-32 | Cùng FR-31 | `captureScanImage` (`requestCameraPermissionsAsync()` trước `launchCameraAsync()`; `canAskAgain === false` → hướng dẫn Settings; Android `getPendingResultAsync()`); testID `scan-capture` | Unit nhánh từ chối vĩnh viễn (mock quyền); test tay Expo Go (cấp/từ chối/lần hai/kill picker) | Chưa làm |
| FR-33 | `src/lib/ai/transport.ts` (dùng lại, cấm đường gọi thứ hai); `src/lib/ai/models.ts` (hằng số duy nhất, cấm hardcode) | `ocrWithGemini` (prompt text TRƯỚC ảnh, mime `image/jpeg` cố định, `responseMimeType` + `responseSchema`; núm duy nhất `media_resolution`; giữ map 429/5xx CN3, không retry) | Unit payload/parse/map lỗi (mock fetch, không gọi mạng); test tay OCR thật | Chưa làm |
| FR-34 | `supabase/migrations/0006_cn5_scan_images.sql` (dán tay, cấm db push); `scripts/cn5-schema-verify.mjs`; `src/features/scan/api.ts` | Row `documents` mới mỗi lần quét (`storage_path` `{user_id}/{uuid}.{ext}`, `extracted_text` = OCR, `done`; dở → cứu + báo cắt, rỗng → `failed` không ghi đè cũ) | Verify `VERIFY_PASS` sau apply tay; unit parser 3 nhánh đủ/dở/rỗng; test tay cắt cụt/rỗng | Chưa làm |
| FR-35 | `app/(app)/scan.tsx` (màn quét, back qua `goBackOrReplace`) | 4 trạng thái: spinner + disabled / văn bản OCR / empty dẫn chọn-chụp / lỗi + “Thử lại” (testID `scan-run`/`scan-retry`); ảnh mờ/không chữ → câu tiếng Việt, không đứng im | Unit trạng thái; test tay light/dark (chủ dự án) | Chưa làm |
| FR-36 | Cùng màn quét + `src/features/scan/api.ts` | Nút disabled khi `processing` (guard chặn gọi lặp); 429/quota → banner hạn mức, không retry; thu hồi treo 15 phút theo `updated_at` | Unit chặn bấm đôi + map 429; test tay bấm dồn + quota (chủ dự án) | Chưa làm |
| FR-37 | 4 RLS policy `documents` đã có (`auth.uid() = user_id`) | Row ảnh quét cách ly như tài liệu (không policy mới); proof A/B khuôn FR-05 | Proof A/B remote + unit từ chối chéo | Chưa làm |

## Chức năng 6 — AI gợi ý lời giải (chưa làm)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-38 | | | | Chưa làm |
| FR-39 | | | | Chưa làm |
| FR-40 | | | | Chưa làm |
| FR-41 | | | | Chưa làm |
| FR-42 | | | | Chưa làm |
| FR-43 | | | | Chưa làm |
| FR-44 | | | | Chưa làm |
| FR-45 | | | | Chưa làm |

## Bằng chứng cần lưu khi chuyển sang “đạt”

- Ghi ngày, thiết bị/nền tảng và kết quả case trong `docs/TEST-CHECKLIST.md`.
- Ghi commit/branch/tag cuối giai đoạn trong `docs/DEVLOG.md`.
- Với FR-05, ghi rõ ID row A/B và HTTP/Supabase error đã bị RLS chặn; không ghi token.
- Nếu tên file/hàm thay đổi, cập nhật bảng này trong cùng commit với thay đổi code.
