# Nhật ký phát triển

File này chỉ ghi kết quả đã xảy ra; không chép lại backlog, secret, email thật, token. Mỗi mục: đã làm → quyết định/lý do → kiểm thử (lệnh + kết quả thật) → còn nợ → mốc Git (full hash, branch, tag).

## Nhật ký

### CN1 — Tóm tắt Chức năng 1 FR-01→FR-05 (2026-09-16→19; chi tiết G1→G7+Rebrand đã gộp, chỉ giữ quyết định và bẫy kỹ thuật)

- G1 nền: Expo SDK 57 + TS strict + expo-router + Paper/Query providers, Supabase client lưu session bằng AsyncStorage. OTP recovery thay deep link (chạy ngay trong Expo Go). ESLint 9 vì plugin Expo chưa hỗ trợ ESLint 10.
- G2 DB: migration `0001` (profiles/study_notes, trigger, RLS 4 lệnh/bảng, bucket `avatars` private). Access token thiếu quyền → bỏ `link`/`db push`, apply bằng SQL Editor. Service key chỉ trong `scripts/*-proof.ts`. Bẫy: thiếu GRANT thì service_role cũng denied; option `AsyncStorage: true` lạ làm đỏ tsc.
- G3 auth+notes: `AuthProvider` single source + splash gate; trùng email phát hiện qua `identities == []`; validate zod thủ công (cấm thêm resolvers); test import từ `@jest/globals` (global jest không qua tsc). Regen `database.ts` bằng CLI cần Docker daemon chạy.
- G4 FR-03: từ G4 agent tự merge sau cổng xanh (quyết định chủ dự án). Luồng OTP recovery + cooldown 60s + resume khi kill app; reset xong về `/sign-in` (SPEC thắng). Supabase gộp lỗi OTP → UI ưu tiên nhánh hết hạn. Tách `recovery.ts`/`recoveryStorage.ts` vì AsyncStorage crash Jest. Sự cố OTP 8 số: server để Email OTP length = 8, chủ dự án chỉnh về 6, app khóa `^\d{6}$`.
- G5 FR-04: upload avatar base64→ArrayBuffer (`fetch().blob()` trả 0 byte); path `avatar_<timestamp>.jpg` (không mất avatar cũ khi lỗi giữa chừng); tái dùng SQL G2; render test bằng `react-test-renderer`. Bẫy proof: signIn trên client chung làm case anon mang session A → tách client, 5/5 PASS. Tag `v1.0.0`.
- G6 polish: icon Paper rỗng trên Expo Go → `settings.icon = MaterialCommunityIcons` + đối chiếu glyphmap; `AppTheme` intersection (MD3Theme là type alias); danger dùng `error` MD3; spacing 4/8/12/16/24/32; mock vector-icons vì font thật crash worker Jest. Tag `v1.1.0`.
- G6.1 header: tắt `headerShown` trùng; navigation theme từ `adaptNavigationTheme` ở MODULE SCOPE (gọi trong render remount navigator); `ThemeProvider` import từ `expo-router`. Tag `v1.1.1`.
- G7 theme: 3 mode light/dark/system + persist; hydrate xong mới render (splash che, chống flash); memo theme/navigationTheme; logic thuần `themeMode.ts` + prop override cho test (mock module RN crash Jest). Tag `v1.2.0`.
- Rebrand: dùng chung gom vào `src/shared/`, cấm alias `@/*`; dashboard 6 thẻ; keep-alive ping `/auth/v1/health` (query bảng 401 do RLS) + 2 secret GH. Tag `v1.3.0`.
- Cổng CN1 cuối: `tsc` đạt, `lint` 0 errors (2 warning `watch()`), `npm test` 110/110, `rls-proof` 7/7, `storage-rls-proof` 5/5. Nợ chung: test tay Expo Go thuộc chủ dự án; `npm audit` 14 moderate (drift SDK, không tự fix).

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

---

### CN2-G2 — Chi tiết, đổi tên, xóa, môn học, tìm kiếm/lọc (FR-09 → FR-12) — 2026-09-20

**Đã làm gì**

- Branch `cn2-g2` từ `main` (sau merge `cn2-g1`). `.env`/`.env.local` đã nằm
  trong `.gitignore` từ trước nên không cần commit đầu sửa ignore.
