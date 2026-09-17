# Bằng chứng RLS cho FR-05 (2 tài khoản A/B)

Mục tiêu: chứng minh tài khoản A chỉ thao tác `study_notes` có
`user_id = auth.uid()` của A; note của B bị RLS chặn.
Nguyên tắc: test bằng **Data API với session thật của A/B**, không chỉ nhìn UI.
Không ghi email thật, mật khẩu hay token vào đây; chỉ ghi ID rút gọn
(8 ký tự đầu) và số dòng trả về.

## 0. Chuẩn bị

1. Chạy toàn bộ `supabase/migrations/0001_account_manager.sql` trong
   SQL Editor (Run một lần cả file). Chạy lại lần 2 phải báo thành công,
   không lỗi — migration này idempotent.
2. Có 2 tài khoản test A và B (đăng ký từ app để trigger
   `handle_new_user()` tự tạo `profiles`). Không dùng email thật.
3. Mỗi tài khoản đăng nhập app và tạo đúng 1 note:
   - A tạo note tiêu đề `Note cua A`.
   - B tạo note tiêu đề `Note cua B`.

## 1. Lấy ID để đối chiếu (SQL Editor, vai trò postgres)

```sql
select id, user_id, left(title, 20) as title
from public.study_notes
order by created_at;
```

Ghi lại (ví dụ): `NOTE_A = <uuid-a>`, `USER_A = <uuid-user-a>`,
`NOTE_B = <uuid-b>`, `USER_B = <uuid-user-b>`.
Bước này chạy quyền admin nên thấy cả 2 dòng — dùng để đối chiếu,
không phải bằng chứng cách ly.

Kiểm tra policy đã có:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'study_notes'
order by cmd;
```

Mong đợi 4 dòng: `study_notes_select_own/SELECT`,
`study_notes_insert_own/INSERT`, `study_notes_update_own/UPDATE`,
`study_notes_delete_own/DELETE`.

## 2. SELECT chéo: A không đọc được note của B

Đăng nhập app bằng **tài khoản A**, mở danh sách notes: chỉ thấy
`Note cua A`, không thấy `Note cua B`.

Gọi Data API bằng session A (đoạn này nằm trong `listNotes` ở G3,
ở đây viết tường minh để test):

```ts
const { data, error } = await supabase
  .from('study_notes')
  .select('id, title')
  .eq('id', NOTE_B);
```

Kết quả mong đợi: `error = null`, `data = []` — **trả về 0 dòng,
không báo lỗi permission**. RLS loại row của B ngay trong Postgres
qua `USING (auth.uid() = user_id)` nên client chỉ nhận tập rỗng,
giống như row không tồn tại. Đây là điểm giáo viên hay hỏi:
RLS SELECT chặn bằng cách lọc, không ném lỗi.

Lặp lại đối xứng: đăng nhập B, select `NOTE_A` → `data = []`.

## 3. INSERT chéo: A không thể tạo note cho B

Vẫn session A:

```ts
const { data, error } = await supabase
  .from('study_notes')
  .insert({ user_id: USER_B, title: 'Chen leo', content: '...' })
  .select();
```

Mong đợi: `data` rỗng và `error` báo vi phạm RLS (`42501` /
`new row violates row-level security policy for table "study_notes"`).
Lý do: policy INSERT chỉ có `WITH CHECK (auth.uid() = user_id)`,
`user_id = USER_B` khác JWT của A nên bị từ chối trước khi ghi.

## 4. UPDATE chéo: A không sửa được note của B

Vẫn session A, hai phép thử:

```ts
// 4a. Sửa trực tiếp note của B.
const r1 = await supabase
  .from('study_notes')
  .update({ title: 'Sua trom' })
  .eq('id', NOTE_B)
  .select();
