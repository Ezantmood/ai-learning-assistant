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
