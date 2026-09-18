# Kiến trúc

## Mục tiêu thiết kế

Kiến trúc theo feature, ít tầng và đủ rõ để sinh viên giải thích. App chạy bằng Expo Go, không dùng development build. `app/` chỉ điều phối route/UI; mọi lời gọi Supabase nằm trong `src/features/*/api.ts`. React Query quản lý server state, React Hook Form + Zod quản lý form, RLS là ranh giới bảo mật cuối cùng.

## Cây thư mục đích

```text
.
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   ├── verify-reset-otp.tsx
│   │   └── reset-password.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── profile/
│       │   ├── index.tsx
│       │   └── change-password.tsx
│       └── notes/
│           ├── index.tsx
│           ├── new.tsx
│           └── [id].tsx
├── src/
│   ├── components/
│   │   ├── AppScreen.tsx
│   │   ├── FormTextField.tsx
│   │   └── FullScreenStatus.tsx
│   ├── features/
│   │   ├── auth/{api.ts,schemas.ts,errors.ts,recovery.ts,recoveryStorage.ts,useSession.ts}
│   │   ├── profile/{api.ts,schemas.ts,queries.ts}
│   │   └── notes/{api.ts,schemas.ts,queries.ts}
│   ├── lib/{env.ts,supabase.ts,queryClient.ts}
│   ├── providers/AppProviders.tsx
│   └── types/database.ts
├── supabase/migrations/
│   └── 0001_account_manager.sql
├── docs/
├── .env.example
├── app.json
├── eslint.config.js
├── package.json
└── tsconfig.json
```

Không tạo thư mục/file trong cây này trước task tương ứng. `database.ts` được sinh từ schema Supabase sau migration, không viết type thủ công nếu CLI sinh type đã được cấu hình.

## Luồng dữ liệu

```text
Screen → React Hook Form + Zod → feature api.ts → Supabase JS
                                                   ├─ Auth
                                                   ├─ Postgres + RLS
                                                   └─ Storage + policy
Supabase response → React Query cache → trạng thái loading/error/data → Screen
Auth event → useSession → route guard trong layout → (auth) hoặc (app)
```

- Mutation thành công invalidate query key cụ thể: `['profile', userId]` hoặc `['notes', userId]`.
- Session là auth state, không đưa vào React Query; `useSession` đăng ký đúng một `onAuthStateChange` và cleanup subscription.
- Route guard chờ khôi phục session xong mới redirect để tránh nháy màn hình.
- Reset password dùng email + OTP 6 số: `resetPasswordForEmail` gửi mã, `verifyOtp({ email, token, type: 'recovery' })` tạo recovery session, rồi `updateUser` đổi mật khẩu. Deep link không nằm trên critical path.
- Lỗi mạng/API được `api.ts` ném lên; screen chuyển thành thông báo tiếng Việt, không lộ chi tiết bảo mật.

## Lý do chọn công nghệ

- **Expo SDK 57 + TypeScript strict:** một codebase React Native, vòng lặp phát triển nhanh và lỗi kiểu được phát hiện sớm.
- **expo-router:** route dựa trên file; nhóm `(auth)` và `(app)` biểu diễn trực tiếp trạng thái truy cập.
- **Supabase Auth/Postgres/Storage:** cùng một nền tảng cho danh tính, dữ liệu quan hệ, avatar và policy dựa trên `auth.uid()`; phù hợp demo RLS.
- **supabase-js v2 + AsyncStorage:** SDK chính thức để gọi Auth/Data/Storage; AsyncStorage duy trì session trên React Native.
- **React Hook Form + Zod:** giảm state form thủ công, schema dùng chung cho validate và thông báo lỗi.
- **TanStack Query:** cache/invalidate dữ liệu server, biểu diễn loading/error rõ ràng; không dùng cho form/session.
- **React Native Paper:** bộ component nhất quán, đủ cho UI bài tập mà không tạo design system riêng.

## Biến môi trường

Chỉ dùng hai biến public cần thiết cho client:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=false
```

- Commit `.env.example` với giá trị rỗng; `.env` và `.env.local` bị ignore.
- `src/lib/env.ts` đọc và kiểm tra ba biến ngay khi khởi tạo; thiếu/sai biến thì báo tên biến, không in giá trị.
- Cờ email confirmation chỉ điều khiển hành vi/thông báo của app; cấu hình thật vẫn phải tắt khi dev và bật khi demo trên Supabase Dashboard.
- Publishable/anon key được thiết kế để có mặt ở client nhưng **không phải** cơ chế phân quyền; RLS bảo vệ dữ liệu.
- Tuyệt đối không đưa `service_role`, database password, access token hoặc refresh token vào source/env client.
- Sau khi đổi env, khởi động lại Expo; không ghi key vào screenshot, DEVLOG hay báo cáo.
