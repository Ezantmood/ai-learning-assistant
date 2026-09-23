# AI Learning Assistant

Hệ thống học tập Expo duy nhất của môn Lập trình di động, gồm 6 chức năng lớn
với 45 yêu cầu FR-01 → FR-45, tất cả đã merge vào `main` (code + unit +
verify schema + kiểm tay theo TEST-CHECKLIST).
Dữ liệu mỗi tài khoản được cách ly bằng Supabase Row Level Security.

## Stack

Expo SDK 57, TypeScript strict, expo-router, Supabase Auth/Postgres/Storage,
supabase-js v2, AsyncStorage, React Hook Form, Zod, TanStack Query,
React Native Paper, expo-image-picker, expo-image-manipulator,
expo-document-picker, expo-file-system, expo-crypto,
base64-arraybuffer. Chạy bằng Expo Go, không development build.

## FR coverage

| Chức năng | Dải FR | Nội dung | Trạng thái |
|---|---|---|---|
| 1. Quản lý tài khoản người dùng | FR-01 → FR-05 | Đăng ký/đăng nhập/OTP/hồ sơ/`study_notes` | Xong — unit test + `rls-proof` 7/7 + `storage-rls-proof` 5/5 |
| 2. Quản lý tài liệu học tập | FR-06 → FR-13 | Tải lên PDF/DOCX/TXT, danh sách, chi tiết, đổi tên, xóa, môn học, hạ tầng trích xuất | Xong — code + unit + verify schema 14/14 |
| 3. AI tóm tắt tài liệu PDF | FR-14 → FR-22 | Tóm tắt bằng Gemini trong màn chi tiết tài liệu | Xong — code + unit + kiểm tay Expo Go với PDF thật |
| 4. AI hỏi đáp dựa trên tài liệu | FR-23 → FR-30 | Hỏi đáp trên toàn văn trích xuất trong màn chi tiết | Xong — code + unit + kiểm tay Expo Go với PDF thật |
| 5. Quét hình ảnh đề bài bằng AI | FR-31 → FR-37 | Chọn/chụp ảnh, OCR Gemini, lưu kết quả | Xong — code + unit + proof RLS 8/8 + nghiệm thu quét thật trên Expo Go |
| 6. AI gợi ý lời giải | FR-38 → FR-45 | Gợi ý lời giải từng bước trong màn chi tiết | Xong — code + unit + proof RLS 11/11 + verify schema |

Chi tiết file/hàm/test của FR-01 → FR-45 xem `docs/FR-TRACEABILITY.md`.

## Yêu cầu môi trường

- Node.js tối thiểu `22.13.x` (theo Expo SDK 57); Git.
- Điện thoại cài đúng bản Expo Go tương thích SDK 57:
  iOS tải tại `sign.expo.dev`, Android tải tại `expo.dev/go`.
  Bản Expo Go trên App Store hiện dừng ở SDK 54 nên không dùng được.
- Một project Supabase (free tier tự pause sau ~7 ngày không dùng —
  trước buổi demo mở Dashboard resume).
- Không tạo development build, không sinh `ios/`/`android/`.

## Cách chạy

```bash
npm ci
cp .env.example .env   # điền theo docs/SETUP.md mục 4
npx expo start -c      # quét QR mới bằng đúng bản Expo Go SDK 57
```