- Commit 1 (tầng dữ liệu): `storage.ts` thêm trần 30 môn, chuẩn hóa tên môn,
  pattern `ilike` (thoát `%_\\`), so khớp phân biệt dấu, lọc client-side cho
  test; `schemas.ts` thêm `subjectNameSchema` 1–60; `errors.ts` thêm
  `DocumentDeletePartialError` + `toSubjectsErrorMessage` (map 23505) +
  `toOpenDocumentErrorMessage`; `api.ts` thêm `getDocument`, `getDocumentUrl`
  (TTL 3600s), `renameDocument` (chỉ `display_name`), `deleteDocument`
  (storage-trước-DB-sau), `assignDocumentSubject`, CRUD subjects
  (`countSubjects` guard trần 30, chặn trùng tên, `countDocumentsInSubject`
  cho cảnh báo xóa), `listDocuments` thêm `ilike` + lọc môn; `queries.ts`
  thêm 9 hook (`useDocument`, `useDocumentUrl` cache 55 phút, rename/assign/
  delete document, subjects CRUD, đếm tài liệu/môn).
- Commit 2 (màn hình): `/documents` thêm `Searchbar` debounce 300ms + Chip
  lọc Tất cả/môn/Chưa phân loại, bấm dòng sang chi tiết, nhãn DOCX “AI không
  đọc”; `/documents/[id]` mới (thông tin + nút Mở tệp signed URL + `canOpenURL`,
  không WebView; đổi tên inline; đổi môn CHỈ ở đây qua Menu; xóa có Dialog);
  `/subjects` mới (tạo/sửa validate 1–60 + chặn trùng, xóa cảnh báo rõ số tài
  liệu về Chưa phân loại). Icon mới `folder-outline`, `open-in-new`, `pencil`,
  `tag-outline` (Searchbar dùng icon `magnify` có sẵn) — Paper `settings.icon` giữ nguyên.
- Commit 3 (docs): tick CN2-05→CN2-09; FR-TRACEABILITY FR-09→FR-12 trỏ file/
  hàm thật, FR-13 ghi rõ CN2 chỉ hạ tầng; TEST-CHECKLIST thêm 10 case tay G2;
  REPORT-NOTES thêm giới hạn dấu tiếng Việt + không viewer; ARCHITECTURE thêm
  5 icon G2 vào bảng.
- Không cài dependency nào: `Linking` nằm trong `react-native` core, debounce
  viết tay bằng `setTimeout`, Menu/Dialog/Searchbar đã có trong Paper.

**Quyết định và lý do**

- Xóa storage trước, DB sau; DB fail sau storage → `DocumentDeletePartialError`
  + Snackbar “Thử lại” (CẤM nuốt im lặng theo lệnh session). Bản ghi trỏ hư
  không tệ hơn object mồ côi (UI bấm vào lỗi ngay), đúng ARCHITECTURE.
- Đổi môn CHỈ ở chi tiết (Menu), danh sách chỉ Chip lọc — đúng CN2-4/SPEC;
  `filterDocumentsLocal` chỉ phục vụ unit test, server là nguồn sự thật.
- Tìm kiếm PHÂN BIỆT DẤU (`ilike`): `unaccent` không immutable nên không đánh
  index trực tiếp; đã ghi vào REPORT-NOTES + khóa bằng unit test, không lặng
  lẽ bỏ qua.
- Sửa 2 lỗi lint `set-state-in-effect` bằng derive-trong-render (filter) và
  tách `RenameDocumentForm` keyed theo `doc.id` (không effect đồng bộ).
- Không viết `scripts/documents-rls-proof.ts` ở G2: RLS/policy đã chứng minh ở
  CN1 + verify 14/14 sau apply 0002; proof A/B cho documents/subjects để phiên
  polish gom một thể cùng test tay (ghi nợ bên dưới).

**Cố tình không làm và lý do**

- Không đổi bảng màu (task CN2-13 thuộc phiên polish `v2.0.0`, đổi sớm hỏng
  ảnh báo cáo); không sửa file `.sql` (0002 đã apply, idempotent đã xác nhận
  remote); không đụng `extracted_text` ngoài việc đọc (CN3 thực thi FR-13);
  không làm viewer/WebView (CN2-1: đề không yêu cầu, WebView Android không
  render PDF); không gọi Gemini (việc của CN3); không thêm dependency.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (exit 0).
- Lệnh: `npm run lint` → 0 errors, 2 warning `watch()` cũ (kế thừa G3–G7,
  không từ code mới — 5 warning `import/first` trong test mới đã sửa bằng
  cách đưa import lên trước `jest.mock`).
