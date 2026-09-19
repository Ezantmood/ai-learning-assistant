# Nhật ký phát triển

File này chỉ ghi kết quả đã xảy ra; không chép lại backlog. Sau mỗi giai đoạn, thêm một mục theo mẫu dưới đây. Không ghi secret, email thật hoặc token.

## Mẫu ghi sau mỗi giai đoạn

### Gx — Tên giai đoạn — YYYY-MM-DD

**Đã làm gì**

- ...

**Quyết định và lý do**

- Quyết định: ...
- Lý do: ...

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → kết quả ...
- Lệnh: `npm run lint` → kết quả ...
- Test tay: case ... → kết quả ...

**Còn nợ / giới hạn đã biết**

- ... hoặc “Không”.

**Mốc Git**

- Commit cuối: `<full-hash>`
- Branch: `feat/gx-...`
- Tag: `gx-done` (chỉ ghi sau khi merge và push tag; trước đó ghi “chưa tạo”)
- PR: `<URL hoặc số PR>`

---

## Nhật ký

### G1 — Nền Expo và cấu hình — 2026-09-16

**Đã làm gì**

- Khởi tạo Expo SDK 57 + TypeScript strict + expo-router để chạy bằng Expo Go.
- Cài stack bắt buộc, tạo Paper/React Query providers.
- Validate ba biến env; tạo Supabase client lưu session bằng AsyncStorage và refresh theo AppState.
- Tạo route skeleton, session restore và guard cho nhóm public/private; chưa có nghiệp vụ Auth.
- Cập nhật tài liệu theo quyết định OTP 6 số và tắt email confirmation khi dev.

**Quyết định và lý do**

- Dùng OTP recovery thay deep link để luồng chính chạy trực tiếp trong Expo Go.
- Dùng ESLint 9 do `eslint-plugin-react` đi kèm Expo SDK 57 chưa hỗ trợ ESLint 10; không đổi plugin ngoài stack.

**Đã kiểm thử**

- `npx tsc --noEmit` → đạt.
- `npm run lint` → đạt.
- `npx expo install --check` → dependencies đúng SDK 57.
- Metro bundle iOS/Android → đạt; router root là `app/`, runtime `exposdk:57.0.0`.
- Chưa quét QR trên thiết bị thật vì cần chủ dự án điền Supabase env.

**Còn nợ / giới hạn đã biết**

- `npm audit` báo 14 moderate ở dependency Expo SDK 57; đề xuất fix là downgrade major sai stack nên không tự áp dụng.
- npm đánh dấu ESLint 9 hết hỗ trợ, nhưng ESLint 10 hiện làm `eslint-plugin-react@7.37.5` của Expo lỗi runtime.

**Mốc Git**

- Commit triển khai cuối: `7d14650a60dd054454f0b70ee83b61cf6ca53147`
- Branch: `feat/g1-setup`
- Tag: chưa tạo; chỉ tạo `g1-done` sau khi chủ dự án merge.
- PR: tạo sau commit tài liệu kết thúc G1.

---

### G2 — Database, RLS và Storage — 2026-09-17

**Đã làm gì**

- Viết `supabase/migrations/0001_account_manager.sql`: bảng `profiles`/`study_notes` kèm constraints/index, trigger `handle_new_user`/`set_updated_at`, RLS đủ 4 lệnh mỗi bảng và bucket private `avatars` với 4 Storage policy.
- Viết `docs/RLS-PROOF.md`: kịch bản A/B chứng minh FR-05 (SELECT chéo 0 dòng, INSERT/UPDATE/DELETE chéo bị chặn) kèm từng câu lệnh và kết quả mong đợi.
- Bổ sung `docs/DATA-MODEL.md`: giải thích vì sao chỉ lọc `.eq('user_id', uid)` ở client không an toàn và RLS mới là ranh giới bảo mật.
- Viết `src/types/database.ts` mirror từ migration (regen bằng CLI sau khi apply remote).
- Đánh dấu 3 checkbox G2 trong `docs/TASKS.md`; chuyển FR-04/FR-05 sang `đang làm` trong `docs/FR-TRACEABILITY.md`.

**Quyết định và lý do**

