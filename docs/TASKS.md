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

---

# Backlog CN2 — Quản lý tài liệu học tập (FR-06 → FR-13)

Chia BA phiên code, mỗi phiên một branch, merge `--no-ff` và tag riêng sau
khi cổng xanh (quyết định chủ dự án 2026-09-19). Mỗi checkbox là một commit
độc lập và phải để app chạy được. Trước commit chạy `npx tsc --noEmit`,
`npm run lint`, `npm test` và test tay phần liên quan; staged diff phải không
có secret. Push ngay sau commit.

- Phiên 1 — branch `feat/cn2-g1`, tag `cn2-g1`: CN2-01 → CN2-05 (nền + tải
  lên + danh sách). Lý do: xong phiên 1 là có luồng dọc chạy được — tải tệp
  lên và thấy ngay trong danh sách; các phiên sau chỉ đắp thêm thao tác.
- Phiên 2 — branch `feat/cn2-g2`, tag `cn2-g2`: CN2-06 → CN2-09 (chi tiết +
  đổi tên/xóa + môn học). Lý do: hoàn thiện CRUD trên nền đã chạy, không đụng
  luồng tải lên.
- Phiên 3 — branch `feat/cn2-polish`, tag `v2.0.0`: CN2-10 → CN2-13 (hạ tầng
  FR-13 + DESIGN-SYSTEM + test + chuẩn hóa bảng màu). Lý do: đóng gói toàn
  CN2 nên xứng đáng mốc version lớn; task màu đặt cuối vì đổi theme sớm làm
  hỏng mọi ảnh chụp đã có.

## CN2-1 — Nền tảng schema, RLS, repository, màn rỗng (phiên 1)

- [ ] CN2-01: Áp DDL `subjects` + `documents` (theo `docs/DATA-MODEL.md`), RLS
  4 lệnh mỗi bảng, bucket private `documents` + 4 Storage policy bằng SQL tay
  trên Dashboard; regen `database.ts` bằng CLI. Xong khi Table Editor hiện RLS
  enabled và bucket private. FR: FR-06..FR-13 (nền).
- [ ] CN2-02: Viết `src/features/documents/{api.ts,storage.ts,schemas.ts,queries.ts,errors.ts}`
  (pick/guard/upload/list/get/rename/delete documents + CRUD subjects + signed
  URL TTL 3600s) và `scripts/documents-rls-proof.ts` theo khuôn FR-05; chạy
  proof trên remote đạt 100%. FR: FR-06..FR-13 (nền).
- [x] CN2-03: Màn `/documents` rỗng (Appbar + empty state đúng DESIGN-SYSTEM)
  nối vào dashboard (thẻ CN2 dẫn tới đây); thẻ CN3–6 vẫn "Sắp có". Xong khi
  điều hướng không crash ở cả light/dark. FR: FR-08 (khung).
  (2026-09-20, G1: làm vượt khung — danh sách thật skeleton/empty/error/retry +
  pull-to-refresh, chưa tìm kiếm/lọc; thẻ CN2 chip “Đang làm”.)

## CN2-2 — Tải lên (FR-06, FR-07, phiên 1)

- [x] CN2-04: Màn `/documents/upload`: `expo-document-picker` + guard
  ext/MIME/size (trước khi đọc) + guard giới hạn 100 tài liệu (`count` trước
  insert) + upload base64→ArrayBuffer + progress + Snackbar. Xong khi tệp hợp
  lệ lên được, tệp sai/quá lớn/vượt giới hạn bị chặn, offline báo retry. FR: FR-06, FR-07.
  (2026-09-20, G1: xong, chờ test tay Expo Go.)

## CN2-3 — Danh sách và chi tiết (FR-08, FR-09, phiên 1 + 2)

- [ ] CN2-05: Danh sách `/documents` thật: skeleton/empty/error/retry,
  sắp `created_at desc`, lọc theo môn, ô tìm kiếm theo tên (`ilike`, phân
  biệt dấu), pull-to-refresh. FR: FR-08, FR-12 (lọc).
- [ ] CN2-06: Chi tiết `/documents/[id]`: tên/ngày/dung lượng/định dạng/
  môn/trạng thái trích xuất + nút “Mở tài liệu” (`Linking.openURL`,
  tiện ích ngoài FR) + đổi môn học tại đây (danh sách không có menu đổi
  nhanh). FR: FR-09.

## CN2-4 — Đổi tên và xóa (FR-10, FR-11, phiên 2)

- [ ] CN2-07: Đổi tên chỉ nhãn DB (không đổi object storage) + gán môn học
  trong màn chi tiết; validate 1–120. FR: FR-10, FR-12 (gán).
- [ ] CN2-08: Xóa có dialog xác nhận, thứ tự storage-trước-DB-sau theo
  ARCHITECTURE; không còn bản ghi trỏ hư không. FR: FR-11.

## CN2-5 — Môn học (FR-12, phiên 2)

- [ ] CN2-09: Màn `/subjects`: CRUD môn (validate 1–60, không trùng tên),
  xóa môn đang có tài liệu báo trước “về Chưa phân loại”. Xong khi xóa môn
  không mất tài liệu nào (`ON DELETE SET NULL`). FR: FR-12.

## CN2-6 — Hạ tầng FR-13, DESIGN-SYSTEM, hoàn thiện (phiên 3)

- [ ] CN2-10: Cột `extracted_text` + `extraction_status` hoạt động:
  PDF/TXT mới nhận `pending`, DOCX nhận `unsupported` + gợi ý chuyển sang PDF;
  UI hiện trạng thái đúng. FR: FR-13 (hạ tầng; thực thi ở CN3).
- [ ] CN2-11: Áp `docs/DESIGN-SYSTEM.md` cho mọi màn CN2 (token màu/spacing,
  skeleton/empty/error/Snackbar, đo contrast cặp màu mới, light+dark). FR:
  FR-06..FR-13 (giao diện).
- [ ] CN2-12: Unit test (schema, whitelist, giới hạn size, format dung lượng,
  dựng path, suy loại tệp — mock supabase/picker/file-system, không gọi mạng),
  cập nhật traceability/checklist/devlog/báo cáo theo code cuối. FR: FR-06..FR-13.
- [ ] CN2-13 (CUỐI CÙNG): Chuẩn hóa bảng màu — thay bộ màu mặc định của Paper
  bằng bộ màu riêng sinh từ seed indigo `#4A5FC1` (theo `docs/DESIGN-SYSTEM.md`),
  áp cho toàn app gồm cả các màn CN1, cập nhật bảng token bằng giá trị thật,
  rồi chụp lại toàn bộ ảnh báo cáo. Đặt cuối vì đổi theme sớm làm hỏng mọi ảnh
  đã chụp. FR: FR-06..FR-13 (giao diện).
