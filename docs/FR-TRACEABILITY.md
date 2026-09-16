# Truy vết yêu cầu

Chỉ chuyển trạng thái sau khi file/hàm tồn tại và case test tương ứng đã chạy. Giá trị hợp lệ: `chưa làm`, `đang làm`, `đạt`, `lỗi`.

| FR | File dự kiến | Hàm/điểm kiểm soát dự kiến | Cách kiểm thử | Trạng thái |
|---|---|---|---|---|
| FR-01 | `app/(auth)/sign-up.tsx`; `src/features/auth/api.ts`; `schemas.ts`; migration profile | `signUp`; `signUpSchema`; `handle_new_user` | Đăng ký hợp lệ, email trùng, input sai; xác nhận đúng một profile | chưa làm |
| FR-02 | `app/(auth)/sign-in.tsx`; `app/(app)/profile.tsx`; `src/features/auth/api.ts`; `useSession.ts` | `signIn`; `signOut`; `useSession` | Login đúng/sai, restart app giữ session, logout xóa cache/route, token hết hạn | chưa làm |
| FR-03 | `forgot-password.tsx`; `reset-password.tsx`; auth API/schema; `app.json` | `requestPasswordReset`; `updatePassword`; recovery handler | Email reset, deep link hợp lệ, link hết hạn/dùng lại, offline | chưa làm |
| FR-04 | `profile.tsx`; `src/features/profile/*`; migration profile/Storage policy | `getProfile`; `updateProfile`; `uploadAvatar` | Sửa field/avatar; dữ liệu sai/offline; user A không đọc/sửa profile/avatar B | chưa làm |
| FR-05 | `notes/*.tsx`; `src/features/notes/*`; migration `study_notes` | `listNotes`; `createNote`; `updateNote`; `deleteNote`; 4 RLS policies | CRUD bình thường và gọi Data API chéo A/B cho từng lệnh | chưa làm |

## Bằng chứng cần lưu khi chuyển sang “đạt”

- Ghi ngày, thiết bị/nền tảng và kết quả case trong `docs/TEST-CHECKLIST.md`.
- Ghi commit/branch/tag cuối giai đoạn trong `docs/DEVLOG.md`.
- Với FR-05, ghi rõ ID row A/B và HTTP/Supabase error đã bị RLS chặn; không ghi token.
- Nếu tên file/hàm thay đổi, cập nhật bảng này trong cùng commit với thay đổi code.