- Lệnh: `npm test` → 16 suites, **174/174 PASS** (giữ nguyên 148 cũ, +26 mới
  trong `documents-g2.test.ts`, không sửa test cũ, không gọi mạng).
- Test tay Expo Go (10 case CN2-G2 trong TEST-CHECKLIST): chưa chạy (không có
  thiết bị trong phiên); chủ dự án chạy.

**Còn nợ / giới hạn đã biết**

- Cần chủ dự án chạy checklist tay CN2-G2 trên Expo Go (10 case).
- Proof RLS documents/subjects remote + regen `database.ts` bằng CLI (phiên polish).
- Tìm kiếm phân biệt dấu tiếng Việt (giới hạn đã chốt, xem REPORT-NOTES).
- Object mồ côi nếu xóa DB fail sau storage (báo rõ + cho thử lại; dọn rác
  ngoài đề, không làm).

**Mốc Git**

- Commit cuối: `a034134814bc964b0eb46d264efd45d2375471a6` (merge --no-ff)
- Branch: `cn2-g2`
- Tag: `cn2-g2-done` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge vào `main` sau khi cổng chất lượng xanh

---

### Release v2.0.0 — CN2 hoàn tất (FR-06→FR-13) — 2026-09-20

**Đã làm gì**

- CN2-13: bảng màu riêng seed `#4A5FC1` (TonalSpot, giữ ánh xạ tone của Paper)
  cho toàn app; mọi cặp chữ/nền ≥ 4.5:1; `radius.sheet = 28`; test khóa palette.
  `adaptNavigationTheme` vẫn ở module scope, persist + chống flash giữ nguyên.
- Rà CN1+CN2: không còn hex ngoài `theme.ts`, mọi màn dùng token nên không vỡ
  tương phản (yếu nhất dark `inversePrimary` 4.98:1 vẫn đạt).
- DEVLOG: CN1 gộp thành 1 mục (~15 dòng), CN2 giữ nguyên → 353 dòng (+ release
  note này). FR-01→FR-13 trỏ file/hàm thật; README/SETUP/REPORT-NOTES cập nhật;
  TEST-CHECKLIST thành danh sách bấm tay chụp ảnh theo màn hình.
- Tick CN2-10→CN2-13; CN2-01/CN2-02 giữ chưa tick (ghi nợ bên dưới).

**Giới hạn có chủ đích (không phải bỏ sót)**

- Test tay Expo Go CN2 (22 case) thuộc chủ dự án; ảnh theme tím cũ hết dùng được.
- Chưa viết `scripts/documents-rls-proof.ts` (dựa vào verify 14/14 + proof CN1).
- `database.ts` đồng bộ tay theo `0002` (chờ regen CLI); tìm kiếm phân biệt dấu;
  không viewer trong app; DOCX `unsupported`; FR-13 chỉ hạ tầng, CN3 thực thi.

**Đã kiểm thử**

- `npx tsc --noEmit` → exit 0; `npm run lint` → 0 errors, 2 warning `watch()` cũ.
- `npm test` → 17 suites, **177/177 PASS**; `rls-proof` **7/7**; `storage-rls-proof` **5/5**.

**Mốc Git**

- Commit merge: `dbdcd64219f71e48e372459c419bc2ddef379265` (merge --no-ff)
- Branch: `release/v2.0.0`
- Tag: `v2.0.0` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge `--no-ff` vào `main` sau khi cổng chất lượng xanh

---

### Docs CN3 — Đặc tả AI tóm tắt FR-14 → FR-22 + migration 0004 — 2026-09-20

**Đã làm gì**

- SPEC thêm mục CN3: bảng FR-14→FR-22 (diễn giải do session đề xuất — đề gốc
  trong repo chỉ có tên Chức năng 3, không có nội dung từng FR), luật validate
  (guard DOCX, ngưỡng inline, chống đốt quota, summary ≤ 20.000 ký tự, thu hồi
  treo 15 phút), quy tắc dữ liệu, out of scope, 7 quyết định chốt (MODEL, NOLIB,
  KEY, SIZE, STATUS, TRIGGER, SCHEMA) mỗi cái kèm lý do.
- DATA-MODEL thêm bảng `document_summaries` + máy trạng thái
  `extraction_status` (ai đặt/lúc nào/retry/thu hồi treo). ARCHITECTURE thêm
  màn CN3 (vùng trong `/documents/[id]`, không route mới) + tầng
  `src/features/summary/` + chặn gọi lặp 3 lớp + biến
  `EXPO_PUBLIC_GEMINI_API_KEY` (chỉ nhánh fallback). REPORT-NOTES thêm 7 Q&A
  CN3 (gồm giới hạn demo khi key nằm trong app). TRACEABILITY điền FR-14→FR-22
  (file/hàm dự kiến, giữ “Chưa làm”). SETUP thêm mục 5c. TEST-CHECKLIST thêm
  mục 14 (7 case tay CN3).