```

Mong đợi: `r1.data = []`, **0 dòng bị sửa**. `USING` loại row B
nên không có row nào lọt vào UPDATE.

```ts
// 4b. Đổi chủ note của A sang B (chiếm đoạt ngược).
const r2 = await supabase
  .from('study_notes')
  .update({ user_id: USER_B })
  .eq('id', NOTE_A)
  .select();
```

Mong đợi: `r2.data = []`, 0 dòng bị sửa. Dù `USING` cho qua row A,
`WITH CHECK (auth.uid() = user_id)` chặn giá trị mới `USER_B`.

## 5. DELETE chéo: A không xóa được note của B

Vẫn session A:

```ts
const r = await supabase
  .from('study_notes')
  .delete()
  .eq('id', NOTE_B)
  .select();
```

Mong đợi: `r.data = []`, 0 dòng bị xóa. Sau đó đăng nhập B kiểm tra:
note của B vẫn còn nguyên.

## 6. Đối xứng B → A và kết luận

Lặp lại mục 2–5 với session B nhắm vào `NOTE_A`/`USER_A`: kết quả
đối xứng (SELECT 0 dòng; INSERT/UPDATE/DELETE chéo không đổi dữ liệu).

Ghi kết quả vào `docs/TEST-CHECKLIST.md` mục FR-05 theo mẫu:
`YYYY-MM-DD | Expo Go Android/iOS | A=<8 ký tự>/B=<8 ký tự> | đạt`.
Với FR-05 chỉ chuyển `FR-TRACEABILITY.md` sang `đạt` khi cả 4 lệnh
SELECT/INSERT/UPDATE/DELETE đều có bằng chứng A/B hai chiều.

## 7. Kết quả chạy thật bằng `scripts/rls-proof.ts`

Ngày chạy: 2026-09-17. Script tự tạo 2 user test qua admin API (mỗi user
1 `study_notes`), đăng nhập session A bằng anon key rồi thử đòn chéo,
cuối cùng xóa cả 2 user. ID dưới đây đã rút gọn 8 ký tự; không ghi email,
mật khẩu hay token.

Tái hiện (từ gốc repo, đã có `.env` + `.env.local`):

```bash
npx tsc --ignoreConfig --types node scripts/rls-proof.ts \
  --outDir /tmp/rlsproof-out --module nodenext --moduleResolution nodenext \
  --target es2021 --esModuleInterop --skipLibCheck --strict
set -a && source .env && source .env.local && set +a
NODE_PATH="$PWD/node_modules" node /tmp/rlsproof-out/rls-proof.js
```

Log nguyên văn (exit code 0):

```text
SETUP 2 user test: A=3d821506 B=84cae6ef
PASS trigger tạo profile cho A — profiles của A: 1 dòng (mong đợi 1)
SETUP 2 note: noteA=20c3ec95 noteB=7097ef53
PASS A đọc note của chính mình — list A: 1 dòng (mong đợi 1)
PASS A SELECT note của B — trả về 0 dòng, error null (mong đợi 0 dòng)
PASS A UPDATE note của B — 0 dòng bị sửa (mong đợi 0)
PASS A DELETE note của B — 0 dòng bị xóa (mong đợi 0)
PASS A INSERT note với user_id = B — bị chặn: new row violates row-level security policy for table "study_notes"
PASS note của B còn nguyên sau các đòn chéo — noteB: 1 dòng, tiêu đề nguyên vẹn
CLEANUP user 3d821506: đã xóa
CLEANUP user 84cae6ef: đã xóa
RLS_PROOF: 7/7 check pass
```

Hai lần chạy trước đó FAIL cũng được giữ làm bằng chứng chẩn đoán (user
test đều đã dọn): lần 1 thiếu GRANT bảng (`permission denied for table
study_notes`, đã fix trong migration); lần 2 thiếu trigger do schema chưa
apply (`profiles của A: 0 dòng`); lần 3 thiếu toggle Email provider
(`Đăng nhập A thất bại: Email logins are disabled`, đã bật theo
`docs/MANUAL-STEPS.md`).
