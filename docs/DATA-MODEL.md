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

Validate đang enforce (đúng SPEC/G3, quyết định G5): `full_name` chỉ giới hạn
độ dài (tối đa 100 ký tự, cho phép rỗng); `student_code` bắt buộc, trim khác
rỗng, tối đa 30 ký tự, **duy nhất và phân biệt hoa/thường** (unique constraint
`profiles_student_code_unique`, `SV001` và `sv001` cùng tồn tại). **Không
enforce regex** ở DB lẫn client (`profileSchema` = `signUpSchema` G3:
không pattern); mã trùng đúng hoa/thường do Postgres báo 23505 và app map
sang tiếng Việt, không lộ raw error.

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

`WITH CHECK` ở UPDATE ngăn đổi `user_id` để chuyển row sang tài khoản khác. Test RLS phải gọi Data API bằng session A/B, không chỉ xem UI. Kịch bản chi tiết xem `docs/RLS-PROOF.md`.

## Vì sao chỉ lọc ở client là không an toàn

`.eq('user_id', uid)` chỉ là câu lọc do app tự thêm vào request. Nó chạy
trên máy người dùng: ai cũng có thể mở devtools, sửa JS, xóa dòng `.eq`,
thay `uid` thành id người khác, hoặc gọi thẳng PostgREST bằng publishable
key mà không qua app. Server lúc đó vẫn trả dữ liệu vì không có ai kiểm tra
lại — filter client chỉ giúp UX gọn, không phải bảo mật.

RLS chạy trong Postgres, áp dụng cho **mọi** request qua Data API. Postgres
lấy `auth.uid()` từ JWT đã được Supabase ký và xác thực chữ ký, client không
tự bịa được. Mỗi policy `USING (auth.uid() = user_id)` / `WITH CHECK (...)`
được kiểm tra trước khi đọc/ghi row. Kể cả khi attacker bỏ `.eq` hay gửi
`user_id` của nạn nhân, database vẫn loại hoặc từ chối row.

Hệ quả thực tế: SELECT chéo trả về **0 dòng chứ không ném lỗi permission**,
vì `USING` chỉ lọc row (xem `docs/RLS-PROOF.md` mục 2); còn INSERT sai chủ
hoặc UPDATE đổi `user_id` sang người khác thì bị `WITH CHECK` từ chối.
Trả lời trước giáo viên có thể nói gọn: “Client do người dùng kiểm soát nên
filter bỏ được; RLS chạy ở database, đối chiếu JWT qua `auth.uid()` cho mọi
request nên mới là ranh giới bảo mật. Publishable key nằm ở client được, an
toàn dữ liệu phụ thuộc RLS.”

## Trigger

1. `public.handle_new_user()` là `security definer set search_path = ''`; sau insert trên `auth.users`, insert `public.profiles(id, full_name, student_code)` từ `new.id` và metadata do form đăng ký gửi. `student_code` thiếu/trùng làm sign-up thất bại; dùng `on conflict (id) do nothing` chỉ để idempotent theo user id.
2. `public.set_updated_at()` gán `new.updated_at = now()` trước UPDATE; gắn riêng cho `profiles` và `study_notes`.
3. Không tạo trigger nghiệp vụ khác.

Quyền execute/search path trong migration phải tối thiểu; function trigger không nhận tham số từ client.

## Supabase Storage

- Bucket: `avatars`, **private**, giới hạn 2 MB, MIME đề xuất `image/jpeg`, `image/png`, `image/webp`.
- Object path timestamp (quyết định chủ dự án G5): `{auth.uid()}/avatar_<timestamp-ms>.jpg`.
  Mỗi lần đổi avatar tạo object mới; sau khi update `profiles.avatar_path`
  thành công thì xóa object cũ best-effort (lỗi xóa không fail luồng chính).
  Migration G2 đã apply vẫn ghi chú thích `avatar.{ext}` — giữ nguyên file
  migration đã apply, quy ước mới chỉ ghi ở đây và code (`buildAvatarPath`).