- TASKS tách backlog CN3 thành 3 phiên (`cn3-g1`/`cn3-g2`/`cn3-g3`, task
  CN3-01→CN3-06), probe Edge Function làm lại từ đầu trong CN3-01.
- Mới `supabase/migrations/0004_cn3_summaries.sql` (idempotent, RLS 4 lệnh theo
  `user_id`, constraint đặt tên rõ) + `scripts/cn3-schema-verify.sql` chỉ-đọc
  (10 dòng ĐẠT/KHÔNG ĐẠT). Đánh số `0004` vì `0003` không tồn tại (CN2 xác nhận
  không cần bản vá).
- Apply `0004` lên remote bằng `psql` (credential có sẵn): chạy HAI LẦN liên
  tiếp, cả hai `exit 0`; verify remote **10/10 ĐẠT**.

**Quyết định và lý do (rút gọn, chi tiết trong SPEC)**

- Bảng riêng `document_summaries` thay vì thêm cột: tách vòng đời, ghi đè 1
  row qua `UNIQUE(document_id)`, RLS độc lập, CASCADE dọn kèm.
- Bấm nút thay vì auto sau upload: mỗi lần bấm = 1 request quota (~1.500/ngày,
  reset nửa đêm giờ Thái Bình Dương); auto đốt quota vô ích.
- Không lib PDF: không bản nào chạy trên Expo Go; Gemini đọc PDF native vision.
- Ngưỡng inline tra tài liệu Google 2026-09-19: 100 MB/request, PDF 50 MB;
  app chặn 10 MB nên luôn gửi nguyên file, vượt thì từ chối, không chunk.
- Key 2 nhánh vì tag `edge-probe` không tồn tại local/remote: probe đạt thì
  proxy giữ key trong secret (app gửi JWT), không thì `EXPO_PUBLIC_...` + ghi
  giới hạn demo; chỉ code một nhánh.

**Cố tình không làm (theo lệnh session)**

- Không viết code CN3 (`.ts/.tsx`), không Edge Function, không probe deploy,
  không cài package, không đụng CN4→CN6.
- Không sửa nội dung FR-01→FR-13 hay code CN1/CN2; không đổi theme/bảng màu.
- Không tick checkbox CN3 nào: CN3-01→CN3-06 đòi code + probe + proof, tick sớm
  là nói dối tiến độ.

**Đã kiểm thử**

- Postgres 16 local + mock `auth.users`/`auth.uid()`/`set_updated_at()`/bảng
  `documents` tối thiểu (mô phỏng 0001+0002 đã apply): chạy 0004 hai lần liên
  tiếp → cả hai `exit 0`; verify local → **10/10 ĐẠT**; smoke INSERT trùng
  `document_id` bị UNIQUE chặn, xóa document CASCADE hết summary.
- Remote (`psql $SUPABASE_DB_URL`): 0004 hai lần `exit 0`; verify **10/10 ĐẠT**.
- `npx tsc --noEmit` → đạt; `npm run lint` → 0 errors, 2 warning `watch()` cũ;
  `npm test` → 17 suites, **177/177 PASS** (giữ nguyên, không sửa test).

**Còn nợ**

- Probe Edge Function + code CN3 (3 phiên `cn3-g1`/`cn3-g2`/`cn3-g3`).
- Proof RLS A/B `document_summaries` (CN3-05); test tay CN3 (mục 14 checklist).

**Mốc Git**

- Commit merge: `cc1233fee08b11263e1abf9a5e0703e7dd0bc17a` (merge --no-ff)
- Branch: `docs/cn3`
- Tag: `docs-cn3` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge `--no-ff` vào `main` sau khi cổng chất lượng xanh

---

### App shell — bottom tabs + lối lùi mọi màn con — 2026-09-20

**Nguyên nhân gốc (chẩn đoán trước khi sửa)**

- `(app)/_layout.tsx` là Stack phẳng duy nhất cho mọi màn sau đăng nhập;
  repo vốn là bài 1 đơn lẻ nên điều hướng thiết kế quanh `/notes` như “home”.
