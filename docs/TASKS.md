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
   pull-to-refresh, chưa tìm kiếm/lọc; thẻ CN2 khi đó chip chưa hoàn thành.)

## CN2-2 — Tải lên (FR-06, FR-07, phiên 1)

- [x] CN2-04: Màn `/documents/upload`: `expo-document-picker` + guard
  ext/MIME/size (trước khi đọc) + guard giới hạn 100 tài liệu (`count` trước
  insert) + upload base64→ArrayBuffer + progress + Snackbar. Xong khi tệp hợp
  lệ lên được, tệp sai/quá lớn/vượt giới hạn bị chặn, offline báo retry. FR: FR-06, FR-07.
  (2026-09-20, G1: xong, chờ test tay Expo Go.)
  (2026-09-21, sửa lỗi Android Expo Go: dùng content URI của picker để đọc,
  tránh cache chung bị từ chối READ; vẫn chờ test tay trên máy.)

## CN2-3 — Danh sách và chi tiết (FR-08, FR-09, phiên 1 + 2)

- [x] CN2-05: Danh sách `/documents` thật: skeleton/empty/error/retry,
  sắp `created_at desc`, lọc theo môn, ô tìm kiếm theo tên (`ilike`, phân
  biệt dấu), pull-to-refresh. FR: FR-08, FR-12 (lọc).
  (2026-09-20, G2: xong tìm kiếm debounce 300ms + Chip lọc Tất cả/môn/
  Chưa phân loại; G1 đã xong khung + sắp xếp.)
- [x] CN2-06: Chi tiết `/documents/[id]`: tên/ngày/dung lượng/định dạng/
  môn/trạng thái trích xuất + nút “Mở tài liệu” (`Linking.openURL`,
  tiện ích ngoài FR) + đổi môn học tại đây (danh sách không có menu đổi
  nhanh). FR: FR-09.
  (2026-09-20, G2: xong, signed URL TTL 3600s + canOpenURL, không WebView.)

## CN2-4 — Đổi tên và xóa (FR-10, FR-11, phiên 2)

- [x] CN2-07: Đổi tên chỉ nhãn DB (không đổi object storage) + gán môn học
  trong màn chi tiết; validate 1–120. FR: FR-10, FR-12 (gán).
  (2026-09-20, G2: xong, payload update chỉ `display_name`.)
- [x] CN2-08: Xóa có dialog xác nhận, thứ tự storage-trước-DB-sau theo
  ARCHITECTURE; không còn bản ghi trỏ hư không. FR: FR-11.
  (2026-09-20, G2: xong, DB fail sau storage → lỗi rõ + Snackbar “Thử lại”.)

## CN2-5 — Môn học (FR-12, phiên 2)

- [x] CN2-09: Màn `/subjects`: CRUD môn (validate 1–60, không trùng tên),
  xóa môn đang có tài liệu báo trước “về Chưa phân loại”. Xong khi xóa môn
  không mất tài liệu nào (`ON DELETE SET NULL`). FR: FR-12.
  (2026-09-20, G2: xong, dialog xóa ghi rõ số tài liệu ảnh hưởng.)

## CN2-6 — Hạ tầng FR-13, DESIGN-SYSTEM, hoàn thiện (phiên 3)

- [x] CN2-10: Cột `extracted_text` + `extraction_status` hoạt động:
  PDF/TXT mới nhận `pending`, DOCX nhận `unsupported` + gợi ý chuyển sang PDF;
  UI hiện trạng thái đúng. FR: FR-13 (hạ tầng; thực thi ở CN3).
  (2026-09-20, polish: xác nhận `getExtractionStatusForExt`/`getExtractionStatusLabel`
  + unit test + nhãn ở `/documents/[id]` đã có từ G1/G2.)