- `profiles.avatar_path` lưu đúng path; UI tạo signed URL ngắn hạn (TTL 3600s,
  cache 55 phút) khi hiển thị.

Policies trên `storage.objects` giới hạn `bucket_id = 'avatars'` và `(storage.foldername(name))[1] = auth.uid()::text`:

| Lệnh | Quyền |
|---|---|
| SELECT | Chỉ object trong thư mục user hiện tại |
| INSERT | Chỉ tạo trong thư mục user hiện tại |
| UPDATE | Chỉ object trong thư mục user hiện tại, `WITH CHECK` giữ cùng chủ |
| DELETE | Chỉ object trong thư mục user hiện tại |

Không tạo bucket public, không lưu avatar dạng base64 trong Postgres, không dùng service-role để vượt policy.

## Bảng `public.subjects` (CN2, FR-12)

> DDL chính thức chạy được: `supabase/migrations/0002_cn2_documents.sql`.
> Khi hai bên lệch nhau thì file migration là nguồn sự thật, tài liệu phải sửa theo.

| Cột | Kiểu/ràng buộc | Ý nghĩa |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | ID môn học |
| `user_id` | `uuid not null references auth.users(id) on delete cascade` | Chủ sở hữu |
| `name` | `text not null`, `check (char_length(name) between 1 and 60)`, `unique (user_id, name)` | Tên môn học; mỗi user không trùng tên |
| `created_at` | `timestamptz not null default now()` | Thời điểm tạo |
| `updated_at` | `timestamptz not null default now()` | Thời điểm sửa cuối |

Index: `subjects_user_idx on subjects(user_id)`.

RLS policies cho cả bốn lệnh (`auth.uid() = user_id` cho `USING`/`WITH CHECK`
tương tự `study_notes`); grants `authenticated` CRUD như CN1.

Xóa môn học đang có tài liệu: `documents.subject_id` dùng
`references subjects(id) on delete set null` — tài liệu rơi về “Chưa phân
loại”, không bị xóa theo. Lý do: môn học là nhãn tổ chức, xóa nhãn không được
phép kéo theo mất dữ liệu gốc của user.

## Bảng `public.documents` (CN2, FR-06 → FR-13)

> DDL chính thức chạy được: `supabase/migrations/0002_cn2_documents.sql`.
> Khi hai bên lệch nhau thì file migration là nguồn sự thật, tài liệu phải sửa theo.

| Cột | Kiểu/ràng buộc | Ý nghĩa |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | ID tài liệu |
| `user_id` | `uuid not null references auth.users(id) on delete cascade` | Chủ sở hữu |
| `subject_id` | `uuid null references subjects(id) on delete set null` | Môn học; NULL = “Chưa phân loại” |
| `display_name` | `text not null`, `check (char_length(display_name) between 1 and 120)` | Tên hiển thị (tên gốc đã chuẩn hóa); FR-10 chỉ đổi cột này, không đổi object |
| `storage_path` | `text not null unique` | Đường dẫn object `{user_id}/{uuid}.{ext}`; bất biến sau khi tạo (FR-10 không đổi) |
| `file_ext` | `text not null`, `check (file_ext in ('pdf', 'docx', 'txt'))` | Phần mở rộng đã lowercase (FR-07 whitelist) |
| `mime_type` | `text not null` | MIME đã đối chiếu với `file_ext` ở client |
| `file_size` | `bigint not null`, `check (file_size > 0 and file_size <= 10485760)` | Byte; tối đa 10 MB |
| `extracted_text` | `text null` | Nội dung trích cho AI; NULL cho tới khi CN3 đổ vào |
| `extraction_status` | `text not null default 'pending'`, `check (extraction_status in ('pending', 'processing', 'done', 'failed', 'unsupported'))` | Trạng thái trích xuất (xem ánh xạ tiếng Việt bên dưới) |
| `created_at` | `timestamptz not null default now()` | Ngày tải lên (FR-09) |
| `updated_at` | `timestamptz not null default now()` | Thời điểm sửa cuối |

