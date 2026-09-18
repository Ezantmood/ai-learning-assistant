# Student Account Manager

Bài 1 môn Lập trình di động: ứng dụng Expo quản lý tài khoản sinh viên —
đăng ký, đăng nhập/đăng xuất, quên/đặt lại mật khẩu bằng OTP 6 số qua email,
cập nhật hồ sơ/avatar và CRUD `study_notes` tối thiểu. Dữ liệu mỗi tài khoản
được cách ly bằng Supabase Row Level Security. Bản `v1.0.0` (G5) hoàn thành
cả 5 FR.

## Stack

Expo SDK 57, TypeScript strict, expo-router, Supabase Auth/Postgres/Storage,
supabase-js v2, AsyncStorage, React Hook Form, Zod, TanStack Query,
React Native Paper, expo-image-picker, expo-image-manipulator,
base64-arraybuffer. Chạy bằng Expo Go, không development build.

## FR coverage

| FR | Nội dung | Chứng minh |
|---|---|---|
| FR-01 | Đăng ký email/mật khẩu/mã SV | Unit test schema/errors + test tay |
| FR-02 | Đăng nhập/đăng xuất/session | Unit test + test tay restart/logout |
| FR-03 | Quên/đặt lại mật khẩu OTP 6 số | Unit test 51 case + test tay Brevo |
| FR-04 | Hồ sơ + avatar | Unit test 33 case + `storage-rls-proof` 5/5 |
| FR-05 | study_notes cách ly A/B | `rls-proof` 7/7 + test tay 2 máy |

Chi tiết file/hàm/test xem `docs/FR-TRACEABILITY.md`.

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
npm test               # G5: 8 suites, 84/84 PASS — mock supabase, không gọi mạng
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

- Expo Go + Supabase free tier: project tự pause khi lâu không dùng (resume trên Dashboard).
- Không offline-first: mất mạng thì báo lỗi + retry, form giữ dữ liệu để thử lại.
- Không social login, role/admin, realtime, push, E2E (out of scope theo `docs/SPEC.md`).
- Migration đã apply thì không sửa file cũ; quy ước path avatar timestamp chỉ ghi
  trong `docs/DATA-MODEL.md` và code.

## Tài liệu

- [Đặc tả và quyết định](docs/SPEC.md)
- [Kiến trúc](docs/ARCHITECTURE.md)
- [Mô hình dữ liệu/RLS](docs/DATA-MODEL.md)
- [Luồng UI](docs/UI-FLOW.md)
- [Backlog G1–G5](docs/TASKS.md)
- [Nhật ký phát triển](docs/DEVLOG.md)
- [Truy vết FR](docs/FR-TRACEABILITY.md)
- [Dựng môi trường](docs/SETUP.md)
- [Checklist test](docs/TEST-CHECKLIST.md)
- [Nguyên liệu báo cáo](docs/REPORT-NOTES.md)
- [Quy trình Git](docs/GIT-WORKFLOW.md)

Đọc `AGENTS.md` trước mỗi session để biết luật dự án và file cần đọc theo loại công việc.