- [x] CN2-11: Áp `docs/DESIGN-SYSTEM.md` cho mọi màn CN2 (token màu/spacing,
  skeleton/empty/error/Snackbar, đo contrast cặp màu mới, light+dark). FR:
  FR-06..FR-13 (giao diện).
  (2026-09-20, polish: mọi màn đã dùng token/spacing từ G1/G2; phiên này đo lại
  contrast trên nền mới, không còn hex hardcode ngoài `theme.ts`.)
- [x] CN2-12: Unit test (schema, whitelist, giới hạn size, format dung lượng,
  dựng path, suy loại tệp — mock supabase/picker/file-system, không gọi mạng),
  cập nhật traceability/checklist/devlog/báo cáo theo code cuối. FR: FR-06..FR-13.
  (2026-09-20, polish: 64 test documents + 3 test theme, tổng 177/177; docs cập nhật.)
- [x] CN2-13 (CUỐI CÙNG): Chuẩn hóa bảng màu — thay bộ màu mặc định của Paper
  bằng bộ màu riêng sinh từ seed indigo `#4A5FC1` (theo `docs/DESIGN-SYSTEM.md`),
  áp cho toàn app gồm cả các màn CN1, cập nhật bảng token bằng giá trị thật,
  rồi chụp lại toàn bộ ảnh báo cáo. Đặt cuối vì đổi theme sớm làm hỏng mọi ảnh
  đã chụp. FR: FR-06..FR-13 (giao diện).
   (2026-09-20, polish: TonalSpot + ánh xạ tone của Paper, mọi cặp ≥ 4.5:1,
   test khóa palette; ảnh do chủ dự án chụp lại.)

**Trạng thái CN2: HOÀN THÀNH (chốt tại `fix/delete-navigation`, tag
`cn2-hoan-thanh`, 2026-09-21).** FR-06→FR-13 đạt ở mức code + unit 264/264
(giữ mốc 260 + 4 mới khóa điều hướng xóa) + verify schema remote 14/14.
CN2-01/CN2-02 giữ nguyên chưa tick (proof A/B `documents-rls-proof` + regen
`database.ts` bằng CLI thuộc chủ dự án, ngoài phạm vi fix; xem khoảng trống
trong FR-TRACEABILITY). Không để trạng thái “đang làm” ở CN2 nữa.
(2026-09-21, `fix/icons-cn1-cn2`: icon Trang chủ CN2 sang “Hoàn thành”;
44 tên icon gom vào `src/shared/theme/icons.ts` + test cổng gác glyphMap;
sửa `Avatar.Icon` trùng màu nền; tổng unit 266/266. Tag `cn2-hoan-thanh`
kiểm lại trỏ đúng merge `f3f9d58`, giữ nguyên.)

---

# Backlog CN3 — AI tóm tắt tài liệu (FR-14 → FR-22)

Chia BA phiên code, mỗi phiên một branch, merge `--no-ff` và tag riêng sau
khi cổng xanh (quyết định chủ dự án 2026-09-19 cho G4+, áp tiếp cho CN3).
Mỗi checkbox là một commit độc lập và phải để app chạy được. Trước commit chạy
`npx tsc --noEmit`, `npm run lint`, `npm test` và test tay phần liên quan;
staged diff phải không có secret. Push ngay sau commit.

Đặc tả đã chốt ở session `docs/cn3` (tag `docs-cn3`): model `gemini-2.5-flash`
(từ CN3-G1 đổi sang `gemini-3.5-flash` vì 2.5-flash shutdown sớm nhất
16/10/2026, xem DEVLOG cn3-g1),
đọc PDF bằng native vision (không lib), bấm nút (không auto), bảng riêng
`document_summaries` (migration `0004` đã apply + verify 10/10 ở session docs).
Tag `edge-probe` được lệnh nhắc tới nhưng không tồn tại nên probe làm lại từ
đầu trong CN3-01 — không code gọi Gemini trước khi probe xong.