Index:

- `documents_user_created_idx on documents(user_id, created_at desc)` — phục vụ FR-08 liệt kê theo user, mới nhất trước.
- `documents_subject_idx on documents(subject_id)` — phục vụ lọc theo môn học (FR-12).

`extraction_status` ánh xạ UI tiếng Việt: `pending` → “Chưa xử lý”,
`processing` → “Đang xử lý”, `done` → “Thành công”, `failed` → “Thất bại”,
`unsupported` → “Không hỗ trợ”. PDF/TXT mới tải lên nhận `pending`;
DOCX nhận `unsupported` ngay khi upload (giới hạn có chủ đích, xem SPEC).
CN2 chỉ làm hạ tầng hai cột này; CN3 gọi AI trích nội dung rồi đổ vào —
FR-13 tách đôi, không phải bỏ sót.

RLS policies cho cả bốn lệnh (`USING`/`WITH CHECK` ràng buộc
`auth.uid() = user_id`, `WITH CHECK` ở UPDATE ngăn đổi `user_id`);
grants `authenticated` CRUD như CN1. Policy DELETE cho phép FR-11 xóa thẳng;
thứ tự xóa storage-trước-DB-sau xem `docs/ARCHITECTURE.md`.
Trigger `updated_at` tái dùng
`public.set_updated_at()` có sẵn, không tạo function mới.

## Supabase Storage — bucket `documents` (CN2)

> DDL chính thức chạy được: `supabase/migrations/0002_cn2_documents.sql`
> (mục 6, `on conflict do update` nên bucket tạo tay trước vẫn đúng cấu hình).
> Khi hai bên lệch nhau thì file migration là nguồn sự thật, tài liệu phải sửa theo.

- Bucket: `documents`, **private**, giới hạn 10 MB, whitelist MIME
  `application/pdf`,
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
  `text/plain`.
- Quy ước đường dẫn object: `{user_id}/{uuid}.{ext}` (`uuid` sinh ở client
  bằng `Crypto.randomUUID()` của `expo-crypto` — cấm `crypto.randomUUID()`
  toàn cục vì Hermes trên Expo Go không đảm bảo có, thiếu thì nổ đúng lúc
  bấm upload chứ không lỗi lúc build).
  DB chỉ lưu đường dẫn này ở `documents.storage_path`, không lưu URL.
- Tên file trên storage là UUID, không dùng tên gốc (tên gốc có dấu tiếng
  Việt, khoảng trắng, ký tự lạ và có thể trùng). Tên gốc đã chuẩn hóa lưu ở
  `documents.display_name` làm nhãn.
- Xem/tải bằng signed URL TTL 3600s, cache qua TanStack Query (giống avatar CN1).

Policies trên `storage.objects` giới hạn `bucket_id = 'documents'` và
`(storage.foldername(name))[1] = auth.uid()::text`:

| Lệnh | Quyền |
|---|---|
| SELECT | Chỉ object trong thư mục user hiện tại |
| INSERT | Chỉ tạo trong thư mục user hiện tại (`WITH CHECK` giữ cùng chủ) |
| UPDATE | Chỉ object trong thư mục user hiện tại, `WITH CHECK` giữ cùng chủ |
| DELETE | Chỉ object trong thư mục user hiện tại |

Không tạo bucket public, không lưu nội dung tệp dạng base64 trong Postgres,
không dùng service-role để vượt policy.

## Bảng `public.document_summaries` (CN3, FR-14 → FR-22)

> DDL chính thức chạy được: `supabase/migrations/0004_cn3_summaries.sql`.
> Khi hai bên lệch nhau thì file migration là nguồn sự thật, tài liệu phải sửa theo.
> (File `0003` không tồn tại: CN2 đã xác nhận không cần bản vá, xem DEVLOG.)

