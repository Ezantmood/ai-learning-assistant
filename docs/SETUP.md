# Dựng dự án từ số 0 (hoàn chỉnh CN1; CN2 chỉ thêm mục 5b, 7b, 10)

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

## 5b. Apply DDL và RLS cho CN2 (SQL Editor, paste tay)

DDL tham chiếu nằm ở `docs/DATA-MODEL.md` (mục `subjects`, `documents`,
bucket `documents`); đó là văn bản tham chiếu, khi áp thì paste từng khối
lệnh vào SQL Editor theo thứ tự: bảng + constraints/index → RLS policies +
grants → trigger `updated_at` (tái dùng function có sẵn) → tạo bucket
`documents` ở Storage (private, 10 MB, whitelist 3 MIME) + 4 Storage policy.
Không dùng `supabase link` / `db push` vì access token `sbp_` không đủ quyền
trên project (lý do đã ghi ở DEVLOG G2, vẫn đúng tới nay).
Mong đợi `Success. No rows returned` cho mỗi khối.

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

## 7b. Kiểm tra bucket documents và keep-alive (làm tay)

1. Storage → bucket `documents`: loại **private**, giới hạn 10 MB, đúng 3 MIME
   whitelist (`application/pdf`, `...wordprocessingml.document`, `text/plain`).
2. Storage → `documents` → Policies: đủ 4 policy giới hạn
   `bucket_id = 'documents'` và `(storage.foldername(name))[1] = auth.uid()::text`.
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
npm test
```

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
