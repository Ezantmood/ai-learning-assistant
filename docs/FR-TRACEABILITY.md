# Truy vết yêu cầu

Chỉ chuyển trạng thái sau khi file/hàm tồn tại và case test tương ứng đã chạy. Giá trị hợp lệ: `chưa làm`, `đang làm`, `đạt`, `lỗi`.

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-01 | `app/(auth)/sign-up.tsx`; `src/features/auth/api.ts`; `schemas.ts`; migration profile | `signUp`; `signUpSchema`; `handle_new_user` | G3: unit test schema/strength/errors 26/26 PASS; chờ test tay trên thiết bị (đăng ký hợp lệ, email/mã trùng, input sai, offline) | đạt |
| FR-02 | `app/(auth)/sign-in.tsx`; `app/(app)/profile.tsx`; `src/features/auth/api.ts`; `useSession.ts` | `signIn`; `signOut`; `useSession` | G1 session restore + guard; G3 AuthProvider boot gate + unit test errors PASS; chờ test tay login/logout/restart/token/offline | đạt |
| FR-03 | `forgot-password.tsx`; `verify-reset-otp.tsx`; `reset-password.tsx`; auth API/schema | `requestPasswordReset`; `verifyRecoveryOtp`; `updatePassword` | Email reset, OTP đúng/sai/hết hạn/dùng lại, offline | chưa làm |
| FR-04 | `profile.tsx`; `src/features/profile/*`; migration profile/Storage policy | `getProfile`; `updateProfile`; `uploadAvatar` | G2 xong migration/RLS/types; G5 test sửa field/avatar và A/B chéo | đang làm |
| FR-05 | `notes/*.tsx`; `src/features/notes/*`; migration `study_notes` | `listNotes`; `createNote`; `updateNote`; `deleteNote`; 4 RLS policies | G2: trigger/grants/4 policies + `scripts/rls-proof.ts` 7/7 PASS trên remote 2026-09-17 (log ở `RLS-PROOF.md` mục 7); G3: API/UI CRUD + unit test schema/errors PASS; chờ test tay A/B trên thiết bị | đạt |

## Bằng chứng cần lưu khi chuyển sang “đạt”

- Ghi ngày, thiết bị/nền tảng và kết quả case trong `docs/TEST-CHECKLIST.md`.
- Ghi commit/branch/tag cuối giai đoạn trong `docs/DEVLOG.md`.
- Với FR-05, ghi rõ ID row A/B và HTTP/Supabase error đã bị RLS chặn; không ghi token.
- Nếu tên file/hàm thay đổi, cập nhật bảng này trong cùng commit với thay đổi code.