- Đăng nhập/đăng ký `router.replace('/notes')` xóa sạch lịch sử auth, trong
  khi màn gốc CN1 (`/notes`, `/dashboard`) không có Appbar.BackAction và
  `/profile` chỉ hiện back khi `canGoBack()` — vừa login xong thì không có gì
  để back nên kẹt. Trên web không thấy vì nút Back trình duyệt che lấp.
- `documents/index` có BackAction vô điều kiện gọi `router.back()` — deep link
  vào là bấm chết. Wizard OTP dùng `replace` giữa các bước nên không sửa lại
  được email/mã.

**Đã làm gì**

- Branch `fix/app-shell` từ `main`. Không thêm dependency (Tabs có sẵn trong
  `expo-router`, icon dùng MaterialCommunityIcons đã có).
- Mới `src/shared/lib/navigation.ts`: `decideRouteTarget` (loading/recovery/
  app/auth theo session + cờ recovery), `TAB_ROOTS`, `goBackOrReplace`
  (còn lịch sử thì back, hết thì replace về gốc tab) + unit test 10 case.
- `(app)/_layout.tsx`: Stack → bottom Tabs (Trang chủ `home` / Tài liệu
  `file-document-outline` / Tài khoản `account`, đã đối chiếu glyphmap);
  `headerShown: false`, tab bar ăn `theme.colors`; màn con `href: null` +
  ẩn tab bar. CN1 nằm trong tab Tài khoản (thêm nút “Ghi chú học tập” ở
  `/profile`); dashboard thành lưới 6 thẻ, CN3→CN6 bấm báo “đang phát triển”.
- Mọi màn con có BackAction luôn hiện, `onPress` qua `goBackOrReplace`;
  gốc tab bỏ back thừa. Vào màn con dùng push; `replace` chỉ ở biên
  `(auth)`↔`(app)` (landing login/signup về `/dashboard`, đăng xuất về
  `/sign-in`). Wizard OTP forgot→verify→reset chuyển sang push.
- `app/index.tsx` refactor dùng `decideRouteTarget`, hành vi giữ nguyên.

**Cố tình không làm và lý do**

- Không sửa logic nghiệp vụ CN1/CN2, schema, theme/bảng màu (v2.0.0), tính
  năng CN2 mới — ngoài phạm vi lệnh.
- Giữ `replace` khi thoát màn sau khi xong việc (đổi pass xong, upload xong,
  reset pass xong): đó là lối ra chứ không phải lối vào, giữ history gọn.
- Không test nút Back cứng Android bằng thiết bị thật trong phiên; đã ghi
  10 case tay mục 15 TEST-CHECKLIST để chủ dự án chạy.

**Đã kiểm thử**

- Trước: 17 suites, 177/177 PASS. Sau: 18 suites, **187/187 PASS**
  (+10 mới, không sửa test cũ).
- `npx tsc --noEmit` → exit 0; `npm run lint` → 0 errors, 2 warning `watch()`
  cũ (kế thừa).
- `npx expo export --platform web` → success, toàn bộ 17 route bundle được,
  không error (xóa `dist/` sau khi verify).

**Còn nợ**

- Chủ dự án chạy checklist tay mục 15 trên Expo Go (tabs, back cứng, đăng
  xuất, mở lại app còn phiên).

**Mốc Git**

- Commit merge: `3740a948952ab32a24ebbd8265e82f748ab7555a` (merge --no-ff)
- Branch: `fix/app-shell`
- Tag: `app-shell` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge `--no-ff` vào `main` sau khi cổng chất lượng xanh

---

### Probe gemini-proxy + secret Gemini (CN3-01) — 2026-09-20

**Đã làm gì**

- [0] Đọc AGENTS.md, entry DEVLOG gần nhất (app-shell) và soát tag
  `edge-probe`: tag KHÔNG tồn tại local lẫn remote nên không có kết luận cũ
  nào để kế thừa — probe làm lại từ đầu trong phiên này. `.env` đã nằm trong
  `.gitignore` từ trước (dòng 1), credential đọc theo tên biến, không in giá trị.
- [1] Branch `chore/gemini-secret` từ `main` (đã `pull --ff-only`, up to date).
- [2] Thử nạp secret `GEMINI_API_KEY` bằng `supabase secrets set --env-file`
  (file tạm NGOÀI repo, `chmod 600`, xóa ngay sau khi chạy) với project-ref
  trong `.env` → lỗi `LegacySecretsSetUnexpectedStatusError`, 403 thiếu quyền.
  `supabase secrets list` xác nhận chỉ có 5 secret mặc định của hệ thống, chưa
  có `GEMINI_API_KEY` (list chỉ hiện tên + hash, đúng kỳ vọng). Giá trị key
  không vào bất kỳ file nào trong repo, kể cả rút gọn.