- Quyết định: tách `feat/g2-database` từ HEAD chứa code G1 thay vì `main` cũ, vì PR G1 (#1) vẫn OPEN và `main` chưa có code G1.
- Lý do: tạo từ `main` cũ sẽ mất toàn bộ code G1; branch G2 sẽ rebase/merge sau khi PR G1 được merge.
- Quyết định: `database.ts` viết tay mirror migration thay vì regen bằng CLI.
- Lý do: chưa có project ref/access token trong session này; file ghi rõ lệnh regen sau khi apply migration remote.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → đạt (trước mỗi commit).
- Migration chạy 2 lần liên tiếp trên Postgres 16 local (mock schema `auth`/`storage`) → không lỗi lần nào.
- Trigger: insert user hợp lệ tạo đúng 1 profile; thiếu `student_code` báo lỗi; trùng `student_code` đúng hoa/thường báo unique violation; `SV001` và `sv001` cùng tồn tại (case-sensitive); UPDATE bump `updated_at`.
- Chưa chạy migration trên Supabase remote và chưa test A/B thực tế — chủ dự án chạy SQL Editor và `docs/RLS-PROOF.md` rồi ghi kết quả vào `docs/TEST-CHECKLIST.md`.

**Còn nợ / giới hạn đã biết**

- Cần apply migration lên Supabase project thật và regen `database.ts` bằng CLI.
- Kịch bản A/B trong `docs/RLS-PROOF.md` chưa có kết quả chạy thật.

**Mốc Git**

- Commit triển khai cuối: `5994f71cefbb094e818a149d7fc9f89c68b8adb6`
- Branch: `feat/g2-database`
- Tag: chưa tạo; chỉ tạo `g2-done` sau khi chủ dự án merge.
- PR: tạo sau commit tài liệu kết thúc G2 (PR #2).

---

### G2 (hoàn tất) — apply remote, proof thật, merge — 2026-09-17

**Đã làm gì**

- Chủ dự án apply `supabase/migrations/0001_account_manager.sql` thủ công
  qua SQL Editor (bỏ bước `supabase link`/`db push`: access token không đủ
  quyền trên project nên link fail; xem quyết định bên dưới).
- Chạy `scripts/rls-proof.ts` trên project thật: **7/7 check pass, exit 0**
  (log nguyên văn trong `docs/RLS-PROOF.md` mục 7). Hai lần chạy trước FAIL
  đều có giá trị chẩn đoán: thiếu GRANT bảng và thiếu toggle Email provider.
- Fix 2 lỗi thật phát hiện trong quá trình: xóa option `AsyncStorage: true`
  không hợp lệ do commit `ff0a584` thêm nhầm (làm đỏ `tsc`); bổ sung GRANT
  `authenticated`/`service_role` vào migration (RLS policy chưa đủ, thiếu
  grant thì service_role cũng bị `permission denied`).
- Viết `docs/MANUAL-STEPS.md`: chỉ các bước click tay trên Dashboard.
- `gen types` bằng CLI chưa chạy (thiếu `SUPABASE_DB_URL`, access token
  không quyền) → `src/types/database.ts` giữ bản mirror tay, GRANTs không
  đổi types nên vẫn đúng; nợ regen CLI.
- Rebase `feat/g2-database` lên main (sau merge PR #1), chuyển base PR #2
  về `main`, merge PR #2, tag `g2-done`, push tag.

**Quyết định và lý do**

- Quyết định: bỏ `link`/`db push` khỏi G2, apply schema bằng SQL Editor.
- Lý do: `SUPABASE_ACCESS_TOKEN` (sbp_) bị API từ chối (`LegacyLinkAuthTokenError`,
  thiếu quyền trên project) dù URL và ref trỏ cùng project; schema apply tay
  đạt cùng kết quả vì migration idempotent.
- Quyết định: service key legacy JWT (`eyJ...`) chỉ dùng trong
  `scripts/rls-proof.ts` (đọc từ `.env.local` đã gitignore), không vào app.
- Lý do: đúng yêu cầu chủ dự án và luật AGENTS (cấm service key trong app).

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → đạt, exit 0 (trước mỗi commit).
- `scripts/rls-proof.ts` trên remote → 7/7 pass, exit 0; user test tự dọn.
- Migration chạy 2 lần liên tiếp trên Postgres 16 local → 0 lỗi.

**Còn nợ / giới hạn đã biết**

- Cần token đủ quyền rồi chạy `supabase db push` (đồng bộ lịch sử
  migration) và `supabase gen types` để regen `database.ts` bằng CLI.
- Test A/B cho avatar/profile (FR-04) để dành G5.

**Mốc Git**

- Branch: `feat/g2-database`
- PR: https://github.com/Ezantmood/student-account-management/pull/2
  (base chuyển về `main` sau khi PR #1 merge)
- Tag: `g2-done` (tạo ngay sau merge trong cùng pipeline, đã push)

---

### G3 — Auth lõi và ghi chú — 2026-09-17

**Đã làm gì**

- Regen `src/types/database.ts` bằng CLI từ schema remote, xoá nợ G2:
  `supabase gen types typescript --db-url "$SUPABASE_DB_URL"` (session
  pooler từ `.env.local`). Lần đầu fail vì CLI cần Docker daemon đang tắt
  (`LegacyDockerRunError`, dial `docker.sock`); khởi động Docker.app rồi
  chạy lại → exit 0. Body tables khớp bản mirror tay, CLI thêm helper
  generics (`Tables`, `TablesInsert`, …) và `Constants`; giữ alias
  `ProfileRow`/`StudyNoteRow` ở cuối file.
- `AuthProvider` là nguồn sự thật session duy nhất (`getSession` +
  một `onAuthStateChange`, cleanup khi unmount); `useSession` đọc context.
  Cổng khởi động: `preventAutoHideAsync` ở root layout, giữ splash tới khi
  `getSession()` xong nên user đã login vào thẳng `/notes`, không nháy
  sign-in. Supabase client gắn generic `<Database>`.
- FR-01: `signUpSchema` (email, mật khẩu ≥8 có chữ+số, confirm khớp,
  `student_code` 1–30 ký tự), `signUp` gửi metadata cho trigger
  `handle_new_user`, phát hiện email trùng qua `identities == []`, màn hình
  sign-up có độ mạnh mật khẩu, chống double-submit, loading nút, cờ
  `EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION`.
- FR-02: sign-in có hiện/ẩn mật khẩu, `router.replace('/notes')` chặn Back;
  mọi lỗi qua một hàm duy nhất `toAuthErrorMessage` (không lộ raw error);
  `signOut()` + `queryClient.clear()` + về sign-in; profile tối thiểu G3
  (email + nút đăng xuất, form đầy đủ để dành G5).
- FR-05: `listNotes`/`getNote`/`createNote`/`updateNote`/`deleteNote` qua
  typed client + react-query key theo user; list có loading/empty (CTA)/
  error (retry); tạo/sửa validate zod, giữ form khi lỗi mạng; xóa có dialog
  xác nhận, chỉ đóng màn hình khi server xong.
- Chất lượng chung: `AppScreen` (KeyboardAvoidingView), theme sáng/tối một
  bộ token (`useAppTheme`), phát hiện offline qua mapping lỗi (không thêm
  NetInfo ngoài stack), `accessibilityLabel` cho input,
  `accessibilityRole="button"` cho nút.
- Cài `jest-expo` + `jest` + `@types/jest` bằng `npx expo install`
  (tương thích SDK 57), thêm script `test`, `babel.config.js`,
  `jest.config.js`; 26 unit test cho zod schemas, độ mạnh mật khẩu và hai
  hàm map lỗi (assert không lộ raw). Test import từ `@jest/globals` vì
  global jest không được tsc nhận trong setup này.
- Đánh dấu 4 checkbox G3 trong `docs/TASKS.md`; FR-01/FR-02/FR-05 → `đạt`
  (chờ test tay trên thiết bị cho các case trong TEST-CHECKLIST).

**Quyết định và lý do**

- Quyết định: validate zod thủ công (`safeParse` + `setError`) thay vì thêm
  `@hookform/resolvers`.
- Lý do: AGENTS.md cấm tự thêm package ngoài stack đã chốt; glue thủ công
  vài dòng, đủ cho form G3.
- Quyết định: không link sang `/forgot-password` từ sign-in trong G3.
- Lý do: file thuộc G4; `typedRoutes` sẽ đỏ type nếu link tới route chưa tồn
  tại. G4 thêm link cùng màn hình reset.
- Quyết định: tự merge `feat/g3-auth-core` vào `main`, tag `g3-done` ngay
  theo lệnh trực tiếp của chủ dự án trong lượt này.
- Lý do: lệnh chủ dự án được ưu tiên (SPEC thắng khi mâu thuẫn); mâu thuẫn
  với `AGENTS.md`/`GIT-WORKFLOW.md` (quy định mở PR, dừng chờ review, chỉ
  tag sau khi chủ dự án merge) được báo ở cuối lượt.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → exit 0, 0 errors (2 warning lành tính của React
  Compiler về `watch()` của react-hook-form; compiler bỏ qua memo, không
  ảnh hưởng hành vi).
- Lệnh: `npm test` → 3 suites, 26/26 PASS.
- `npx expo install --check` → dependencies đúng SDK 57 sau khi thêm jest.
- Test tay trên thiết bị thật (kill app mở lại, login A/B, CRUD chéo, quên
  mật khẩu): chưa làm — chủ dự án chạy theo kịch bản demo cuối lượt và ghi
  vào `docs/TEST-CHECKLIST.md`.

**Còn nợ / giới hạn đã biết**

- Nợ regen CLI đã xoá trong lượt này.
- Test A/B avatar/profile (FR-04) để dành G5; profile G3 chỉ xem email +
  đăng xuất.

**Mốc Git**

- Commit triển khai cuối: `136913a4a383792b53621aa9e2572b4ff69d848c`
- Commit docs (TASKS/TRACEABILITY/DEVLOG): commit này
- Branch: `feat/g3-auth-core`
- Tag: `g3-done` (tạo ngay sau merge theo lệnh chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` theo lệnh trực tiếp của chủ dự án
  (ngoại lệ so với GIT-WORKFLOW, xem quyết định trên)

---

### G4 — Quên và đặt lại mật khẩu (FR-03) — 2026-09-18

**Đã làm gì**

- Sửa luật trước tiên: `AGENTS.md` + `docs/GIT-WORKFLOW.md` ghi rõ từ G4
  agent tự merge vào `main` sau khi cổng xanh và tự tag, không mở PR
  (quyết định của chủ dự án ngày 2026-09-18); cổng commit bổ sung `npm test`.
- Auth core: `requestPasswordReset`, `verifyRecoveryOtp` (type `recovery`),
  `updatePassword`, `changePassword` (reauth `signInWithPassword` bằng mật
  khẩu hiện tại); `otpSchema` 6 số, `reset/changePasswordSchema` dùng lại
  chính sách G3; `recovery.ts` (cooldown gửi lại 60s) + `recoveryStorage.ts`
  (giữ email/thời điểm gửi khi thoát app).
- UI: `/forgot-password` (thông báo trung tính), `/verify-reset-otp` (ô
  numeric tự focus + paste + `oneTimeCode`, countdown resend),
  `/reset-password` (xong về `/sign-in` kèm banner theo SPEC),
  `/profile/change-password`; `profile.tsx` → `profile/index.tsx` (giữ
  route `/profile`). Auth guard giữ recovery session ở lại luồng, route `/`
  resume khi kill app giữa chừng, sign-in có link “Quên mật khẩu?”.
- Docs: check 3 checkbox G4, FR-03 → `đạt`, mở rộng TEST-CHECKLIST FR-03,
  REPORT-NOTES (OTP vs deep link, custom SMTP Brevo, neutral email, resume),
  UI-FLOW/ARCHITECTURE theo route mới.

**Quyết định và lý do**

- Quyết định: reset xong về `/sign-in` (kèm banner) thay vì `/notes` như
  lệnh lượt này.
- Lý do: SPEC FR-03 (“chuyển về đăng nhập”) và UI-FLOW thắng khi mâu thuẫn,
  theo đúng quy tắc chủ dự án đặt ra cho lượt này.
- Quyết định: route giữ tên `verify-reset-otp` thay vì `/verify-otp`.
- Lý do: ARCHITECTURE/UI-FLOW/FR-TRACEABILITY đã chốt tên này từ trước.
- Quyết định: Supabase gộp sai/hết hạn/đã dùng thành một mã lỗi nên nhánh
  “đã dùng” hiếm khi chạm được; UI ưu tiên nhánh hết hạn + CTA gửi lại mã.
- Lý do: trung thực với hành vi server thật, vẫn đủ CTA cho mọi case.
- Quyết định: tách `recovery.ts` (thuần, test được) khỏi
  `recoveryStorage.ts` (AsyncStorage).
- Lý do: import AsyncStorage làm Jest crash (`NativeModule null`); tách ra
  thì unit test cooldown chạy được mà không thêm package/mock.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → 0 errors (3 warning lành tính React Compiler về
  `watch()` của react-hook-form, tương tự G3).
- Lệnh: `npm test` → 4 suites, 51/51 PASS (OTP, mật khẩu mới, nhánh map
  lỗi mới, cooldown).
- Test tay trên thiết bị thật theo TEST-CHECKLIST FR-03 mở rộng: chưa làm —
  chủ dự án chạy theo kịch bản demo cuối lượt G4.

**Còn nợ / giới hạn đã biết**

- Cần test tay FR-03 trên Expo Go (OTP thật qua Brevo, kill app giữa luồng,
  rate limit, offline).
- Test A/B avatar/profile (FR-04) vẫn để dành G5.

**Mốc Git**

- Commit code cuối: `573093a` (auth core `6fc22d1`, recovery UI `c1290e5`,
  change-password `573093a`; luật git `1b40a11`)
- Commit docs (TASKS/TRACEABILITY/TEST-CHECKLIST/REPORT-NOTES/DEVLOG…):
  commit này
- Branch: `feat/g4-password-reset`
- Tag: `g4-done` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

**Fix sau tag (2026-09-18): OTP 8 số không nhập được**

- Triệu chứng: email Brevo in mã 8 số (project để Email OTP length = 8),
  app cứng `otpSchema` `^\d{6}$` nên chặn oan mã đúng ngay tại field.
- Sửa: client chấp nhận 6–10 số (`0a75931`), đúng/sai do `verifyOtp`
  quyết; cập nhật UI/test/checklist/vấn đáp. Tag `g4-done` giữ nguyên,
  không di chuyển tag đã push. Muốn khớp hẳn “6 số” trong SPEC thì chỉnh
  Dashboard Authentication → Sign In/Providers → Email → Email OTP length
  về 6 rồi gửi mã mới kiểm tra.
- Cổng: `tsc` đạt, `lint` 0 errors, `test` 51/51; merge `fix/g4-otp-length`
  vào `main` và push (commit docs này).

**Fix tiếp theo (2026-09-18): khóa chặt lại đúng 6 số**

- Chủ dự án đã chỉnh Email OTP length về 6, server chỉ gửi 6 số.
- Sửa: revert `otpSchema` về `^\d{6}$` (`05188b0`), UI/test/docs khớp lại
  chữ “6 số” theo SPEC. Cổng: `tsc` đạt, `lint` 0 errors, `test` 51/51;
  merge `fix/g4-otp-strict-6` vào `main` và push (commit docs này).

---

### G5 — Hồ sơ, avatar và đóng gói v1.0.0 (FR-04) — 2026-09-18

**Đã làm gì**

- Đọc SPEC/DATA-MODEL/UI-FLOW/TASKS/TRACEABILITY trước code; phát hiện 6 điểm
  lệnh G5 vênh với docs/code (path avatar, regex student_code, full_name 2–60,
  baseline 26 test, tên branch/file SQL, route profile) → DỪNG và xin quyết
  định chủ dự án trước khi chạm code (xem quyết định bên dưới).
- Deps: `npx expo install expo-image-picker expo-image-manipulator
  base64-arraybuffer` (đúng line SDK 57, `--check` chỉ còn drift có sẵn của
  expo/expo-constants/expo-router nên không đụng vào).
- Feature profile mới: `schemas.ts` (giữ luật G3/DB: full_name max 100,
  student_code 1–30 không regex), `errors.ts` (`toProfileErrorMessage` map
  23505 + `toAvatarErrorMessage`), `avatar.ts` (path timestamp, guard
  MIME/size, TTL 3600s/cache 55 phút), `api.ts` (`getProfile`,
  `updateProfile`, `uploadAvatar` base64→ArrayBuffer, `createAvatarSignedUrl`),
  `queries.ts` (`useProfile`/`useUpdateProfile`/`useAvatarUrl`/`useUploadAvatar`),
  `pickAvatar.ts` (quyền → crop 1:1 → resize ≤512 JPEG 0.7 → guard 2MB),
  `ProfileView.tsx` (3 trạng thái loading/error/ready, Snackbar thay Alert).
- Viết lại `app/(app)/profile/index.tsx`: container điều phối query/mutation,
  giữ link đổi mật khẩu + đăng xuất; từ chối quyền ảnh thì Snackbar kèm nút
  “Mở Cài đặt” (`Linking.openSettings()`).
- `scripts/storage-rls-proof.ts`: 5 check Storage (A upload folder mình,
  A không đọc file B qua download + signed URL, anon không đọc/không list),
  chạy remote **5/5 PASS, exit 0**.
- Unit test: 33 test mới (schema, path, guard, map lỗi, render ProfileView 3
  state bằng react-test-renderer + SafeAreaProvider, mock không gọi mạng);
  tổng **84/84 PASS** (giữ nguyên 51 cũ).
- Docs: tick hết G5 (bài 1 DONE), FR-04 → `đạt`; DATA-MODEL ghi quy ước path
  timestamp (migration G2 đã apply giữ nguyên); SETUP hoàn chỉnh clone → SQL →
  Auth/Brevo/OTP-6/rate-limit → Expo Go; TEST-CHECKLIST thêm demo A/B 2 máy
  (FR-05, FR-03 Brevo, FR-04); REPORT-NOTES thêm ảnh G5 + 4 Q&A avatar;
  README viết lại cho v1.0.0.

**Quyết định và lý do**

- Quyết định: path avatar `avatar_<timestamp>.jpg` theo lệnh G5 thay vì
  `avatar.{ext}` của DATA-MODEL.
- Lý do: chủ dự án chọn phương án timestamp khi được hỏi; SPEC không quy định
  format path nên không vỡ SPEC; migration đã apply không sửa, chỉ cập nhật
  DATA-MODEL + code.
- Quyết định: giữ validate SPEC/DB/G3, bỏ regex `^[A-Za-z0-9]{6,15}$` và
  full_name 2–60 của lệnh G5.
- Lý do: chủ dự án chọn giữ luật; regex mới loại user hợp lệ hiện tại và đòi
  migration siết constraint ngoài phạm vi.
- Quyết định: không tạo `supabase/sql/g5_storage.sql`, tái dùng migration G2.
- Lý do: chủ dự án chọn; bucket private + 4 policy đã nằm trong migration G2
  và proof remote xanh — file mới chỉ trùng lặp.
- Quyết định: branch `feat/g5-profile-docs` theo TASKS.md (lệnh G5 ghi
  `feat/g5-profile`).
- Lý do: TASKS.md là nguồn chọn branch theo AGENTS.md.
- Quyết định: test render dùng `react-test-renderer` (transitive của jest-expo,
  đúng version React) thay vì thêm testing-library.
- Lý do: AGENTS cấm tự thêm package ngoài stack; render 3 state vẫn đạt mà
  không cần dep mới.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → 0 errors, 2 warning lành tính React Compiler về
  `watch()` (kế thừa G3/G4); đã xóa 1 import thừa trong `notes/api.ts`.
- Lệnh: `npm test` → 8 suites, 84/84 PASS.
- `scripts/storage-rls-proof.ts` trên remote → 5/5 PASS, exit 0 (lần chạy đầu
  3/5 do bug script: signIn nhầm trên client anon; tách client đăng nhập riêng
  rồi chạy lại xanh; RLS/policy/bucket trên server đúng từ đầu).
- Test tay trên thiết bị thật (demo A/B 2 máy, OTP Brevo, đổi avatar): chưa
  làm — chủ dự án chạy theo TEST-CHECKLIST mục G5.

**Còn nợ / giới hạn đã biết**

- Test tay G5 trên Expo Go thuộc chủ dự án (kịch bản đã có trong TEST-CHECKLIST).
- Object avatar cũ đọng lại nếu bước xóa best-effort lỗi (đã log warning).
- `npm audit` 14 moderate (drift dependency Expo SDK 57, không tự fix).
- `npx expo install --check` báo expo/expo-constants/expo-router cũ hơn mong
  đợi vài patch (drift có sẵn từ G4, không đụng vào để giữ stack).

**Mốc Git**

- Commit code cuối: `be9842e` (unit test profile; deps `1f4d50f`, feature
  `f238893`, proof script `1dc85c9`)
- Commit docs (TASKS/TRACEABILITY/TEST-CHECKLIST/SETUP/REPORT-NOTES/README/
  DATA-MODEL/ARCHITECTURE/DEVLOG): commit này
- Branch: `feat/g5-profile-docs`
- Tag: `g5-done` + `v1.0.0` (tạo ngay sau tự merge theo quyết định chủ dự án,
  đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### G6 — UI/UX polish + hệ thống icon — 2026-09-18

**Đã làm gì**

- Cài `@expo/vector-icons` đúng line SDK 57 bằng `npx expo install`
  (được chủ dự án cho phép trước qua câu hỏi dừng; drift patch
  expo/expo-constants/expo-router có sẵn từ G4/G5 nên không đụng vào).
- Fix gốc icon: `PaperProvider` ở `src/providers/AppProviders.tsx` thêm
  `settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }`;
  `StatusBar` theo theme; 26 tên icon đối chiếu glyphmap thật, bảng icon
  trong `docs/UI-FLOW.md`.
- Design system `src/theme/`: `lightTheme`/`darkTheme` mở rộng MD3
  (thêm màu `success*`; danger dùng thẳng `error*` của MD3),
  `useAppTheme` theo `useColorScheme` fallback light, `spacing`
  4/8/12/16/24/32 + `radius`; xóa `src/lib/theme.ts`, mọi màn hình import
  từ `src/theme`. Không custom font, typography dùng variant Paper.
- 6 component dùng chung `src/components/`: `ScreenContainer` (SafeArea +
  KAV + ScrollView), `FormTextInput` (outlined + leftIcon + HelperText),
  `PasswordInput` (toggle eye/eye-off, label động, focusTextInput false),
  `FeedbackSnackbar` (leading icon theo variant + nút close),
  `EmptyState`, `LoadingState`/`ListSkeleton` (Animated RN).
  Xóa `AppScreen`/`FormTextField`/`FullScreenStatus`, migrate toàn bộ màn
  hình; logic nghiệp vụ, zod schema, 23505, path avatar giữ nguyên.
- Polish từng màn hình + testID ổn định (`login-submit`,
  `password-toggle`, `avatar-picker`, `profile-save`, `notes-fab` và các
  testID phụ); OTP căn giữa letterSpacing rộng; avatar `Pressable`
  overlay camera; notes `List.Item` + `Divider` + pull-to-refresh qua
  `refetch` của TanStack Query.
- Test: cập nhật `ProfileView.test` sang testID; thêm 7 test
  (`PasswordInput` toggle, `FeedbackSnackbar` 3 variant + nút đóng,
  `EmptyState` render + action) → **91/91 PASS** (giữ nguyên 84 cũ).
  Thêm `src/test-utils/vectorIconsMock.tsx` + `moduleNameMapper` vì font
  thật resolve bất đồng bộ sau teardown làm crash worker Jest
  (`window.dispatchEvent is not a function`); mock chỉ render tên icon,
  không nới assertion.
- Merge xuôi `main` vào branch (2 commit docs G5 sau `v1.0.0`) thay vì
  rebase, giữ đúng cấm force-push; giải quyết conflict `UI-FLOW.md` theo
  hướng giữ cả nội dung G5 (luồng avatar) lẫn bảng G6.

**Quyết định và lý do**

- Quyết định: cài `@expo/vector-icons` thay vì giữ “không thêm package”.
- Lý do: package chưa hề có trong `node_modules`; không cài thì import
  trong `settings.icon` đỏ `tsc` và bundle lỗi. Đã DỪNG hỏi và được chủ dự
  án cho phép; cài bằng `npx expo install` đúng line SDK 57, chạy Expo Go,
  không native module mới.
- Quyết định: màu custom dùng intersection type `AppTheme` thay vì
  `declare module ... interface MD3Theme`.
- Lý do: `MD3Theme` là `type` alias nên interface augmentation không merge
  được (trùng định danh khác loại khai báo); intersection vẫn type-safe,
  không `any`, không `@ts-ignore` — giữ đúng bất biến, chỉ khác cơ chế.
- Quyết định: danger không tạo màu mới, dùng `error`/`errorContainer` MD3.
- Lý do: MD3 đã có semantic danger đầy đủ; thêm `danger` trùng `error`
  chỉ tạo hai nguồn sự thật.
- Quyết định: thang spacing mới `xs4/sm8/md12/lg16/xl24/xxl32` thay vì giữ
  `md16/lg24/xl32` cũ.
- Lý do: khớp scale 4/8/12/16/24/32 trong lệnh G6; mọi style viết lại bằng
  token mới nên không còn phụ thuộc giá trị cũ.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → 0 errors, 2 warning lành tính React Compiler về
  `watch()` (kế thừa G3/G4/G5).
- Lệnh: `npm test` → 11 suites, 91/91 PASS (84 cũ giữ nguyên + 7 mới).
- Test tay trên thiết bị thật (icon đủ, dark mode, bàn phím, tap avatar):
  chưa làm — chủ dự án chạy theo TEST-CHECKLIST mục G6.

**Còn nợ / giới hạn đã biết**

- Test tay G6 trên Expo Go thuộc chủ dự án (kịch bản đã có).
- `TextInput.Icon` (nút mắt) nằm trong ô input cao 56 nên không gắn thêm
  `hitSlop` — vùng bấm thực tế gồm cả chiều cao ô nhập, đủ 44px chiều dọc.
- `npm audit` 14 moderate (drift dependency Expo SDK 57, không tự fix).

**Mốc Git**

- Commit code cuối: `7ba2db0`
- Commit docs/UI-FLOW resolve + G6 (DEVLOG/REPORT/CHECKLIST): commit này
- Branch: `feat/g6-ui-polish`
- Tag: `v1.1.0` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---
### G6.1 — Fix header navigator — 2026-09-18

**Đã làm gì**

- Branch `fix/g6-1-navigation-header` tách từ `main` tại `v1.1.0`.
  Tắt `headerShown` ở Stack `(app)` (nguồn 2 header chồng ở
  Notes) và thêm `contentStyle` nền theo theme cho cả 3 Stack
  (root/(app)/(auth)); rà soát không còn `Stack.Screen` lẻ bật header.
- `src/theme/navigation.ts`: navigation theme suy ra từ theme MD3 G6 qua
  `adaptNavigationTheme`, bọc `ThemeProvider` quanh Stack ở root layout.
- `ScreenContainer` thêm prop `header` (trong SafeArea, ngoài ScrollView);
  component `ScreenHeader` (BackAction label “Quay lại” chỉ khi
  `router.canGoBack()`); gắn Appbar cho profile (“Thông tin cá nhân”),
  đổi mật khẩu, tạo/sửa note. Notes giữ Appbar sẵn có.
- `StatusBar` giữ một chỗ duy nhất ở root provider (có từ G6), không thêm.
- Test mới `ScreenHeader.test.tsx` (title + nút back); tổng 93/93 PASS.

**Quyết định và lý do**

- Quyết định: import `ThemeProvider`/`DefaultTheme`/`DarkTheme` từ
  `expo-router` thay vì `@react-navigation/native`.
- Lý do: Expo Router 57 vendor navigation core bên trong, package
  `@react-navigation/native` không còn được cài; cài thêm là vi phạm
  “không thêm dependency”. Import từ `expo-router` trúng cùng
  implementation, đúng tinh thần “dep sẵn của expo-router”.
- Quyết định: dựng literal navigation colors từ G6 theme thay vì truyền
  thẳng expo theme vào `adaptNavigationTheme`.
- Lý do: expo theme dùng `ColorValue` nên không thỏa ràng buộc
  `NavigationTheme` (string) của Paper ở `tsc`; literal từ một nguồn G6
  vừa type-safe vừa giữ “một nguồn theme duy nhất”. `fonts` giữ nguyên
  của expo cho đúng shape runtime `ReactNavigation.Theme`.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → 0 errors (2 warning `watch()` cũ).
- Lệnh: `npm test` → 12 suites, 93/93 PASS (91 cũ + 2 mới).
- Test tay (header đơn, dark mode hết dải trắng, back từng màn con):
  chủ dự án chạy trên máy thật.

**Còn nợ / giới hạn đã biết**

- Không.

**Mốc Git**

- Commit code cuối: `8af385d`
- Commit docs (UI-FLOW + DEVLOG): commit này
- Branch: `fix/g6-1-navigation-header`
- Tag: `v1.1.1` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### G7 — Theme switcher Light / Dark / System — 2026-09-19

**Đã làm gì**

- Branch `feat/g7-theme-switcher` tách từ `main` tại `v1.1.1` (tag trỏ
  đúng HEAD merge G6.1 nên tách tại HEAD là đủ).
- `src/theme/themeMode.ts` (thuần, không import native module để test
  không cần mock — bài học G4): union `ThemeMode`, key
  `app.theme.mode`, type guard `isThemeMode`, `cycleThemeMode`
  system→light→dark→system, `resolveEffectiveScheme`,
  `themeModeIcon`, `themeModeAccessibilityLabel`, `load/persistThemeMode`
  (rác → `system`, lỗi I/O không throw).
- `src/theme/ThemeContext.tsx`: `ThemeModeProvider` ở root bọc NGOÀI
  PaperProvider và ThemeProvider navigation; cả hai cùng ăn theme từ
  context. `theme`/`navigationTheme` memo theo `effectiveScheme`;
  `adaptNavigationTheme` vẫn gọi đúng một lần ở module scope
  (`src/theme/navigation.ts` từ G6.1, context chỉ chọn giữa hai object
  có sẵn). `StatusBar` giữ một chỗ duy nhất ở root provider.
- Root `app/_layout.tsx` tách `RootStack` con để đọc context; hai layout
  `(app)`/`(auth)` đổi `useAppTheme` sang `useThemeMode` cho nền
  `contentStyle` (hàm `useAppTheme` cũ giữ nguyên cho tương thích).
- UI: `ThemeToggleAction` (testID `theme-toggle`) trên Appbar Notes và
  Profile (qua prop `actions` mới của `ScreenHeader`); `ThemeSettingsCard`
  (testID `theme-segmented`, SegmentedButtons Sáng/Tối/Hệ thống) trong
  Profile — cùng một state nên đổi chỗ này chỗ kia phản ánh ngay.
- Rà light mode toàn màn hình bằng grep + đọc code: không còn hex
  hardcode trong component/screen (mọi màu qua `theme.colors`), nên
  KHÔNG phải sửa màu chỗ nào; giữ nguyên spacing token G6 và layout.
- Test: giữ 93 cũ, thêm 17 (8 `themeMode.test.ts` + 9
  `ThemeContext.test.tsx`) → **110/110 PASS**.

**Quyết định và lý do**

- Quyết định: 3 mode (`light`/`dark`/`system`) thay vì boolean.
- Lý do: boolean chỉ nhớ bật/tắt tối, mất khả năng “bám theo hệ điều
  hành”. Với `system`, user đổi dark/light trong Settings điện thoại thì
  app đổi theo mà không cần chạm lại app — đúng hành vi người dùng
  mobile mong đợi.
- Quyết định: chống flash bằng `isThemeHydrated` + render `null` khi
  chưa đọc xong storage, thay vì đoán theme tạm.
- Lý do: đoán bừa (VD mặc định light) sẽ nháy sáng→tối một khung hình
  trên máy đang dark. Vì provider bọc ngoài `AuthProvider` (nơi gọi
  `SplashScreen.hideAsync`), splash hệ thống vẫn che trong lúc hydrate
  nên user không thấy gì ngoài splash — không cần thêm package.
- Quyết định: memo `theme`/`navigationTheme` theo `effectiveScheme`,
  chỉ chọn giữa `navigationLight/DarkTheme` tính sẵn ở module scope.
- Lý do: `adaptNavigationTheme` tạo object mới mỗi lần gọi; gọi trong
  render sẽ đổi identity `value` của `ThemeProvider` mỗi frame → remount
  navigator và render lại toàn cây. Memo giữ object ổn định.
- Quyết định: tách logic thuần ra `themeMode.ts`, provider nhận prop
  `storage`/`systemScheme` để test thay vì mock module react-native.
- Lý do: `jest.mock('react-native', ...)` kèm `requireActual` load lại
  RN index thật làm crash worker Jest (DevMenu native); prop override
  đạt cùng độ phủ mà không chạm native.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → 0 errors, 2 warning `watch()` cũ (kế thừa G3–G6).
- Lệnh: `npm test` → 14 suites, 110/110 PASS (93 cũ + 17 mới).
- Test tay trên thiết bị thật (cycle, persist kill app, system theo
  Settings, rà light mode): chủ dự án chạy theo TEST-CHECKLIST mục G7.
- Warning “worker process has failed to exit gracefully” có từ trước G7
  (đã xuất hiện khi suite chỉ có 13 suites), không do test mới.

**Còn nợ / giới hạn đã biết**

- Test tay G7 trên Expo Go thuộc chủ dự án (kịch bản đã có).
- `useAppTheme` cũ (đọc `useColorScheme` trực tiếp) vẫn còn export nhưng
  không còn nơi nào dùng — giữ để không vỡ import ngoài, sẽ dọn ở
  giai đoạn refactor sau nếu cần.

**Mốc Git**

- Commit code: `0947ad76fb5180d64c7c06396b8b71b65934b79d` (code),
  `870eb042872670f4d9a4803f9f9da7c496101833` (test),
  `58386a491f556a169cc64ce8a260b8b7b0294d6a` (docs)
- Branch: `feat/g7-theme-switcher`
- Tag: `v1.2.0` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### Rebrand — Gộp 6 bài thành hệ thống AI Learning Assistant — 2026-09-19

**Đã làm gì**

- Đổi danh tính: `package.json` → `ai-learning-assistant`; `app.json`
  name/slug → AI Learning Assistant; tiêu đề SPEC/README, comment
  `database.ts`. Giữ version, dependency, scheme (chưa có nên không thêm).
- Tái cấu trúc: code dùng chung (`lib`, `theme`, `components`,
  `providers`, `types`, `test-utils`) gom vào `src/shared/`;
  `src/features/auth|profile|notes` giữ nguyên; tạo 5 thư mục rỗng
  documents/summary/chat/scan/solver kèm `.gitkeep`; xóa 2 thư mục rỗng
  `constants`/`hooks`. Chỉ sửa đường dẫn import (1 lỗi tsc duy nhất ở
  `AppProviders` → `../../features/...`).
- Dashboard `app/(app)/dashboard.tsx`: màn chính sau đăng nhập, 6 thẻ Card
  (icon + tên + mô tả + dải FR + Chip Hoàn thành/Sắp có); thẻ 1 tới
  `/notes`, 5 thẻ còn lại không điều hướng, không tạo route rỗng.
  Redirect sau login (`/` và `(auth)` guard) đổi `/notes` → `/dashboard`;
  mọi route cũ (`/notes`, `/profile`, `/sign-in`…) giữ nguyên.
- Keep-alive `.github/workflows/keep-alive.yml`: cron 2 ngày + bấm tay,
  ping `Auth health` (200 đã kiểm chứng) bằng secrets, không nới RLS.
- Docs: README (6 chức năng + 2 bước secret), AGENTS (phạm vi 45 FR + luật
  feature/shared, 117 dòng), FR-TRACEABILITY (45 dòng), ARCHITECTURE
  (cây mới + đoạn cùng tồn tại).

**Quyết định và lý do**

- Quyết định: giữ `src/features/notes` thay vì ép vào `profile`.
- Lý do: notes là minh chứng FR-05 của Chức năng 1, đã là feature riêng;
  ép vào profile chỉ đổi tên thư mục mà không dọn được gì.
- Quyết định: code dùng chung vào `src/shared/`, không dùng alias `@/*`.
- Lý do: `@/*` có trong tsconfig nhưng Jest chưa map và Metro chưa kiểm
  chứng resolve; giữ import tương đối để tsc + test + bundle thật đều xanh.
- Quyết định: keep-alive ping `GET /auth/v1/health` (kèm anon key) thay vì
  query bảng.
- Lý do: không bảng nào có RLS đọc ẩn danh (profiles/study_notes chỉ grant
  `authenticated`); query bảng sẽ 401. Health trả 200, không đòi quyền,
  không đụng RLS. Đã mô phỏng logic workflow: http=200.
- Quyết định: giữ tên project Supabase (`student-account-manager`) trong
  SETUP/MANUAL-STEPS.
- Lý do: đó là định danh phía Supabase, cấm đổi theo lệnh session.

**Cố tình chưa làm (theo lệnh session)**

- Không code FR-06 → FR-45; không migration/bảng/bucket/policy; không đụng RLS.
- Không cài/gỡ/nâng package; không sửa tsconfig/babel/eslint.
- Không sửa test nào đang PASS; không sửa logic FR-01 → FR-05.
- Không viết lại SPEC/DATA-MODEL/TASKS (để session 45 FR sau).

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → 0 errors, 2 warning `watch()` cũ (kế thừa G3–G7).
- Lệnh: `npm test` → 14 suites, 110/110 PASS (giữ nguyên).
- `scripts/rls-proof.ts` → 7/7 PASS; `scripts/storage-rls-proof.ts` → 5/5 PASS.
- Dev server Metro khởi động đạt; bundle iOS entry http=200 chứa dashboard.
- Test tay dashboard trên Expo Go (sáng/tối, bấm thẻ): chủ dự án chạy.

**Còn nợ / giới hạn đã biết**

- Chủ dự án tự thêm 2 secret `SUPABASE_URL`, `SUPABASE_ANON_KEY` trên GitHub
  (README đã ghi 2 bước) rồi bấm Run workflow kiểm tra.
- Test tay dashboard + toàn bộ TEST-CHECKLIST trên thiết bị thật.

**Mốc Git**

- Branch: `chore/rebrand-system`
- Tag: `v1.3.0` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### Docs CN2 — Đặc tả quản lý tài liệu FR-06 → FR-13 — 2026-09-19

**Đã làm gì**

- Dọn tài liệu: nhập `GIT-WORKFLOW.md` vào AGENTS.md (103 dòng), nhập
  `UI-FLOW.md` vào ARCHITECTURE.md mục “Luồng màn hình”, `git rm` cả hai
  file, sửa liên kết trong README/REPORT-NOTES. Giữ SETUP và
  FR-TRACEABILITY riêng. DEVLOG quá khứ không sửa.
- SPEC thêm mục CN2: acceptance FR-06→FR-13, luật validate (tên 1–120,
  môn 1–60, whitelist ext+MIME, 10 MB kiểm tra trước khi đọc), out of scope.
- DATA-MODEL thêm DDL tham chiếu `subjects`/`documents` (index FR-08/lọc môn,
  CHECK `extraction_status`, RLS 4 lệnh, bucket `documents` + policy
  `{user_id}/`). ARCHITECTURE thêm màn CN2, tầng repository/queryKey, thứ tự
  xóa storage-trước-DB-sau.
- Tạo mới `docs/DESIGN-SYSTEM.md`: token MD3 đọc từ Paper đang cài, màu
  file-type (light tính tay ≥ 6.4:1), spacing/radius thật, checklist màn hoàn
  thành. Chưa áp vào code.
- TASKS thêm backlog CN2-01→CN2-12 (branch `feat/cn2-documents`); TRACEABILITY
  FR-06→FR-13 “Đang làm”; TEST-CHECKLIST thêm mục CN2; SETUP thêm mục 5b/7b;
  README cập nhật bảng trạng thái.

**Quyết định và lý do**

- Quyết định: FR-13 tách đôi — CN2 chỉ làm hạ tầng hai cột, CN3 thực thi AI.
- Lý do: CN2 không phụ thuộc API key/Edge Function, làm được ngay; đã ghi
  trong SPEC/DATA-MODEL/TRACEABILITY để session sau không tưởng bỏ sót.
- Quyết định: DOCX được CRUD đầy đủ nhưng AI không nhận (`unsupported`).
- Lý do: Gemini không đọc trực tiếp DOCX và không có thư viện trích xuất
  chạy trên Expo Go; FR-07 chỉ yêu cầu “hỗ trợ định dạng” nên vẫn thỏa.
- Quyết định: xóa storage trước, DB sau khi xóa tài liệu.
- Lý do: bản ghi trỏ hư không tệ hơn object mồ côi (UI bấm vào lỗi); mồ côi
  chỉ tốn dung lượng, dọn rác ngoài đề nên chấp nhận + log.
- Quyết định: không dùng alias `@/*`, không sinh hex seed indigo bằng tay.
- Lý do: Metro/Jest chưa kiểm chứng alias; tonal palette không tính tay được
  nên DESIGN-SYSTEM ghi số Paper thật + quy trình sinh bằng tool.

**Cố tình chưa làm (theo lệnh session)**

- Không code ứng dụng, không file `.ts/.tsx`/`.sql`, không migration/Dashboard.
- Không cài/gỡ/nâng package (document-picker + file-system do chủ dự án cài
  sẵn trước session, để nguyên chưa commit).
- Không sửa test, logic CN1, đặc tả FR-01→FR-05; không đặc tả FR-14→FR-45.

**Đã kiểm thử**

- `npx tsc --noEmit` → đạt; `npm test` → 14 suites, 110/110 PASS (giữ nguyên).
- Liên kết chết tới 2 file đã xóa: hết (DEVLOG quá khứ giữ nguyên có chủ đích).

**Mốc Git**

- Branch: `docs/cn2-spec`
- Tag: `docs-cn2` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### Docs CN2.1 — Chốt 4 quyết định + tách 3 phiên + contrast thật — 2026-09-19

**Đã làm gì**

- SPEC ghi 4 quyết định chủ dự án: mở tài liệu bằng `Linking.openURL`
  (tiện ích ngoài FR, không viewer/WebView); ô tìm kiếm theo tên bằng `ilike`
  (ngoại lệ mở rộng vì demo, phân biệt dấu đã biết); giới hạn 100 tài liệu /
  30 môn (`count` trước insert, vì free tier 1 GB); đổi môn chỉ ở chi tiết.
- TASKS tách backlog CN2 thành 3 phiên (`feat/cn2-g1`/`cn2-g2`/`feat/cn2-polish`,
  tag `cn2-g1`/`cn2-g2`/`v2.0.0`); thêm task cuối CN2-13 chuẩn hóa bảng màu
  (đặt cuối vì đổi theme sớm hỏng ảnh báo cáo).
- DESIGN-SYSTEM điền tỉ số WCAG tự tính bằng python (light 6.28–6.38:1,
  dark 13.21–13.47:1, đều vượt 4.5:1, chốt luôn không cần đo tool).
- Đồng bộ ARCHITECTURE, TEST-CHECKLIST, FR-TRACEABILITY theo 4 quyết định.

**Cố tình chưa làm**

- Không code `.ts/.tsx`/`.sql`, không package, không schema thật (giữ luật
  session tài liệu). Không sửa đặc tả FR-01→FR-05 hay CN1.

**Đã kiểm thử**

- `npx tsc --noEmit` → đạt; `npm test` → 14 suites, 110/110 PASS (giữ nguyên).

**Mốc Git**

- Branch: `docs/cn2-decisions`
- Tag: `docs-cn2.1` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### Migration CN2 — File 0002 chạy được + verify 14 dòng — 2026-09-19

**Đã làm gì**

- Phát hiện lỗ hổng: SETUP 5b bảo paste DDL từ DATA-MODEL nhưng DATA-MODEL
  chỉ có bảng markdown, không có SQL chạy được.
- Tạo `supabase/migrations/0002_cn2_documents.sql` (253 dòng) bám khuôn 0001:
  subjects trước, do-block bổ sung constraint/FK theo tên, index, RLS 4+4+4,
  grants, tái dùng `set_updated_at()`, bucket `documents`
  (`on conflict do update`, 10485760 byte khớp CHECK tuyệt đối). Không đụng CN1.
- Tạo `scripts/cn2-schema-verify.sql` chỉ-đọc, `union all` một bảng 14 dòng
  ĐẠT/KHÔNG ĐẠT.
- SETUP 5b viết lại thao tác được (dán toàn bộ 0002 → verify → kết quả mong
  đợi); 7b chỉ còn đối chiếu trực quan. DATA-MODEL trỏ 0002 là nguồn sự thật.

**Đã kiểm thử**

- Dựng Postgres 16 local + mock schema `auth`/`storage`/role/stub function
  (mô phỏng 0001 đã apply): chạy 0002 hai lần liên tiếp → cả hai success,
  không lỗi → idempotent thật.
- Verify script trên DB đó → 14/14 ĐẠT.
- `npx tsc --noEmit` → đạt; `npm test` → 14 suites, 110/110 PASS (giữ nguyên).

**Còn nợ**

- Chủ dự án dán 0002 + verify vào SQL Editor remote theo SETUP 5b, báo kết quả.

**Áp remote (chủ dự án thực hiện, 2026-09-20)**

- Dán toàn bộ `0002_cn2_documents.sql` vào SQL Editor: lần 1 success, chạy
  lại lần 2 kiểm idempotent trên DB thật cũng success — idempotent đã xác
  nhận trên remote, không chỉ Postgres local.
- `cn2-schema-verify.sql`: **14/14 ĐẠT**, không có dòng KHÔNG ĐẠT nên không
  cần bản vá 0003; 0002 giữ nguyên.
- Hồi quy sau khi áp (agent chạy): `npm test` 14 suites **110/110 PASS**;
  `scripts/rls-proof.ts` **7/7**; `scripts/storage-rls-proof.ts` **5/5**.
  Schema CN2 không làm ảnh hưởng CN1.

**Mốc Git**

- Branch: `chore/cn2-migration`
- Tag: `cn2-migration` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### Apply CN2 0002 qua psql remote + verify + hồi quy — 2026-09-20

**Đã làm gì**

- Branch `chore/cn2-apply-0002` từ `main`. Không sửa `0002_cn2_documents.sql`
  (đã apply lên production) và không viết code CN2 theo lệnh session.
- Apply `supabase/migrations/0002_cn2_documents.sql` lên remote bằng
  `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f`, chạy HAI LẦN liên tiếp,
  cả hai `exit 0`. Output mỗi lần: `extension "pgcrypto" already exists`,
  `relation "subjects"/"documents"/3 index already exists, skipping`,
  còn lại `CREATE TABLE/DO/CREATE INDEX/ALTER TABLE/DROP+CREATE POLICY ×12
  (8 bảng + 4 storage)/GRANT ×4/REVOKE ×2/DROP+CREATE TRIGGER ×2/
  INSERT 0 1 (bucket documents upsert)`. Lần chạy nào cũng success nên
  idempotent đã chứng minh trên DB thật, không chỉ Postgres local.
- Chạy `scripts/cn2-schema-verify.sql` trên remote: **14/14 ĐẠT**, không có
  dòng KHÔNG ĐẠT nên KHÔNG viết `0003_*.sql`; 0002 giữ nguyên.
- Hồi quy sau apply (số thật, không sửa test): `npm test` 14 suites
  **110/110 PASS**; `scripts/rls-proof.ts` **7/7** (source `.env` +
  `.env.local` trước khi chạy); `scripts/storage-rls-proof.ts` **5/5**.
  Schema CN2 không ảnh hưởng CN1.
- Audit docs-cn2.1 (đi kèm, không đổi bảng màu): cả ba việc ĐÃ CÓ nên để
  nguyên, không sửa — a) `docs/TASKS.md:65,68,71` tách 3 phiên
  (`feat/cn2-g1`/`cn2-g2`/`feat/cn2-polish`, tag `cn2-g1`/`cn2-g2`/`v2.0.0`);
  b) `docs/DESIGN-SYSTEM.md:45,48,54` ghi sẵn tỉ số số (light 6.28–6.38:1,
  dark 13.21–13.47:1) + kết luận vượt 4.5:1, grep không thấy chuỗi
  “hãy tự đo”; c) `docs/TASKS.md:131` task CN2-13 chuẩn hóa bảng màu nằm
  CUỐI backlog kèm lý do “Đặt cuối vì đổi theme sớm làm hỏng mọi ảnh…”.

**Cố tình không làm (theo lệnh session)**

- Không viết code CN2, không đổi bảng màu, không sửa test cho qua.
- Không tick checkbox CN2-01→CN2-13 nào trong `docs/TASKS.md`: CN2-01 đòi
  thêm regen `database.ts` bằng CLI (chưa làm trong phiên này), tick sớm
  là nói dối tiến độ; backlog giữ nguyên như audit.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (exit 0).
- Lệnh: `npm run lint` → 0 errors, 2 warning `watch()` cũ (kế thừa G3–G7).
- Lệnh: `npm test` → 14 suites, 110/110 PASS (giữ nguyên, không sửa test).
- `scripts/rls-proof.ts` → 7/7; `scripts/storage-rls-proof.ts` → 5/5.

**Mốc Git**

- Branch: `chore/cn2-apply-0002`
- Tag: `cn2-migration-applied` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### CN2-G1 — Upload + danh sách tài liệu (FR-06, FR-07, FR-08 khung) — 2026-09-20

**Đã làm gì**

- Branch `cn2-g1` từ `main` (lệnh session ghi `cn2-g1`, ngắn hơn `feat/cn2-g1`
  trong backlog nhưng cùng phiên 1).
- Commit 1: `npx expo install expo-crypto` (lockfile) + sửa `docs/DATA-MODEL.md`
  (`crypto.randomUUID()` → `Crypto.randomUUID()` của expo-crypto kèm một dòng
  lý do). Không thêm dependency nào khác: `expo-document-picker`,
  `expo-file-system`, `base64-arraybuffer` đã có sẵn từ CN1.
- Commit 2: module `src/features/documents/{storage,schemas,errors,api,queries}.ts`
  + `__tests__/documents.test.ts` (38 test) + route `app/(app)/documents/{index,upload}.tsx`
  + dashboard thẻ CN2 dẫn tới `/documents` + checklist tay G1 trong TEST-CHECKLIST.
- Types `subjects`/`documents` đồng bộ tay vào `src/shared/types/database.ts`
  theo đúng `0002_cn2_documents.sql` (chờ regen bằng CLI ở CN2-01).
- Upload: guard tồn tại → ext → MIME → size TRƯỚC khi đọc; đọc bằng
  `new File(uri).base64()` (API mới, không import legacy); decode ArrayBuffer
  (`base64-arraybuffer`) + contentType (cấm `fetch(uri).blob()`); Storage trước,
  DB sau; insert lỗi thì dọn object vừa upload. DOCX nhận
  `extraction_status='unsupported'`, PDF/TXT nhận `'pending'` (hạ tầng FR-13).
- Danh sách: tên hiển thị + môn (`null` → “Chưa phân loại”) + kích thước
  (B/KB/MB) + ngày tải, mới nhất trước; đủ skeleton/empty/error+retry/pull-to-refresh.
- Icon mới `upload`, `progress-clock` đã đối chiếu glyphmap
  MaterialCommunityIcons thật (984402, 985494); Paper `settings.icon` giữ nguyên.

**Quyết định và lý do**

- Dùng `Crypto.randomUUID()` của expo-crypto: `crypto` toàn cục không đảm bảo
  có trên Hermes, thiếu thì nổ đúng lúc bấm upload chứ không lỗi lúc build.
- Thẻ dashboard CN2 để chip “Đang làm” (trạng thái `partial` mới) thay vì
  “Hoàn thành”: FR-09→FR-13 chưa làm, ghi “Hoàn thành” là nói dối demo.
- Không viết `scripts/documents-rls-proof.ts` ở G1: lệnh session chỉ yêu cầu
  unit test tầng dữ liệu; proof A/B remote để cho phiên g2 (đủ CRUD mới proof
  một thể).

**Cố tình không làm và lý do**

- Màn chi tiết/đổi tên/xóa/gán môn/tìm kiếm-lọc (g2); viewer/WebView/PDF render;
  gọi Gemini; đổi bảng màu; sửa file `.sql` — tất cả ngoài phạm vi G1 theo lệnh.
- `getDocumentUrl` (signed URL): chỉ màn chi tiết G2 cần, viết sớm là code chết.
- Không tick CN2-01 (đòi regen `database.ts` bằng CLI + proof remote), CN2-02
  (đòi proof script 100%), CN2-05 (đòi tìm kiếm + lọc môn); chỉ tick CN2-03,
  CN2-04 đúng nội dung đã xong.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (exit 0, gồm cả regen `.expo/types/router.d.ts`
  cho 2 route mới bằng cách chạy `npx expo start` rồi tắt).
- Lệnh: `npm run lint` → 0 errors, 2 warning `watch()` cũ (kế thừa G3–G7).
- Lệnh: `npm test` → 15 suites, **148/148 PASS** (giữ 110 cũ, +38 mới, không
  sửa test cũ, không gọi mạng).
- Test tay Expo Go: chưa chạy (không có thiết bị trong phiên); checklist G1 đã
  viết trong `docs/TEST-CHECKLIST.md` để chủ dự án chạy.

**Còn nợ / giới hạn đã biết**

- Cần chủ dự án chạy checklist tay CN2-G1 trên Expo Go (12 case).
- Proof RLS documents/subjects remote + regen `database.ts` bằng CLI (g2).

**Mốc Git**

- Commit cuối: `39d1361d6ef9675330b96d84b558df05ac243f1b` (merge --no-ff)
- Branch: `cn2-g1`
- Tag: `cn2-g1-done` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh
