# Dựng dự án từ số 0 (hoàn chỉnh CN1 + CN2; mục 5b/7b là bước CN2)

Tài liệu duy nhất để dựng app từ clone tới chạy trên Expo Go. Dừng ngay nếu
package được nêu bị deprecated hoặc Expo báo không tương thích SDK 57; báo chủ
dự án, không tự thay package. Không ghi secret/key/password vào repo hay ảnh.

## 1. Điều kiện máy

- Node.js tối thiểu `22.13.x` theo Expo SDK 57; Git; Expo Go tương thích SDK 57
  trên điện thoại. Không tạo development build, không sinh `ios/`/`android/`.
- Một tài khoản GitHub và một tài khoản Supabase (free tier: project có thể bị
  tự pause khi không dùng — mở Dashboard resume rồi chạy tiếp).

## 2. Clone và cài dependency

```bash
git clone <repo-url>
npm ci
npx expo install --check
```

Chỉ cài thêm package bằng `npx expo install <tên-package>` sau khi chủ dự án
duyệt. G5 dùng thêm `expo-image-picker`, `expo-image-manipulator`
(Expo Go, SDK 57) và `base64-arraybuffer` (decode upload avatar, thuần JS).
CN2 dùng thêm `expo-document-picker` (chọn tệp), `expo-file-system` (đọc tệp
bằng API mới `File`/`Directory`/`Paths`), `expo-crypto` (`Crypto.randomUUID()`
đặt tên object vì `crypto` toàn cục không đảm bảo có trên Hermes) —
cả ba cài đúng line SDK 57 bằng `npx expo install`.

## 3. Tạo Supabase project bằng Dashboard (làm tay)

1. New project → organization → tên `student-account-manager` → database
   password mạnh (cất ngoài repo) → region gần người dùng → chờ sẵn sàng.
2. Project Settings → Data API: lấy **Project URL** và **Publishable key**
   (bản cũ gọi là anon key). Không lấy `service_role` cho app.
3. Project Settings → Access Tokens: tạo token để CLI dùng (`SUPABASE_ACCESS_TOKEN`,
   `SUPABASE_PROJECT_REF`).
4. Project Settings → Database: copy connection string cho `SUPABASE_DB_URL`
   (chỉ dùng cho `supabase gen types` và chẩn đoán read-only, không vào app).
5. Project Settings → Data API → API Keys (legacy): copy `service_role`
   (chuỗi JWT `eyJ...`) — chỉ cho script proof, không vào app.

## 4. Cấu hình local

1. Copy `.env.example` thành `.env`, điền:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=false` khi dev (`true` khi demo).
   - `EXPO_PUBLIC_GEMINI_API_KEY` — CHỈ cho bản demo CN3 sau probe 2026-09-20
     (deploy proxy 403 thiếu quyền): GIỚI HẠN ĐÃ BIẾT, key trong bundle giải
     nén ra được; phải restrict riêng Gemini API trong Google Cloud Console;
     không commit, không chụp ảnh, xem REPORT-NOTES.
2. Tạo `.env.local` (đã gitignore), điền:
   - `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (chỉ `scripts/*-proof.ts` đọc).
3. Liệt kê tên biến xem `.env.example`; không commit `.env`/`.env.local`.

## 5. Apply SQL theo thứ tự (SQL Editor, paste tay)

Không dùng `supabase link` / `db push` (access token từng thiếu quyền, xem
DEVLOG G2). Thứ tự:

1. Dán **toàn bộ** `supabase/migrations/0001_account_manager.sql` → Run.
   Mong đợi `Success. No rows returned`. Migration idempotent: chạy lại vẫn success.
   File này tạo bảng `profiles`/`study_notes`, constraints, trigger
   `handle_new_user`/`set_updated_at`, RLS đủ 4 lệnh mỗi bảng, bucket private
   `avatars` (2 MB, JPEG/PNG/WEBP) và 4 Storage policy.
2. G5 không thêm file SQL: bucket/policy đã nằm trong migration G2; Storage
   được kiểm chứng bằng `scripts/storage-rls-proof.ts` thay vì SQL mới.
3. Không chạy từng đoạn rời rạc (thiếu policy/grant sẽ hở bảo mật).

## 5b. Apply migration CN2 (SQL Editor, paste tay)

1. Dán **TOÀN BỘ** file `supabase/migrations/0002_cn2_documents.sql` →
   Run. Mong đợi `Success. No rows returned`. Migration idempotent: chạy lại
   vẫn success (đã kiểm chứng chạy 2 lần liên tiếp trên Postgres 16 local).
   File này tạo bảng `subjects`/`documents`, constraints, index, RLS đủ 4 lệnh
   mỗi bảng, trigger `updated_at` (tái dùng function có sẵn), bucket private
   `documents` (10485760 byte, đúng 3 MIME whitelist) và 4 Storage policy.
   KHÔNG cần tạo bucket tay vì migration đã tạo (kể cả bucket đã có tay từ
   trước, migration cũng cập nhật đúng cấu hình).
2. Dán **TOÀN BỘ** file `scripts/cn2-schema-verify.sql` → Run để kiểm chứng.
   File này chỉ đọc, gộp sẵn bằng `union all` nên hiện một bảng duy nhất.
   Kết quả mong đợi — mọi dòng đều `DAT` (14 dòng):
   bucket tồn tại/private/10485760; đúng 3 MIME; RLS bật cả 2 bảng; đủ 4+4
   policy bảng; đủ 4 policy storage; FK `subject_id` SET NULL; FK `user_id`
   CASCADE; đủ 2 index; đủ 3 check `file_ext`/`file_size`/`extraction_status`.
   Dòng nào `KHÔNG DAT` thì migration chưa áp đúng — báo chủ dự án, không sửa
   tay lẻ tẻ.
3. Không dùng `supabase link` / `db push` vì access token `sbp_` không đủ quyền
   trên project (lý do đã ghi ở DEVLOG G2, vẫn đúng tới nay).
4. Không chạy từng đoạn rời rạc (thiếu policy/grant sẽ hở bảo mật).

## 5c. Apply migration CN3 (SQL Editor, paste tay)

1. Dán **TOÀN BỘ** file `supabase/migrations/0004_cn3_summaries.sql` →
   Run. Mong đợi `Success. No rows returned`. Migration idempotent: chạy lại
   vẫn success (đã kiểm chứng chạy 2 lần liên tiếp trên Postgres 16 local +
   smoke test UNIQUE/CASCADE). Yêu cầu chạy trước: `0001` (hàm
   `set_updated_at`) và `0002` (bảng `documents`). File `0003` không tồn tại
   (CN2 xác nhận không cần bản vá) nên đánh số thẳng `0004`.
   File này tạo bảng `document_summaries` (1-1 với `documents` qua
   `UNIQUE(document_id)`, CASCADE cả hai FK), CHECK `summary_text` 1–20.000
   ký tự, RLS đủ 4 lệnh theo `user_id`, trigger `updated_at` (tái dùng function
   có sẵn). Không bucket mới, không Storage policy mới.
2. Dán **TOÀN BỘ** file `scripts/cn3-schema-verify.sql` → Run để kiểm chứng.
   File này chỉ đọc, gộp sẵn bằng `union all` nên hiện một bảng duy nhất.
   Kết quả mong đợi — mọi dòng đều `DAT` (10 dòng):
   bảng tồn tại; RLS bật; đủ 4 policy; unique `document_id`; FK `document_id`
   CASCADE; FK `user_id` CASCADE; check `summary_text`; check `model`; index
   user; trigger `updated_at`.
   Dòng nào `KHÔNG DAT` thì migration chưa áp đúng — báo chủ dự án, không sửa
   tay lẻ tẻ.

## 5d. Đường proxy Gemini (secret + deploy LÀM TAY qua Dashboard)

Nguyên nhân phải làm tay: token PAT bị RBAC tầng organization chặn ghi —
`GET /v1/projects/{ref}/functions` trả 200 (đường đọc hoạt động) nhưng `POST
.../functions/deploy` trả 403; scope token không vượt được role tài khoản.
CLI không thử lại (vô ích với cùng token). Secret `GEMINI_API_KEY` và deploy
`gemini-proxy` do chủ dự án làm tay qua Dashboard (Edge Functions → Secrets +
Deploy). Đối chiếu sau deploy tay (`chore/gemini-probe-2`):
`GET .../functions` → 200, `gemini-proxy` `status: ACTIVE`, `version: 1`,
`verify_jwt: true`.

Probe (`chore/gemini-probe-2`, endpoint thật đã tồn tại):

1. Tài khoản test tái dùng: `gemini-probe-20260920@example.com`
   (`full_name: Gemini Probe`, `student_code: PROBE001`). Lưu ý: signup yêu
   cầu `data.student_code` (trigger phía server, thiếu báo
   `student_code is required`); mật khẩu chỉ dùng trong phiên probe, KHÔNG
   ghi vào repo — phiên sau muốn tái dùng email này thì đặt lại mật khẩu qua
   Dashboard, hoặc signup email mới.
2. JWT: `POST {EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`
   (header `apikey = EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, body
   email + password) → 200, có `access_token`.
3. Gọi probe kèm JWT:
   `POST {EXPO_PUBLIC_SUPABASE_URL}/functions/v1/gemini-proxy`
   (header `Authorization: Bearer <access_token>`) → **401**
   `{"error":"JWT không hợp lệ hoặc đã hết hạn."}` — JWT vừa mint nên lỗi
   nằm ở code probe: `getUser()` không đối số (client Edge Function không giữ
   session). Đã sửa trong repo: truyền token tường minh
   `getUser(token)`. CHƯA verify 200 vì deploy lại phải làm tay qua
   Dashboard — chủ dự án redeploy rồi curl lại, kỳ vọng **200**
   `{"ok":true,"model":"gemini-2.5-flash","text":"OK"}` (trim trước khi đối
   chiếu).
4. Gọi probe KHÔNG kèm `Authorization` → **401**
   `{"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization
   header"}` (gateway chặn) — bằng chứng hàm không mở cho người lạ.
5. Probe đạt 200 thì CN3-03 code đúng MỘT nhánh proxy và gỡ
   `EXPO_PUBLIC_GEMINI_API_KEY`; tới lúc đó hai nhánh vẫn giữ nguyên, không
   viết chốt sớm.
6. Verify sau redeploy tay (`chore/cn3-proxy-verify`, 2026-09-20): chủ dự án
   đã redeploy qua Dashboard từ source mới, secret `GEMINI_API_KEY` nạp tay.
   Đối chiếu `GET .../functions` → 200, `gemini-proxy` vẫn `status: ACTIVE`,
   `version: 1`, `verify_jwt: true` (version KHÔNG tăng so với probe-2).
   Probe bằng tài khoản mới `gemini-verify-20260920@example.com` (signup kèm
   `data.full_name`/`student_code`, signin → 200 có `access_token`):
   POST kèm JWT → **401** `{"error":"JWT không hợp lệ hoặc đã hết hạn."}`
   (y hệt probe-2); gọi thẳng `/auth/v1/user` với đúng JWT đó → **200**
   đúng email nên JWT không có lỗi — khả năng cao bundle đang chạy vẫn là
   code cũ (`getUser()` không đối số), redeploy chưa ăn source mới trong
   repo (bản đã sửa `getUser(token)`). Gọi không auth → **401** gateway như
   cũ. Kết luận: CHƯA đạt 200, giữ nguyên hai nhánh, không viết chốt.
    Việc cần người: dán lại source
    `supabase/functions/gemini-proxy/index.ts` HIỆN TẠI trong repo qua
    Dashboard → redeploy → kiểm tra `version` tăng → curl lại 3 bước trên,
    kỳ vọng 200 `{"ok":true,"model":"gemini-2.5-flash","text":"OK"}`.
7. Probe lại ở CN3-G1 (2026-09-20, branch `feat/cn3-g1-summary`) bằng script
   đã commit `scripts/probe-gemini-proxy.mjs` (chạy bằng node, đọc
   `PROBE_EMAIL`/`PROBE_PASSWORD` từ env — hai biến này chỉ sống trong shell
   lúc chạy, không commit; thiếu thì script dừng, cấm tự tạo user trong
   script): signin → SIGNIN_OK; POST kèm JWT → **401**
   `{"error":"JWT không hợp lệ hoặc đã hết hạn."}`; POST không auth →
   **401** gateway. Theo luật chọn: còn lại → NHÁNH KEY TRỰC TIẾP (xem
   DEVLOG cn3-g1 + REPORT-NOTES “Giới hạn đã biết”). Verify 0004 cùng phiên
   bằng `scripts/cn3-schema-verify.mjs`: VERIFY_PASS rows=0 (bảng + cột tồn
   tại, RLS cho đọc).
8. Deploy lại `gemini-proxy` bản fix CN3-G1b (làm tay, MỘT lần duy nhất —
   cấm `supabase functions deploy`, PAT 403):
   1. Mở file `supabase/functions/gemini-proxy/index.ts` trong repo (bản đã
      fix auth + model `gemini-3.5-flash`), copy TOÀN BỘ nội dung.
   2. Dashboard → Edge Functions → `gemini-proxy` → Via Editor (hoặc Edit) →
      dán đè toàn bộ → Deploy/Save and deploy.
   3. Kiểm tra `version` TĂNG (> 1 — lần trước redeploy không tăng version
      nên bundle cũ vẫn chạy). Secret `GEMINI_API_KEY` phải còn (nạp tay từ
      trước; thiếu thì probe trả 500 chứ không phải 401).
   4. Báo lại cho agent (kèm version mới) để probe lại: kỳ vọng POST kèm
      JWT → **200** body chứa `"OK"` + `"model":"gemini-3.5-flash"`; POST
      không auth → **401**. Đạt cả hai → chuyển nhánh proxy; không đạt →
      giữ key trực tiếp, không thử lần ba.
9. Kết quả CN3-G1b (2026-09-20): user deploy xong, `GET .../functions` →
   200, `gemini-proxy` ACTIVE **version 2** (đã tăng). Probe lại bằng user
   mới: SIGNIN_OK, REST 200, WITH_AUTH **401** y hệt, WITHOUT_AUTH **401**.
   Hết time-box → giữ nhánh key trực tiếp, không đào tiếp (chi tiết DEVLOG
   cn3-g1b). Quy trình dán tay Via Editor hoạt động (version tăng được);
   lần redeploy trước không tăng version là do thao tác chưa ăn, không phải
   lỗi nền tảng.

## 6. Cấu hình Supabase Auth (Dashboard, làm tay)

1. Authentication → Providers/Sign In → **Email**: Enabled ON, Allow new users
   to sign up ON, **Confirm email OFF** khi dev (bật lại khi demo).
2. Authentication → **Custom SMTP**: cắm Brevo (email mặc định của gói free
   không cho sửa template). Lấy host/user/key từ tài khoản Brevo, lưu ngoài repo.
3. Authentication → Email Templates → **Reset Password**: thay nội dung link
   bằng mã `{{ .Token }}` để email in OTP 6 số.
4. Authentication → Sign In/Providers → Email → **Email OTP length = 6**
   (khớp `otpSchema` `^\d{6}$` của app; server từng để 8 gây chặn oan, xem DEVLOG G4).
5. Rate limit email mặc định sau custom SMTP: **100 email/giờ**; app map lỗi
   `over_email_send_rate_limit` và khóa nút gửi lại 60s.

## 7. Kiểm tra bucket đã private (làm tay)

1. Storage → bucket `avatars`: loại **private**, giới hạn 2 MB,
   MIME `image/jpeg`, `image/png`, `image/webp`.
2. Storage → `avatars` → Policies: đủ 4 policy
   `avatars_{select,insert,update,delete}_own`, mỗi policy ràng buộc
   `(storage.foldername(name))[1] = auth.uid()::text`.
3. Table Editor: `profiles` và `study_notes` hiện **RLS enabled**.

## 7b. Đối chiếu bucket documents và keep-alive (làm tay, chỉ nhìn)

Sau khi mục 5b đã xanh (verify 14/14 `DAT`), phần này chỉ còn đối chiếu trực
quan trên Dashboard, không phải bước tạo:

1. Storage → bucket `documents`: loại **private**, giới hạn 10485760 byte,
   đúng 3 MIME whitelist.
2. Storage → `documents` → Policies: đủ 4 policy `documents_{select,insert,update,delete}_own`.
3. Table Editor: `subjects` và `documents` hiện **RLS enabled**.
4. GitHub repo → Actions → workflow **Supabase keep-alive**: hai secret
   `SUPABASE_URL` và `SUPABASE_ANON_KEY` đã được thêm ở
   Settings → Secrets and variables → Actions. Bấm **Run workflow** để kiểm
   tra tay; log phải hiện `Supabase Auth health http=200`.
5. Nhắc lại: free tier tự pause sau khoảng 7 ngày không hoạt động; trước buổi
   bảo vệ mở Dashboard kiểm tra project đang awake, resume nếu cần rồi chạy
   lại workflow keep-alive.

## 8. Chạy kiểm chứng tự động

```bash
npx tsc --noEmit
npm run lint
npm test               # 20 suites, 212/212 PASS — mock supabase, không gọi mạng
```

`npm test` bao gồm: schema/validate CN1, 64 test tầng dữ liệu documents
(guard ext/MIME/size, trần 100 tài liệu/30 môn, path UUID, tìm kiếm `ilike`
phân biệt dấu, đổi tên/xóa/gán môn, nhãn `extraction_status`), theme
(palette indigo CN2-13) và component dùng chung.

Kiểm chứng RLS trên remote (đọc credential từ `.env` + `.env.local`, tự tạo và
tự xóa user/object test, không in secret):

```bash
# FR-05: notes A/B — mong đợi RLS_PROOF: 7/7 check pass, exit 0
npx tsc --ignoreConfig --types node scripts/rls-proof.ts \
  --outDir /tmp/rlsproof-out --module nodenext --moduleResolution nodenext \
  --target es2021 --esModuleInterop --skipLibCheck --strict
NODE_PATH="$PWD/node_modules" node /tmp/rlsproof-out/rls-proof.js

# FR-04: Storage avatars — mong đợi STORAGE_RLS_PROOF: 5/5 check pass, exit 0
npx tsc --ignoreConfig --types node scripts/storage-rls-proof.ts \
  --outDir /tmp/storageproof-out --module nodenext --moduleResolution nodenext \
  --target es2021 --esModuleInterop --skipLibCheck --strict
NODE_PATH="$PWD/node_modules" node /tmp/storageproof-out/storage-rls-proof.js
```

Lưu ý: chưa có proof A/B cho `documents`/`subjects` (kịch bản có trong
`docs/TEST-CHECKLIST.md` mục CN2 nhưng chưa viết script); cách ly CN2 hiện
dựa vào verify 14/14 ở mục 5b và hai proof CN1 ở trên.

## 9. Chạy app trên Expo Go

```bash
npx expo start
```

Quét QR bằng Expo Go (cùng Wi-Fi). Sau khi đổi env phải restart (`r` hoặc chạy
lại lệnh). Test tay theo `docs/TEST-CHECKLIST.md`; tạo 2 tài khoản A/B không
dùng dữ liệu thật để demo cách ly.

## Nguồn tham chiếu

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router](https://docs.expo.dev/versions/latest/sdk/router/)
- [Supabase Auth React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)
