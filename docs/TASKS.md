# Backlog 5 giai đoạn

Mỗi checkbox là một commit độc lập và phải để app chạy được. Trước commit chạy `npx tsc --noEmit`, `npm run lint`, test tay phần liên quan; staged diff phải không có secret. Push ngay sau commit.

## G1 — Nền Expo và cấu hình

- Branch: `feat/g1-setup`
- Tag sau khi PR được merge: `g1-done`

- [ ] Khởi tạo Expo SDK 57 TypeScript strict + expo-router; kiểm tra package không deprecated/không xung đột trước khi cài bằng `npx expo install`. File: `package.json`, `app.json`, `tsconfig.json`, `eslint.config.js`, Expo template files. FR: nền cho FR-01..FR-05.
- [ ] Cài đúng stack đã duyệt và tạo providers Paper/Query. File: `package.json`, lockfile, `app/_layout.tsx`, `src/providers/AppProviders.tsx`, `src/lib/queryClient.ts`. FR: nền cho FR-01..FR-05.
- [ ] Cấu hình env và Supabase client với AsyncStorage/session refresh. File: `.env.example`, `src/lib/env.ts`, `src/lib/supabase.ts`. FR: FR-01..FR-05.
- [ ] Tạo route skeleton + auth guard chạy được, chưa có nghiệp vụ. File: `app/index.tsx`, `app/(auth)/_layout.tsx`, `app/(app)/_layout.tsx`, `src/features/auth/useSession.ts`. FR: FR-02.

## G2 — Database, RLS và Storage

- Branch: `feat/g2-database`
- Tag sau khi PR được merge: `g2-done`

- [ ] Viết migration `profiles`, `study_notes`, constraints/index và trigger. File: `supabase/migrations/0001_account_manager.sql`. FR: FR-04, FR-05.
- [ ] Thêm RLS policy SELECT/INSERT/UPDATE/DELETE và Storage `avatars`; kiểm thử bằng user A/B. File: cùng migration, `docs/TEST-CHECKLIST.md`. FR: FR-04, FR-05.
- [ ] Sinh database types sau khi apply migration. File: `src/types/database.ts`. FR: FR-04, FR-05.

## G3 — Auth lõi và ghi chú

- Branch: `feat/g3-auth-core`
- Tag sau khi PR được merge: `g3-done`

- [ ] Làm schema/API/form đăng ký. File: `src/features/auth/{schemas.ts,api.ts}`, `app/(auth)/sign-up.tsx`, shared form components. FR: FR-01.
- [ ] Làm form đăng nhập, session redirect và đăng xuất. File: `app/(auth)/sign-in.tsx`, `app/(app)/profile.tsx`, auth feature files. FR: FR-02.
- [ ] Làm API/query và danh sách notes với loading/empty/error. File: `src/features/notes/{api.ts,schemas.ts,queries.ts}`, `app/(app)/notes/index.tsx`. FR: FR-05.
- [ ] Làm tạo, sửa, xóa note tối thiểu. File: `app/(app)/notes/new.tsx`, `app/(app)/notes/[id].tsx`, notes feature files. FR: FR-05.

## G4 — Quên và đặt lại mật khẩu

- Branch: `feat/g4-password-reset`
- Tag sau khi PR được merge: `g4-done`

- [ ] Cấu hình scheme/deep link và API gửi reset email. File: `app.json`, `src/features/auth/api.ts`, `app/(auth)/forgot-password.tsx`. FR: FR-03.
- [ ] Xử lý recovery session, link hết hạn và form đổi mật khẩu. File: `app/(auth)/reset-password.tsx`, auth feature files, route guard. FR: FR-03.
- [ ] Test reset thành công/hết hạn/offline/token hết hạn và sửa lỗi. File: `docs/TEST-CHECKLIST.md`, file lỗi thực tế nếu có. FR: FR-03.

## G5 — Hồ sơ, hoàn thiện và tài liệu

- Branch: `feat/g5-profile-docs`
- Tag sau khi PR được merge: `g5-done`

- [ ] Làm API/query/form cập nhật profile. File: `src/features/profile/{api.ts,schemas.ts,queries.ts}`, `app/(app)/profile.tsx`. FR: FR-04.
- [ ] Làm chọn/upload/thay avatar đúng Storage policy. File: profile feature và screen, `package.json` nếu cần dependency đã duyệt. FR: FR-04.
- [ ] Chạy toàn bộ checklist hai tài khoản, rà type/lint và sửa lỗi trong phạm vi. File: file lỗi thực tế, `docs/TEST-CHECKLIST.md`. FR: FR-01..FR-05.
- [ ] Cập nhật traceability, setup, devlog và nguyên liệu báo cáo theo code cuối. File: `README.md`, `docs/*.md`. FR: FR-01..FR-05.
