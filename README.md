# Student Account Manager

Bài tập môn Lập trình di động: ứng dụng Expo quản lý tài khoản sinh viên, gồm đăng ký, đăng nhập/đăng xuất, quên/đặt lại mật khẩu, cập nhật hồ sơ/avatar và CRUD `study_notes` tối thiểu. Dữ liệu mỗi tài khoản được cách ly bằng Supabase Row Level Security.

## Stack

Expo SDK 57, TypeScript strict, expo-router, Supabase Auth/Postgres/Storage, supabase-js v2, AsyncStorage, React Hook Form, Zod, TanStack Query và React Native Paper.

## Trạng thái

G1 đã hoàn thành trên branch `feat/g1-setup`: app Expo Go mở được, stack/providers/env/Supabase client và auth guard đã có. Chưa có form nghiệp vụ, database hay RLS; các phần đó bắt đầu từ G2/G3.

## Chạy sau G1

```bash
npm ci
cp .env.example .env
npx expo start
npx tsc --noEmit
npm run lint
```

Điền ba biến trong `.env` theo `docs/SETUP.md`; trên điện thoại mở Expo Go và quét QR từ `npx expo start`.

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