- Phiên 1 — branch `cn3-g1`, tag `cn3-g1`: CN3-01 → CN3-02 (probe chốt đường
  key + tầng dữ liệu summaries + máy trạng thái). Lý do: probe là tiền đề kiến
  trúc nhưng nhỏ, gộp chung với repo không-gọi-mạng làm song song được; xong
  g1 là có nền chạy được, chưa đốt quota.
- Phiên 2 — branch `cn3-g2`, tag `cn3-g2`: CN3-03 → CN3-04 (gọi Gemini theo
  nhánh đã chốt + UI vùng tóm tắt + chặn lặp/quota/retry). Lý do: xong g2 là
  có luồng dọc demo được end-to-end.
- Phiên 3 — branch `cn3-g3`, tag `cn3-g3` (tag version lớn do chủ dự án quyết
  lúc đóng gói): CN3-05 → CN3-06 (proof RLS A/B + polish/test/docs cuối).
  Lý do: khóa cách ly và bằng chứng báo cáo trước khi nhận CN3 xong.

## CN3-1 — Probe key và nền dữ liệu (phiên 1)

- [x] CN3-01: Probe Edge Function proxy `summarize` (deploy thử lên Supabase,
  key Gemini trong secret, app gửi JWT; ghi kết quả đạt/không vào SPEC/REPORT).
  Probe đạt → code nhánh proxy; probe thất bại → code nhánh
  `EXPO_PUBLIC_GEMINI_API_KEY` + ghi giới hạn demo. Xong khi một nhánh được
  chốt bằng bằng chứng deploy thật, không chốt bằng suy đoán. FR: FR-21.
  (2026-09-20, probe `gemini-proxy` — tên function theo lệnh session: `secrets
  set` + `functions deploy` đều 403 thiếu quyền, `secrets list` xác nhận chưa
  có key → chốt nhánh `EXPO_PUBLIC_GEMINI_API_KEY`, giới hạn đã biết ghi ở
  REPORT-NOTES; source probe giữ trong repo chờ deploy, tag `gemini-wired`.
  Retry cùng ngày với token MỚI (`chore/gemini-wired`): CLI + Management API
  vẫn 403, `GET .../functions` → `[]`, endpoint 404 — proxy vẫn là chốt kiến
  trúc nhưng chưa deploy được, nhánh demo giữ hiệu lực.
  Probe-2 (`chore/gemini-probe-2`, deploy tay qua Dashboard): functions list
  có `gemini-proxy` ACTIVE; gọi kèm JWT → 401 do bug `getUser()` không đối
   số, đã sửa `getUser(token)` trong repo chờ redeploy; gọi không auth → 401
   gateway. 200 chưa đạt nên chưa viết chốt, chưa gỡ nhánh demo.
   Verify (`chore/cn3-proxy-verify`, sau redeploy tay từ source mới): functions
   list vẫn `version: 1`; JWT mới hợp lệ (`/auth/v1/user` → 200) nhưng probe
   kèm JWT vẫn 401 y hệt — nghi bundle chạy vẫn là code cũ, cần dán lại
   source hiện tại qua Dashboard. CN3-01 giữ tick (probe đã làm đủ bằng chứng),
   việc còn lại là redeploy đúng source rồi verify 200 ở phiên sau.)
- [x] CN3-02: Viết `src/features/summary/{api.ts,schemas.ts,queries.ts,errors.ts}`
  (upsert `document_summaries` ghi đè theo `UNIQUE(document_id)`, máy
  `pending → processing → done/failed`, `reclaimStaleProcessing` 15 phút theo
  `updated_at`, guard DOCX/`unsupported`/vượt ngưỡng) + unit test mock
  supabase/Gemini (không gọi mạng). Xong khi test xanh và app mở không crash
  dù chưa gọi AI thật. FR: FR-17, FR-20 (logic), FR-22 (nền).
  (2026-09-20, CN3-G1: xong + thêm `src/lib/ai/{models.ts,transport.ts}`
  nhánh trực tiếp theo lệnh session; 25 test mới, tổng 20 suites 212/212;
  `expo export --platform web` bundle đủ route; chưa màn hình — G2.)

