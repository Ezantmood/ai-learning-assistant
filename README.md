# AI Learning Assistant

Hệ thống học tập Expo duy nhất của môn Lập trình di động, gồm 6 chức năng lớn
với 45 yêu cầu FR-01 → FR-45. Chức năng 1 (quản lý tài khoản, FR-01 → FR-05)
đã hoàn thành (`v1.2.0`): đăng ký, đăng nhập/đăng xuất, quên/đặt lại mật khẩu
bằng OTP 6 số qua email, cập nhật hồ sơ/avatar và CRUD `study_notes` tối
thiểu. Dữ liệu mỗi tài khoản được cách ly bằng Supabase Row Level Security.
5 chức năng còn lại (FR-06 → FR-45) chưa làm; màn hình tổng quan sau đăng nhập
liệt kê cả 6, thẻ chưa làm hiển thị "Sắp có" và bị vô hiệu hóa.

## Stack

Expo SDK 57, TypeScript strict, expo-router, Supabase Auth/Postgres/Storage,
supabase-js v2, AsyncStorage, React Hook Form, Zod, TanStack Query,
React Native Paper, expo-image-picker, expo-image-manipulator,
base64-arraybuffer. Chạy bằng Expo Go, không development build.

## FR coverage

| Chức năng | Dải FR | Nội dung | Trạng thái |
|---|---|---|---|
| 1. Quản lý tài khoản người dùng | FR-01 → FR-05 | Đăng ký/đăng nhập/OTP/hồ sơ/`study_notes` | Xong — unit test + `rls-proof` 7/7 + `storage-rls-proof` 5/5 |
| 2. Quản lý tài liệu học tập | FR-06 → FR-13 | — | Chưa làm |
| 3. AI tóm tắt tài liệu PDF | FR-14 → FR-22 | — | Chưa làm |
| 4. AI hỏi đáp dựa trên tài liệu | FR-23 → FR-30 | — | Chưa làm |
| 5. Quét hình ảnh đề bài bằng AI | FR-31 → FR-37 | — | Chưa làm |
| 6. AI gợi ý lời giải | FR-38 → FR-45 | — | Chưa làm |

Chi tiết file/hàm/test của FR-01 → FR-05 xem `docs/FR-TRACEABILITY.md`.

## Cách chạy

```bash
npm ci
cp .env.example .env   # điền URL + publishable key theo docs/SETUP.md
npx expo start         # quét QR bằng Expo Go
```

Dựng đầy đủ từ số 0 (SQL, Auth, Brevo SMTP, bucket private): `docs/SETUP.md`.

## Cách chạy test

```bash
npx tsc --noEmit
npm run lint
npm test               # 14 suites, 110/110 PASS — mock supabase, không gọi mạng
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
- Không offline-first: mất mạng thì báo lỗi + retry, form giữ dữ liệu để thử lại.
- Không social login, role/admin, realtime, push, E2E (out of scope theo `docs/SPEC.md`).
- Migration đã apply thì không sửa file cũ; quy ước path avatar timestamp chỉ ghi
  trong `docs/DATA-MODEL.md` và code.

## Tài liệu

- [Đặc tả và quyết định](docs/SPEC.md)
- [Kiến trúc](docs/ARCHITECTURE.md)
- [Mô hình dữ liệu/RLS](docs/DATA-MODEL.md)
- [Luồng UI](docs/ARCHITECTURE.md#luồng-màn-hình)
- [Backlog G1–G5](docs/TASKS.md)
- [Nhật ký phát triển](docs/DEVLOG.md)
- [Truy vết FR](docs/FR-TRACEABILITY.md)
- [Dựng môi trường](docs/SETUP.md)
- [Checklist test](docs/TEST-CHECKLIST.md)
- [Nguyên liệu báo cáo](docs/REPORT-NOTES.md)
- [Quy trình Git](AGENTS.md#quy-tắc-git-bắt-buộc)

Đọc `AGENTS.md` trước mỗi session để biết luật dự án và file cần đọc theo loại công việc.
