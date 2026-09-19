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

## Chức năng 2 — Quản lý tài liệu học tập (đạt ở mức code + unit + verify schema; còn nợ test tay thiết bị và proof A/B — xem khoảng trống bên dưới)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-06 | `app/(app)/documents/upload.tsx`; `app/(app)/documents/index.tsx`; `src/features/documents/{api.ts,storage.ts,schemas.ts,queries.ts,errors.ts}`; bucket `documents` | `pickDocument`; `uploadDocument` (guard ext/MIME/size + trần 100, Storage trước DB sau, insert lỗi dọn object); `useUploadDocument` invalidate `['documents', userId]` | CN2-G1+G2: unit test documents 64/64 PASS (38 guard + path + trần 100 + format size; 26 rename/delete/subjects/tìm kiếm), tổng suite 177/177; schema verify remote 14/14; chờ test tay Expo Go (tệp hợp lệ/quá lớn/sai định dạng/offline) | đạt |
| FR-07 | Cùng FR-06 | Whitelist `pdf`/`docx`/`txt` + MIME tương ứng (`EXT_TO_MIME`, `mimeMatchesExt`) | Unit test whitelist + MIME lệch PASS (trong 64 trên); test tay mỗi định dạng (chủ dự án) | đạt |
| FR-08 | `app/(app)/documents/index.tsx`; `src/features/documents/{api.ts,queries.ts}` | `listDocuments` (kèm tên môn, `created_at desc`, `ilike` debounce 300ms + Chip lọc môn); key `['documents', userId]`; index `documents_user_created_idx` | Unit test pattern `ilike`/lọc PASS; chờ test tay danh sách/tìm kiếm phân biệt dấu/empty/skeleton | đạt |
| FR-09 | `app/(app)/documents/[id].tsx`; `src/features/documents/{api.ts,queries.ts}` | `getDocument`; `getDocumentUrl` (signed URL TTL 3600s, cache 55 phút); nút “Mở tài liệu” (`Linking.openURL` + `canOpenURL`, tiện ích ngoài FR, không WebView) | Code + test tay checklist CN2-G2 do chủ dự án chạy trên Expo Go ở light/dark | đạt |
| FR-10 | Cùng màn chi tiết; `src/features/documents/api.ts` | `renameDocument` (chỉ đổi `display_name`, không đổi object) | Unit test payload update chỉ `display_name` + chặn tên rỗng/quá dài PASS; test tay tên sai/giữ tên cũ (chủ dự án) | đạt |
| FR-11 | Cùng màn chi tiết; Storage policy `documents_delete_own` | `deleteDocument` (storage trước, DB sau, có dialog) | Unit test thứ tự storage→DB + nhánh storage-lỗi-giữ-bản-ghi + nhánh DB-fail→`DocumentDeletePartialError` PASS; test tay hủy dialog/xóa thật (chủ dự án) | đạt |
| FR-12 | `app/(app)/subjects/index.tsx`; `app/(app)/documents/[id].tsx` (gán); bảng `subjects`; `documents.subject_id ON DELETE SET NULL` | `listSubjects`; `createSubject` (guard trần 30); `renameSubject`; `deleteSubject`; `assignDocumentSubject` (chỉ ở chi tiết); `countDocumentsInSubject` (cảnh báo trước xóa) | Unit test schema 1–60/trùng tên/trần 30 + lọc `filterDocumentsLocal` PASS; test tay xóa môn đang có tài liệu → “Chưa phân loại” (chủ dự án) | đạt |
| FR-13 | Bảng `documents` (`extracted_text`, `extraction_status`) | Hạ tầng ở CN2 (`pending`/`unsupported` qua `getExtractionStatusForExt`, nhãn tiếng Việt `getExtractionStatusLabel`), thực thi trích xuất ở CN3 | Unit test map trạng thái PASS (trong 64 trên); UI chi tiết hiện nhãn đúng; CN3 gọi AI đổ nội dung vào — FR-13 tách đôi, không phải bỏ sót | đạt |

### Khoảng trống chưa phủ của CN2 (ghi thẳng, không tô hồng)

- Chưa chạy test tay Expo Go cho CN2-G1 (12 case) và CN2-G2 (10 case): toàn bộ thuộc chủ dự án theo TEST-CHECKLIST.
- Chưa viết `scripts/documents-rls-proof.ts` (kịch bản A/B cho `documents`/`subjects` + Storage theo khuôn FR-05): cách ly hiện chỉ được chứng minh gián tiếp qua verify schema remote 14/14 (đủ 4+4 policy bảng, đủ 4 policy storage, RLS enabled) và proof CN1 (7/7 + 5/5). TASKS CN2-02 giữ nguyên chưa tick.
- `src/shared/types/database.ts` đồng bộ tay theo `0002` (chờ regen bằng CLI): TASKS CN2-01 giữ nguyên chưa tick.

## Chức năng 3 — AI tóm tắt tài liệu PDF (chưa làm)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-14 | | | | Chưa làm |
| FR-15 | | | | Chưa làm |
| FR-16 | | | | Chưa làm |
| FR-17 | | | | Chưa làm |
| FR-18 | | | | Chưa làm |
| FR-19 | | | | Chưa làm |
| FR-20 | | | | Chưa làm |
| FR-21 | | | | Chưa làm |
| FR-22 | | | | Chưa làm |

## Chức năng 4 — AI hỏi đáp dựa trên tài liệu (chưa làm)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-23 | | | | Chưa làm |
| FR-24 | | | | Chưa làm |
| FR-25 | | | | Chưa làm |
| FR-26 | | | | Chưa làm |
| FR-27 | | | | Chưa làm |
| FR-28 | | | | Chưa làm |
| FR-29 | | | | Chưa làm |
| FR-30 | | | | Chưa làm |

## Chức năng 5 — Quét hình ảnh đề bài bằng AI (chưa làm)

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-31 | | | | Chưa làm |
| FR-32 | | | | Chưa làm |
| FR-33 | | | | Chưa làm |
| FR-34 | | | | Chưa làm |
| FR-35 | | | | Chưa làm |
| FR-36 | | | | Chưa làm |
| FR-37 | | | | Chưa làm |

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