## CN3-2 — Gọi AI và UI (phiên 2)

- [x] CN3-03: `summarizeWithGemini` theo đúng MỘT nhánh CN3-01 (PDF base64
  inline nguyên file, TXT text trực tiếp; map lỗi 429/quota/5xx/mạng/vượt
  20.000 ký tự sang tiếng Việt) + `requestSummary` end-to-end
  (guard → `processing` → upsert → `done`, lỗi → `failed`). Không retry tự
  động, mỗi lần bấm tối đa một request. FR: FR-14, FR-15, FR-16, FR-21.
  (2026-09-20, session `cn3g2-cn4`: G1 đã xong transport/request; phiên này
  thêm loader `source.ts` signed URL → cache → base64/text + 8 unit test.)
- [x] CN3-04: Vùng tóm tắt trong `/documents/[id]`: nút “Tóm tắt bằng AI”
  (DOCX ẩn nút + Banner gợi ý PDF), spinner + disabled khi chạy, empty/lỗi +
  “Thử lại” (chỉ khi `failed`), banner hạn mức khi 429 (không retry), tự thu
  hồi `processing` treo. Xong khi 4 trạng thái chạy tay ở light/dark. FR:
  FR-18, FR-19, FR-20.
  (2026-09-20, session `cn3g2-cn4`: xong `summary-section.tsx`; test tay
  light/dark thuộc chủ dự án theo TEST-CHECKLIST mục 14.)

## CN3-3 — Cách ly và đóng gói (phiên 3)

- [x] CN3 env bugfix: Kiểm tra nguồn `.env.local`, xác nhận Expo nạp và inline
  `EXPO_PUBLIC_GEMINI_API_KEY`; sửa hướng dẫn setup và lỗi cấu hình cho nhánh
  Gemini trực tiếp. FR: FR-14, FR-21.

- [ ] CN3-05: Viết `scripts/summaries-rls-proof.ts` theo khuôn FR-05 (A/B cho
  CRUD `document_summaries`); chạy proof trên remote đạt 100%; hồi quy
  `rls-proof` 7/7 + `storage-rls-proof` 5/5 còn xanh. FR: FR-22.
- [ ] CN3-06: Unit test full tầng summary, cập nhật traceability (FR-14→FR-22
  “đạt”), checklist tay CN3, devlog, nguyên liệu báo cáo theo code cuối; rà
  `git diff --cached` không có key. FR: FR-14..FR-22.

## CN4 — AI hỏi đáp trên tài liệu (FR-23 → FR-30, gộp cùng branch/tag với CN3-G2 theo lệnh session)

SPEC gốc không có nội dung FR-23 → FR-30 (grep toàn repo không thấy);
hành vi theo lệnh session `cn3g2-cn4`: cùng màn chi tiết, nhồi
`extracted_text` vào prompt, cấm vector DB/RAG/chunking, chưa có text thì
chặn + bảo tóm tắt trước. Branch `feat/cn3g2-cn4`, tag `cn3-cn4-done`.

- [x] CN4-01: `answerWithGemini` trong `src/lib/ai/transport.ts` (MỘT nhánh
  key trực tiếp như CN3, header bắt trả lời theo tài liệu) +
  `src/features/chat/{api.ts,schemas.ts,queries.ts,errors.ts}` (`askQuestion`
  guard → 1 request → validate → insert; `listQuestions` mới nhất trước;
  câu hỏi 1–500, đáp án 1–20.000). FR: FR-23, FR-24, FR-28 (logic).
  (2026-09-20: xong + 20 unit test mới, mock không gọi mạng.)
- [x] CN4-02: Vùng hỏi đáp trong `/documents/[id]` (`qa-section.tsx`): ô
  nhập + nút “Hỏi”, chặn khi chưa có text, lịch sử skeleton/empty/error +
  “Thử lại”, banner hạn mức khi 429 (không retry), field lỗi dưới ô nhập.
  FR: FR-25, FR-27, FR-28 (UI).
  (2026-09-20: xong; test tay light/dark thuộc chủ dự án theo
  TEST-CHECKLIST mục 16.)
