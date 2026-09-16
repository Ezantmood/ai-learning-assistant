# Student Account Manager

Bài tập môn Lập trình di động: ứng dụng Expo quản lý tài khoản sinh viên, gồm đăng ký, đăng nhập/đăng xuất, quên/đặt lại mật khẩu, cập nhật hồ sơ/avatar và CRUD `study_notes` tối thiểu. Dữ liệu mỗi tài khoản được cách ly bằng Supabase Row Level Security.

## Stack

Expo SDK 57, TypeScript strict, expo-router, Supabase Auth/Postgres/Storage, supabase-js v2, AsyncStorage, React Hook Form, Zod, TanStack Query và React Native Paper.

## Trạng thái

Hiện chỉ có tài liệu và nền Git; chưa có code ứng dụng, package hay cấu hình Supabase. Triển khai theo `docs/TASKS.md` sau khi các quyết định trong `docs/SPEC.md` được chốt.

## Lệnh dự kiến sau G1

```bash
npx expo start
npx tsc --noEmit
npm run lint
```

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
