# Backlog 5 giai đoạn

Mỗi checkbox là một commit độc lập và phải để app chạy được. Trước commit chạy `npx tsc --noEmit`, `npm run lint`, test tay phần liên quan; staged diff phải không có secret. Push ngay sau commit.

## G1 — Nền Expo và cấu hình

- Branch: `feat/g1-setup`
- Tag sau khi PR được merge: `g1-done`

- [x] Khởi tạo Expo SDK 57 TypeScript strict + expo-router chạy bằng Expo Go; kiểm tra package không deprecated/không xung đột trước khi cài bằng `npx expo install`. File: `package.json`, `app.json`, `tsconfig.json`, `eslint.config.js`, Expo template files. FR: nền cho FR-01..FR-05.
- [x] Cài đúng stack đã duyệt và tạo providers Paper/Query. File: `package.json`, lockfile, `app/_layout.tsx`, `src/providers/AppProviders.tsx`, `src/lib/queryClient.ts`. FR: nền cho FR-01..FR-05.
- [x] Cấu hình env và Supabase client với AsyncStorage/session refresh. File: `.env.example`, `src/lib/env.ts`, `src/lib/supabase.ts`. FR: FR-01..FR-05.
- [x] Tạo route skeleton + auth guard chạy được, chưa có nghiệp vụ. File: `app/index.tsx`, `app/(auth)/_layout.tsx`, `app/(app)/_layout.tsx`, `src/features/auth/useSession.ts`. FR: FR-02.

## G2 — Database, RLS và Storage

- Branch: `feat/g2-database`
- Tag sau khi PR được merge: `g2-done`

- [x] Viết migration `profiles`, `study_notes`, constraints/index và trigger. File: `supabase/migrations/0001_account_manager.sql`. FR: FR-04, FR-05.
- [x] Thêm RLS policy SELECT/INSERT/UPDATE/DELETE và Storage `avatars`; kiểm thử bằng user A/B. File: cùng migration, `docs/RLS-PROOF.md`, `docs/TEST-CHECKLIST.md`. FR: FR-04, FR-05.
- [x] Sinh database types sau khi apply migration. File: `src/types/database.ts`. FR: FR-04, FR-05.

## G3 — Auth lõi và ghi chú

- Branch: `feat/g3-auth-core`
- Tag sau khi PR được merge: `g3-done`

- [x] Làm schema/API/form đăng ký. File: `src/features/auth/{schemas.ts,api.ts}`, `app/(auth)/sign-up.tsx`, shared form components. FR: FR-01.
- [x] Làm form đăng nhập, session redirect và đăng xuất. File: `app/(auth)/sign-in.tsx`, `app/(app)/profile.tsx`, auth feature files. FR: FR-02.
- [x] Làm API/query và danh sách notes với loading/empty/error. File: `src/features/notes/{api.ts,schemas.ts,queries.ts}`, `app/(app)/notes/index.tsx`. FR: FR-05.
- [x] Làm tạo, sửa, xóa note tối thiểu. File: `app/(app)/notes/new.tsx`, `app/(app)/notes/[id].tsx`, notes feature files. FR: FR-05.

## G4 — Quên và đặt lại mật khẩu

- Branch: `feat/g4-password-reset`
- Tự merge vào `main` sau khi cổng chất lượng xanh, tag: `g4-done` (quyết định chủ dự án 2026-09-18, không mở PR)

- [x] Làm API `resetPasswordForEmail` và form gửi mã OTP 6 số. File: `src/features/auth/api.ts`, `app/(auth)/forgot-password.tsx`. FR: FR-03.
- [x] Xác minh email + OTP bằng `verifyOtp` type `recovery`, rồi đổi mật khẩu. File: `app/(auth)/verify-reset-otp.tsx`, `app/(auth)/reset-password.tsx`, auth feature files, route guard. FR: FR-03.
- [x] Resend cooldown 60s, đổi mật khẩu khi đã đăng nhập (`/profile/change-password`), unit test schema OTP/mật khẩu/map lỗi, tài liệu FR-03. File: `src/features/auth/{schemas.ts,errors.ts,recovery.ts,recoveryStorage.ts}`, `__tests__/`, `app/(app)/profile/{index.tsx,change-password.tsx}`, `docs/*.md`. FR: FR-03. Deep link không làm (OTP là luồng chính theo SPEC).

## G5 — Hồ sơ, hoàn thiện và tài liệu

- Branch: `feat/g5-profile-docs`
- Tự merge vào `main` sau khi cổng chất lượng xanh, tag: `g5-done` (quyết định chủ dự án 2026-09-18, không mở PR)

- [x] Làm API/query/form cập nhật profile. File: `src/features/profile/{api.ts,schemas.ts,queries.ts,errors.ts}`, `src/features/profile/ProfileView.tsx`, `app/(app)/profile/index.tsx`. FR: FR-04.
- [x] Làm chọn/upload/thay avatar đúng Storage policy. File: `src/features/profile/{avatar.ts,pickAvatar.ts}`, profile feature và screen, `package.json` (expo-image-picker, expo-image-manipulator, base64-arraybuffer). FR: FR-04.
- [x] Chạy toàn bộ checklist hai tài khoản, rà type/lint và sửa lỗi trong phạm vi. File: `scripts/storage-rls-proof.ts` 5/5 PASS, `docs/TEST-CHECKLIST.md`. FR: FR-01..FR-05.
- [x] Cập nhật traceability, setup, devlog và nguyên liệu báo cáo theo code cuối. File: `README.md`, `docs/*.md`. FR: FR-01..FR-05.

Bài 1 DONE (G5): FR-01 → FR-05 đạt, tag `g5-done` + `v1.0.0`.