- [x] CN4-03: Migration `0005_cn4_questions.sql` (bảng `document_questions`
  append-only, RLS 4 lệnh, CASCADE theo tài liệu) + khối SQL dán tay +
  `scripts/cn4-schema-verify.mjs` (thiếu cột → 42703) + types tay trong
  `database.ts`. CẤM tự chạy SQL remote. FR: FR-26, FR-29, FR-30.
  (2026-09-20: xong file; apply + verify thuộc chủ dự án.)

## Backlog CN5 — Quét hình ảnh đề bài bằng AI (FR-31 → FR-37)

Một branch code duy nhất `feat/cn5-scan-image`, merge `--no-ff` và tag
`cn5-hoan-thanh` sau khi cổng xanh (quyết định chủ dự án). Mỗi checkbox là
một commit độc lập và phải để app chạy được. Trước commit chạy
`npx tsc --noEmit`, `npm run lint`, `npm test` và test tay phần liên quan;
staged diff phải không có secret/key. Push ngay sau commit. Đặc tả ở
`docs/SPEC.md` mục CN5 (diễn giải do session `docs/cn5-spec` đề xuất — đề
gốc khác thì sửa SPEC trước, không sửa code).

- [x] CN5-01: Soạn `supabase/migrations/0006_cn5_scan_images.sql`
  (idempotent, CHỈ mở rộng whitelist `file_ext` + `allowed_mime_types`
  bucket `documents` cho ảnh png/jpg/jpeg/webp/heic/heif, KHÔNG gif; trần
  10 MB; không bảng/cột/giá trị status mới) +
  `scripts/cn5-schema-verify.mjs` (khuôn cn3/cn4). CẤM tự apply SQL
  (PAT sbp_ bị RBAC chặn ghi, cấm thử CLI/db push). Xong khi DỪNG và báo
  chủ dự án dán tay qua SQL Editor; code tiếp chỉ sau `VERIFY_PASS`.
  FR: FR-34 (nền).
  (2026-09-22: file và script đã commit/push; chờ chủ dự án dán SQL và
  chạy verify đạt trước CN5-02.)
- [x] CN5-02: `src/features/scan/{api.ts,schemas.ts,queries.ts,errors.ts}`
  (pick/camera bằng `expo-image-picker`: `mediaTypes: ['images']`,
  `result.canceled`/`assets[0]`, `base64: true`; lọc mime nhận
  png/jpeg/webp/heic/heif + từ chối gif tiếng Việt; quyền camera +
  `canAskAgain === false` → Settings + `getPendingResultAsync()` Android;
  user hủy → về cũ im lặng) + unit test mock picker/quyền (không gọi mạng).
  FR: FR-31, FR-32.
  (2026-09-22: picker/camera + unit hoàn thành; test tay Expo Go thực hiện
  sau khi CN5-04 có màn quét.)
- [x] CN5-03: OCR qua transport dùng lại ở `src/lib/ai` (prompt text TRƯỚC
  ảnh, mime `image/jpeg` cố định cho base64 picker, `responseMimeType` +
  `responseSchema`; parser JSON 3 nhánh đủ/dở/rỗng như CN3-PDF; giữ nguyên
  map 429/5xx, không retry; CẤM temperature/top_p/top_k/candidate_count/
  thinking_budget; model từ `models.ts`, cấm hardcode) + lưu `documents`
  (ảnh lên storage, `extracted_text` + `done` gộp; rỗng → `failed`, không
  ghi đè cũ) + unit test parser/quyền/sở hữu (không gọi mạng).
  FR: FR-33, FR-34.
  (2026-09-22: transport, parser, lưu Storage/DB và unit hoàn thành;
  test OCR thật trên Expo Go thuộc CN5-04/05.)