Quyết định CN3-SCHEMA: bảng riêng thay vì thêm cột vào `documents`. Lý do:
tách vòng đời tóm tắt (tóm tắt lại chỉ UPDATE 1 row), không phình `documents`
(`extracted_text` giữ cho CN4 hỏi đáp), `UNIQUE(document_id)` đảm bảo 1-1,
RLS độc lập theo `user_id`, xóa document cascade xóa summary theo.

| Cột | Kiểu/ràng buộc | Ý nghĩa |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | ID bản tóm tắt |
| `document_id` | `uuid not null unique`, FK về `documents(id) on delete cascade` (`document_summaries_document_id_fkey`, `document_summaries_document_unique`) | Tài liệu được tóm tắt; UNIQUE = mỗi tài liệu tối đa một bản đang dùng, tóm tắt lại là ghi đè |
| `user_id` | `uuid not null references auth.users(id) on delete cascade` | Chủ sở hữu; denormalized từ `documents.user_id` để policy RLS viết trực tiếp `auth.uid() = user_id`, không join |
| `summary_text` | `text not null`, `check (char_length(summary_text) between 1 and 20000)` (`document_summaries_summary_rules`) | Bản tóm tắt tiếng Việt |
| `model` | `text not null default 'gemini-2.5-flash'`, `check (char_length(model) between 1 and 100)` (`document_summaries_model_rules`) | Model đã sinh bản này; để sau này đổi model không lẫn |
| `created_at` | `timestamptz not null default now()` | Lần tóm tắt đầu |
| `updated_at` | `timestamptz not null default now()` | Lần ghi đè cuối (trigger `set_updated_at()` tái dùng, không tạo function mới) |

Index: `document_summaries_user_idx on document_summaries(user_id)`; tra theo
document dùng unique index có sẵn của `document_summaries_document_unique`.

RLS policies cho cả bốn lệnh (`USING`/`WITH CHECK` ràng buộc
`auth.uid() = user_id`, `WITH CHECK` ở UPDATE ngăn đổi `user_id`);
grants `authenticated` CRUD, `service_role` full, `revoke anon` như CN1/CN2.
An toàn khi `document_id` bị tráo: row summary mang `user_id` của chủ tài liệu
(do chủ tạo, `WITH CHECK` chặn ghi hộ), nên SELECT/UPDATE/DELETE chéo vẫn bị
`USING` chặn dù attacker đoán đúng `document_id`.

Xóa tài liệu (FR-11) không cần bước xóa summary riêng: FK CASCADE dọn kèm.
Xóa user xóa cả hai bảng theo dây chuyền `auth.users → documents →
document_summaries` và `auth.users → document_summaries`.

## Máy trạng thái `extraction_status` trong CN3 (FR-19, FR-20)

```
pending → processing → done
             └───────→ failed →(user bấm thử lại)→ processing
unsupported (DOCX, trạng thái cuối, CN3 không chạm)
```

- Ai đặt, lúc nào: app (client) đặt `pending → processing` bằng UPDATE
  `documents` ngay trước khi gọi Gemini; `processing → done` sau khi lưu xong
  row `document_summaries`; `processing → failed` khi bất kỳ bước nào lỗi
  (kèm lỗi đã chuẩn hóa, không lộ raw). Không có trigger/Edge nào đặt hộ.
- Retry: chỉ khi `failed`, chỉ do user bấm “Thử lại” (không auto-retry để khỏi
  đốt quota free; lỗi 429/quota báo rõ và cũng không retry).
- App bị kill giữa chừng (`processing` treo): không có cron server nên client
  tự thu hồi — khi mở màn chi tiết, nếu `extraction_status = 'processing'` mà
  `updated_at` quá 15 phút (hằng số app) thì coi như `failed` (UPDATE về
  `failed`) rồi cho thử lại. Mốc 15 phút dựa trên trigger `updated_at` có sẵn,
  không thêm cột.
