# Các bước bắt buộc làm tay trên Dashboard (G2)

G2 không dùng Supabase CLI (`link`/`db push` đã bỏ): schema được apply thủ
công qua SQL Editor. File này chỉ ghi việc CLI không làm được. Không ghi
secret, key hay password vào đây.

## 1. Lấy credential cho `.env.local` (làm một lần)

Mở Supabase Dashboard → chọn project `student-account-manager`:

1. Project Settings (biểu tượng bánh răng, menu trái) → **Data API** (hoặc
   Connect/API tùy bản Dashboard) → copy **Project URL** và
   **Publishable key** (dạng cũ gọi là anon key) vào `.env` theo
   `.env.example`. Không lấy `service_role` cho app.
2. Project Settings → **Access Tokens** → tạo token đọc project, lưu vào
   `SUPABASE_PROJECT_REF` là project ref (chuỗi trong URL, nằm giữa
   `https://` và `.supabase.co`), `SUPABASE_ACCESS_TOKEN` là token vừa tạo.
   Ghi chú: token phải thuộc tài khoản có role trên project, nếu CLI báo
   thiếu quyền thì tạo lại token ở đây.
3. Project Settings → **Database** → copy **database password** (mật khẩu
   đặt lúc tạo project, cất ngoài repo) vào `SUPABASE_DB_PASSWORD`.
4. Project Settings → **Data API → API Keys (legacy)** → copy
   **`service_role`** (chuỗi JWT `eyJ...`) vào `SUPABASE_SERVICE_ROLE_KEY`
   trong `.env.local`. Key này chỉ cho `scripts/rls-proof.ts`, tuyệt đối
   không đưa vào code app hay biến `EXPO_PUBLIC_*`.

## 2. Bật Email provider (FR-01/FR-02 và script proof đều cần)

1. Authentication (menu trái) → **Providers** (hoặc Sign In) → mục **Email**.
2. Bật **Enable Email provider = ON**.
3. Bật **Allow new users to sign up = ON**.
4. Tắt **Confirm email = OFF** khi dev (khi demo bật lại và đổi cờ
   `EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION` thành `true`).
5. Save. Trạng thái mục Email phải hiện **Enabled**.

## 3. Apply migration G2 bằng SQL Editor

1. Mở file `supabase/migrations/0001_account_manager.sql` trong repo, copy
   **toàn bộ** file.
2. Dashboard → **SQL Editor** → **New query** → dán toàn bộ → **Run**
   (hoặc Ctrl/Cmd+Enter).
3. Kết quả mong đợi: `Success. No rows returned`. Chạy lại lần 2 vẫn
   success (migration idempotent).
4. Không chạy từng đoạn rời rạc (thiếu policy/grant sẽ hở bảo mật).

## 4. Xác nhận nhanh sau khi apply

1. **Table Editor** → mở `profiles` và `study_notes` → mỗi bảng hiện huy
   hiệu/xác nhận **RLS enabled**.
2. **Table Editor → `study_notes` → Policies** (hoặc SQL Editor chạy câu
   trong `docs/RLS-PROOF.md` mục 1): đủ 4 policy
   `study_notes_{select,insert,update,delete}_own`.
3. **Storage** → bucket **`avatars`**: loại **private**, giới hạn 2 MB,
   MIME `image/jpeg`, `image/png`, `image/webp`; có 4 policy
   `avatars_{select,insert,update,delete}_own`.

## 5. Chạy kiểm chứng A/B

Không cần click tay: từ gốc repo chạy `scripts/rls-proof.ts` theo
`docs/RLS-PROOF.md` mục 7. Mong đợi `RLS_PROOF: 7/7 check pass`, exit 0.
Script tự tạo và tự xóa user test.