- [3] Mới `supabase/functions/gemini-proxy/index.ts` (tên theo lệnh session;
  SPEC/TASKS ghi `summarize`, tên cuối chốt khi deploy): check JWT ở header
  `Authorization` (thiếu/sai → 401 qua `getUser`), đọc key duy nhất bằng
  `Deno.env.get('GEMINI_API_KEY')` (thiếu → 500 kèm thông báo rõ), gọi Gemini
  2.5 Flash với prompt cố định `"Trả lời đúng một từ: OK"`, trả về text nhận
  được. CHƯA làm logic CN3. `supabase functions deploy gemini-proxy` → lỗi
  `FunctionsApiStatusError`, 403 cùng họ (token hiện tại chỉ đọc được, cùng
  gốc với G2 bỏ `link`/`db push`) nên dừng deploy/curl — chưa có gì để gọi thử.
  `tsconfig.json` thêm `exclude` cho `supabase/functions` (Deno runtime, không
  phải TS của app) để cổng typecheck giữ xanh.
- [4] Ghi `docs/REPORT-NOTES.md` (mục probe 2026-09-20): demo CN3 phải dùng
  `EXPO_PUBLIC_GEMINI_API_KEY`, đây là giới hạn đã biết + vì sao không an toàn
  (key trong bundle, đốt quota, phải restrict, lộ thì rotate). Không lặng lẽ
  chuyển nhánh: quyết định ghi công khai, code fallback để CN3-03 làm.
- [5] `docs/ARCHITECTURE.md`: sơ đồ đường đi app → Edge Function → Gemini, nêu
  rõ key không bao giờ rời server ở đường proxy; `docs/SETUP.md`: mục 5d (chủ
  dự án nạp secret + deploy + curl kỳ vọng 401/200/500) và biến demo;
  `.env.example` thêm tên biến demo (giá trị rỗng); tick CN3-01 kèm kết quả.

**Quyết định và lý do**

- Giữ source probe trong repo dù chưa deploy được: file không chứa secret,
  chủ dự án deploy được ngay khi có token đủ quyền (SETUP 5d); xóa đi thì mất
  bằng chứng đường đúng.
- Không code nhánh `EXPO_PUBLIC_...` trong phiên này: CN3-01 chỉ chốt nhánh
  bằng bằng chứng, code fallback là việc CN3-03; nhồi cả hai vào một phiên là
  dồn commit, trái Quy tắc Git.

**Cố tình không làm và lý do**

- Không gọi thử curl (deploy chưa qua nên không có endpoint để gọi); không
  retry `secrets set` qua Management API trực tiếp (cùng token, cùng RBAC,
  kết quả 403 đã đủ kết luận); không sửa SPEC CN3-KEY (đặc tả hai nhánh vẫn
  đúng, probe chỉ chốt nhánh); xem thêm mục “cố tình không làm” ở báo cáo cuối.
- Không đụng code app, test, migration, theme; không cài package.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → exit 0 (gồm `exclude` mới).
- Lệnh: `npm run lint` → 0 errors, 2 warning `watch()` cũ (kế thừa, không từ
  code mới).
- Lệnh: `npm test` → 18 suites, **187/187 PASS** (giữ nguyên, không sửa test,
  không gọi mạng).
- Bằng chứng probe (bằng lệnh thật, credential trong `.env`): `secrets set` →
  403; `functions deploy` → 403; `secrets list` → 5 secret mặc định, không có
  `GEMINI_API_KEY`.

**Còn nợ**

- Chủ dự án nạp secret + deploy + curl lại theo SETUP 5d (kỳ vọng
  401 thiếu JWT / 200 `text: OK` / 500 thiếu secret), rồi CN3-03 code nhánh đã chốt.
- Tên function cuối (`gemini-proxy` hay `summarize`) chốt lúc deploy thật.

**Mốc Git**

- Commit probe: `176e97d1201d63fa350d1a1546b1e4fb9c74ce46`
- Commit merge: `a1b9f044768c3b238816431781ea0481edffe9ea` (merge --no-ff)
- Branch: `chore/gemini-secret`
- Tag: `gemini-wired` (tạo ngay sau tự merge theo quyết định chủ dự án, đã push)
- PR: không mở PR; tự merge `--no-ff` vào `main` sau khi cổng chất lượng xanh