- [x] CN5-04: Màn quét (`app/(app)/scan.tsx` push từ thẻ CN5 dashboard,
  back qua `goBackOrReplace`): xem trước ảnh + nút “Quét”, 4 trạng thái
  (spinner/OCR/empty/lỗi + “Thử lại”, testID `scan-pick`/`scan-capture`/
  `scan-run`/`scan-retry`), banner hạn mức khi 429, chặn gọi lặp khi
  `processing`, thu hồi treo 15 phút; icon lấy từ `AppIcons` (thêm tên mới
  phải qua cổng glyphMap); thẻ CN5 dashboard sang `done`. FR: FR-35, FR-36.
  (2026-09-22: screen + route/dashboard + unit trạng thái/stale hoàn thành;
  kiểm tay Expo Go cần chủ dự án chạy sau khi mở bản code mới.)
- [x] CN5-05: Proof RLS A/B `documents` cho row ảnh quét (khuôn FR-05) +
  unit full tầng scan + cập nhật traceability (FR-31→FR-37 “đạt”),
  checklist tay CN5, devlog, báo cáo theo code cuối; rà `git diff --cached`
  không có key. FR: FR-37 (+ đóng gói).
  (2026-09-22: proof remote 8/8, OCR smoke và unit đạt; chủ dự án đã chụp
  camera, quét thành công và chấp nhận đóng CN5-05. Lỗi 503 và độ trễ
  biến động đã được ghi nhận, tối ưu; đo lại ngày sau và các ca tay chưa
  chạy vẫn để mở trong checklist, không coi là bằng chứng đã kiểm.)

## App shell — vỏ tabs + lối lùi (fix/app-shell)

- [x] APP-SHELL: `(app)` sang bottom Tabs (Trang chủ/Tài liệu/Tài khoản),
  CN1 trong tab Tài khoản, BackAction mọi màn con (`goBackOrReplace`),
  push cho màn con + replace chỉ ở biên (auth)↔(app), unit test
  `decideRouteTarget`/`goBackOrReplace`, checklist tay mục 15.
  (2026-09-20: xong code + test, chờ bấm tay Expo Go.) FR: FR-01..FR-05 (vỏ).

---

# Backlog CN6 — AI gợi ý lời giải (FR-38 → FR-45)

Chia BA session code như CN5 (docs → schema → code), một branch code duy
nhất `feat/cn6-solver`, merge `--no-ff` và tag `cn6-hoan-thanh` sau khi
cổng xanh (quyết định chủ dự án cho G4+, áp tiếp cho CN6). Mỗi checkbox là
một commit độc lập và phải để app chạy được. Trước commit chạy
`npx tsc --noEmit`, `npm run lint`, `npm test` và test tay phần liên quan;
staged diff phải không có secret/key. Push ngay sau commit. Đặc tả ở
`docs/SPEC.md` mục CN6 (diễn giải do session `docs/cn6-spec` đề xuất — đề
gốc khác thì sửa SPEC trước, không sửa code).

- Session docs — branch `docs/cn6-spec`, tag `docs-cn6`: SPEC + backlog +
  traceability skeleton (không code app, không SQL).
- Session schema — trong `feat/cn6-solver`: CN6-01 soạn 0007 + verify rồi
  DỪNG chờ chủ dự án dán tay (PAT sbp_ bị RBAC chặn ghi như CN5-01).
- Session code — cùng branch: CN6-02 → CN6-04 sau `VERIFY_PASS`.

- [x] CN6-00 (docs): SPEC mục CN6 (bảng FR-38→FR-45 diễn giải đề xuất +
  luật/validate + quy tắc dữ liệu + out of scope + 7 quyết định chốt) +
  backlog này + FR-TRACEABILITY FR-38→FR-45 (file/hàm dự kiến, giữ “chưa
  làm”) + 2 dòng ARCHITECTURE (solver SPEC, transport dùng lại). Không code
  app, không migration 0007, không verify script, không apply SQL — tất cả
  thuộc CN6-01→CN6-04. FR: FR-38..FR-45 (đặc tả).