Biến môi trường app cần có (CHỈ TÊN, không giá trị — xem `.env.example`):
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION`, `EXPO_PUBLIC_GEMINI_API_KEY`
(key Gemini cắm ở `.env.local`, không commit).
Script proof đọc thêm `.env.local`
(`SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL`,
`SUPABASE_SERVICE_ROLE_KEY`) — không commit hai file này.

Bẫy wifi trường/công cộng bật client isolation: Expo Go không thấy dev
server dù "cùng mạng" (quét QR không vào, nhập URL tay cũng không vào).
Cách đi vòng: điện thoại phát hotspot, Mac nối vào hotspot đó, rồi
`npx expo start -c` và quét QR mới. KHÔNG dùng `--tunnel`.

Dựng đầy đủ từ số 0 (SQL, Auth, Brevo SMTP, bucket private): `docs/SETUP.md`.

## Cách chạy test

```bash
npx tsc --noEmit
npm run lint
npm test               # 39 suites, 318/318 PASS — mock supabase, không gọi mạng
npm run check:functions
```

## Cách chạy rls-proof (cần `.env` + `.env.local`, tự dọn user test)

```bash
# FR-05 notes: mong đợi RLS_PROOF: 7/7 check pass
npx tsc --ignoreConfig --types node scripts/rls-proof.ts \
  --outDir /tmp/rlsproof-out --module nodenext --moduleResolution nodenext \
  --target es2021 --esModuleInterop --skipLibCheck --strict
NODE_PATH="$PWD/node_modules" node /tmp/rlsproof-out/rls-proof.js

# FR-04 Storage avatars: mong đợi STORAGE_RLS_PROOF: 5/5 check pass
npx tsc --ignoreConfig --types node scripts/storage-rls-proof.ts \
  --outDir /tmp/storageproof-out --module nodenext --moduleResolution nodenext \
  --target es2021 --esModuleInterop --skipLibCheck --strict
NODE_PATH="$PWD/node_modules" node /tmp/storageproof-out/storage-rls-proof.js
```

## Giới hạn đã biết

- Supabase free tier tự pause project sau ~7 ngày không hoạt động.
  Workflow `.github/workflows/keep-alive.yml` ping Auth health mỗi 2 ngày để
  giữ project thức. Người dùng phải tự làm đúng 2 bước (agent không làm thay
  được vì cần quyền repo):
  1. Vào GitHub repo → Settings → Secrets and variables → Actions → New
     repository secret, tạo secret `SUPABASE_URL` với giá trị là Project URL
     (Supabase Dashboard → Project Settings → Data API).
  2. Tạo tiếp secret `SUPABASE_ANON_KEY` với giá trị anon/public key.
  Xong có thể bấm Run workflow tay (workflow_dispatch) để kiểm tra ngay.
- CN2 còn nợ test tay trên Expo Go (22 case trong TEST-CHECKLIST) và proof
  A/B cho `documents`/`subjects` (chỉ mới verify schema 14/14 + kế thừa proof CN1).
- Tìm kiếm tài liệu phân biệt dấu tiếng Việt (`ilike`); không có viewer trong
  app (mở tệp bằng app ngoài); DOCX tải/xem/xóa được nhưng AI không đọc
  (`unsupported`).
- Không offline-first: mất mạng thì báo lỗi + retry, form giữ dữ liệu để thử lại.
- Không social login, role/admin, realtime, push, E2E (out of scope theo `docs/SPEC.md`).
- Migration đã apply thì không sửa file cũ; quy ước path avatar timestamp chỉ ghi
  trong `docs/DATA-MODEL.md` và code.

## Tài liệu

- [Đặc tả và quyết định](docs/SPEC.md)
- [Kiến trúc + luồng màn hình](docs/ARCHITECTURE.md)
- [Mô hình dữ liệu/RLS](docs/DATA-MODEL.md)
- [Hệ thống thiết kế](docs/DESIGN-SYSTEM.md)
- [Backlog CN1 + CN2](docs/TASKS.md)
- [Nhật ký phát triển](docs/DEVLOG.md)
- [Truy vết FR](docs/FR-TRACEABILITY.md)
- [Dựng môi trường](docs/SETUP.md)
- [Checklist test](docs/TEST-CHECKLIST.md)
- [Nguyên liệu báo cáo](docs/REPORT-NOTES.md)
- [Quy tắc Git](AGENTS.md#quy-tắc-git-bắt-buộc)

Đọc `AGENTS.md` trước mỗi session để biết luật dự án và file cần đọc theo loại công việc.
