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
