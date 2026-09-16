# Mô hình dữ liệu và RLS

## Nguyên tắc

- `auth.users` do Supabase Auth quản lý; app không đọc trực tiếp.
- Mọi bảng public bật RLS và mọi policy ràng buộc bằng `auth.uid()`.
- UUID user lấy từ JWT, không nhận `user_id` tùy ý từ form.
- Migration duy nhất ban đầu: `supabase/migrations/0001_account_manager.sql`.

## Bảng `public.profiles`

| Cột | Kiểu/ràng buộc | Ý nghĩa |
|---|---|---|
| `id` | `uuid primary key references auth.users(id) on delete cascade` | Đồng thời là user id |
| `full_name` | `text not null default ''`, kiểm tra tối đa 100 ký tự | Họ tên hiển thị |
| `student_code` | `text not null unique`, trim khác rỗng, tối đa 30 ký tự | Mã sinh viên; duy nhất và phân biệt hoa/thường |
| `avatar_path` | `text null` | Path trong bucket, không phải URL |
| `created_at` | `timestamptz not null default now()` | Thời điểm tạo |
| `updated_at` | `timestamptz not null default now()` | Thời điểm sửa cuối |

RLS policies:

| Lệnh | `USING` | `WITH CHECK` |
|---|---|---|
| SELECT | `auth.uid() = id` | — |
| INSERT | — | `auth.uid() = id` |
| UPDATE | `auth.uid() = id` | `auth.uid() = id` |
| DELETE | Không cấp policy | Không cho client xóa profile |

## Bảng `public.study_notes`

| Cột | Kiểu/ràng buộc | Ý nghĩa |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | ID ghi chú |
| `user_id` | `uuid not null references auth.users(id) on delete cascade` | Chủ sở hữu |
| `title` | `text not null`, trim khác rỗng, tối đa 120 ký tự | Tiêu đề |
| `content` | `text not null default ''`, tối đa 5000 ký tự | Nội dung |
| `created_at` | `timestamptz not null default now()` | Thời điểm tạo |
| `updated_at` | `timestamptz not null default now()` | Thời điểm sửa cuối |

Index: `study_notes_user_updated_idx on study_notes(user_id, updated_at desc)`.

RLS policies cho cả bốn lệnh:

| Lệnh | `USING` | `WITH CHECK` |
|---|---|---|
| SELECT | `auth.uid() = user_id` | — |
| INSERT | — | `auth.uid() = user_id` |
| UPDATE | `auth.uid() = user_id` | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` | — |

`WITH CHECK` ở UPDATE ngăn đổi `user_id` để chuyển row sang tài khoản khác. Test RLS phải gọi Data API bằng session A/B, không chỉ xem UI.

## Trigger

1. `public.handle_new_user()` là `security definer set search_path = ''`; sau insert trên `auth.users`, insert `public.profiles(id, full_name, student_code)` từ `new.id` và metadata do form đăng ký gửi. `student_code` thiếu/trùng làm sign-up thất bại; dùng `on conflict (id) do nothing` chỉ để idempotent theo user id.
2. `public.set_updated_at()` gán `new.updated_at = now()` trước UPDATE; gắn riêng cho `profiles` và `study_notes`.
3. Không tạo trigger nghiệp vụ khác.

Quyền execute/search path trong migration phải tối thiểu; function trigger không nhận tham số từ client.

## Supabase Storage

- Bucket: `avatars`, **private**, giới hạn 2 MB, MIME đề xuất `image/jpeg`, `image/png`, `image/webp`.
- Object path cố định: `{auth.uid()}/avatar.{ext}`. Khi đổi phần mở rộng, xóa object cũ sau khi upload mới thành công.
- `profiles.avatar_path` lưu đúng path; UI tạo signed URL ngắn hạn khi hiển thị.

Policies trên `storage.objects` giới hạn `bucket_id = 'avatars'` và `(storage.foldername(name))[1] = auth.uid()::text`:

| Lệnh | Quyền |
|---|---|
| SELECT | Chỉ object trong thư mục user hiện tại |
| INSERT | Chỉ tạo trong thư mục user hiện tại |
| UPDATE | Chỉ object trong thư mục user hiện tại, `WITH CHECK` giữ cùng chủ |
| DELETE | Chỉ object trong thư mục user hiện tại |

Không tạo bucket public, không lưu avatar dạng base64 trong Postgres, không dùng service-role để vượt policy.