- [x] CN6-01: Soạn `supabase/migrations/0007_cn6_solutions.sql`
  (idempotent, bảng `document_solutions`: `document_id` UNIQUE + CASCADE,
  `user_id` denormalized + CASCADE, `solution_text` 1–20000, `model` 1–100
  default `'gemini-3.5-flash'`, trigger `set_updated_at()` tái dùng, index
  `(user_id)`, RLS 4 lệnh khuôn CN3/CN4, grants authenticated/service_role/
  revoke anon; KHÔNG đụng cột/bảng cũ, KHÔNG giá trị status mới — CHECK
  `extraction_status` giữ nguyên 5 giá trị `pending/processing/done/failed/
  unsupported` đã đọc nguyên văn ở `0002`) +
  `scripts/cn6-schema-verify.mjs` (khuôn cn4/cn5: thiếu bảng/cột → mã lỗi
  PostgREST rõ). CẤM tự apply SQL (PAT sbp_ bị RBAC chặn ghi, cấm thử
  CLI/db push). Xong khi DỪNG và báo chủ dự án dán tay qua SQL Editor; code
  tiếp chỉ sau `VERIFY_PASS`. FR: FR-45 (nền).
  (2026-09-22: file và script đã commit/push; verify chạy thật trước apply
  FAIL đúng (`PGRST205` bảng chưa tồn tại, xem DEVLOG CN6-01); chờ chủ dự án
  dán SQL và chạy verify đạt `VERIFY_PASS` trước CN6-02.)
- [x] CN6-02: `solveWithGemini` trong `src/lib/ai/transport.ts` (mở rộng
  `postGenerate` dùng chung như CN4/CN5: prompt giải bài cố định +
  `responseMimeType` + `responseSchema` JSON một trường `solution_text`;
  parser 3 nhánh đủ/dở/rỗng khuôn `parseOcrJson`; giữ nguyên map 429/5xx,
  không retry; CẤM temperature/top_p/top_k/candidate_count/
  thinking_budget; model từ `models.ts`, cấm hardcode) +
  `src/features/solver/{api.ts,schemas.ts,queries.ts,errors.ts}`
  (`requestSolution` guard sở hữu + DOCX/thiếu-text → chặn trước mạng,
  1 request → validate 1–20000 → upsert ghi đè theo `UNIQUE(document_id)`;
  dở → lưu phần cứu được + báo cắt; rỗng → không ghi đè cũ;
  `getSolution`/`retrySolution`; key `['solution', documentId]`) + unit
  test mock transport/supabase (không gọi mạng). FR: FR-38, FR-39, FR-40,
  FR-41.
- [x] CN6-03: Vùng gợi ý lời giải trong `/documents/[id]`
  (`solution-section.tsx` khuôn `qa-section.tsx`/`summary-section.tsx`):
  nút “Gợi ý lời giải” (DOCX/thiếu text ẩn nút + Banner dẫn tóm tắt/quét
  trước), spinner + disabled khi chạy, empty/lỗi + “Thử lại”, banner hạn
  mức khi 429 (không retry); thẻ CN6 dashboard sang `done` (trỏ tab Tài
  liệu như CN3/CN4; `featureStatus` lật ở commit này, icon mới phải qua
  cổng glyphMap). FR: FR-42, FR-43.
  (Không route mới: row quét CN5 cũng là row `documents` nên một vùng phục
  vụ cả hai nguồn.)
- [x] CN6-04 (CUỐI CÙNG): Proof RLS A/B `document_solutions` (khuôn FR-05/
  `cn5-rls-proof.mjs`) + unit full tầng solver + cập nhật traceability
  (FR-38→FR-45 “đạt”), checklist tay CN6, devlog, báo cáo theo code cuối;
  rà `git diff --cached` không có key. FR: FR-44 (+ đóng gói).
